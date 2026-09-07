import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.mjs';
import { createLogger } from './utils/logger.mjs';
import { loadDmsRecords, normalizeRawRecord } from './dms/dataLoader.mjs';
import { customerIntelligenceAgent } from './agents/customerIntelligenceAgent.mjs';
import { serviceOpportunityAgent } from './agents/serviceOpportunityAgent.mjs';
import { salesOpportunityAgent } from './agents/salesOpportunityAgent.mjs';
import { retentionOpportunityAgent } from './agents/retentionOpportunityAgent.mjs';
import { decisionAgent } from './agents/decisionAgent.mjs';
import { campaignAgent } from './agents/campaignAgent.mjs';
import { channelAgent } from './agents/channelAgent.mjs';
import { outcomeAgent } from './agents/outcomeAgent.mjs';
import { CrmUpdateStore } from './dms/crmUpdate.mjs';

function parseArgs(argv) {
  const out = { limit: Infinity, verbose: false, dryRun: false };
  for (const a of argv) {
    if (a === '--verbose' || a === '-v') out.verbose = true;
    else if (a === '--dry-run' || a === '--dry') out.dryRun = true;
    else if (a.startsWith('--limit=')) out.limit = Number(a.split('=')[1]);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const log = createLogger({ verbose: args.verbose });

  await fs.mkdir(config.outputDir, { recursive: true });

  log.info('Loading DMS records', { path: config.dataPath, limit: args.limit });
  const raw = await loadDmsRecords({ limit: args.limit, path: config.dataPath });

  const crm = new CrmUpdateStore();
  const results = [];

  let campaignCount = 0;
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    const record = normalizeRawRecord(r, config.asOfDate);

    const intelligence = customerIntelligenceAgent(record);

    const candidates = [
      ...serviceOpportunityAgent(intelligence),
      ...salesOpportunityAgent(intelligence),
      ...retentionOpportunityAgent(intelligence),
    ];

    const decision = decisionAgent({ intelligence, candidates, campaignCount });
    if (!decision.selected) continue;

    const campaignId = ++campaignCount;
    const { job } = campaignAgent({
      intelligence,
      selected: decision.selected,
      campaignId,
      dryRun: args.dryRun,
    });

    if (!job) continue;

    log.debug('Pipeline decision', {
      vehicleKey: job.vehicleKey,
      actionType: job.actionType,
      channel: job.channel,
      dryRun: args.dryRun,
    });

    const channelResult = channelAgent({ job, dryRun: args.dryRun });

    const { outcome } = outcomeAgent({ job, channelResult });

    crm.apply({
      vehicleKey: job.vehicleKey,
      actionType: job.actionType,
      channel: job.channel,
      message: job.message,
      status: channelResult.status,
      meta: {
        candidateType: job.candidate.type,
        expectedRevenue: job.candidate.expectedRevenue,
        converted: channelResult.converted,
        delivered: channelResult.delivered,
        opened: channelResult.opened,
        cost: channelResult.cost,
        realizedRevenue: channelResult.realizedRevenue,
      },
    });

    results.push({
      index: i,
      intelligence,
      candidates,
      decision,
      campaign: {
        campaignId,
        actionType: job.actionType,
        label: job.candidate.label,
        channel: job.channel,
        status: args.dryRun ? 'PLANNED' : 'SCHEDULED',
      },
      channelResult,
      outcome,
    });
  }

  const updatesOut = await crm.writeToDisk(config.outputDir);

  const learning = aggregateLearning(results);
  const runOut = path.join(config.outputDir, 'run_results.json');
  await fs.writeFile(runOut, JSON.stringify({ summary: learning, resultsCount: results.length, updatesOut }, null, 2), 'utf8');

  console.log('Done.');
  console.log('CRM updates:', updatesOut);
  console.log('Summary:', JSON.stringify(learning, null, 2));
}

function aggregateLearning(results) {
  const byType = {};
  let delivered = 0;
  let opened = 0;
  let converted = 0;
  let totalCost = 0;
  let totalRevenue = 0;

  for (const r of results) {
    const { channelResult } = r;
    if (!channelResult) continue;
    const t = r.decision?.selected?.type ?? r.outcome?.learning?.opportunityType ?? 'unknown';
    byType[t] ??= { count: 0, expectedRevenue: 0, realizedRevenue: 0, cost: 0, converted: 0 };

    byType[t].count += 1;
    const expected = r.decision?.selected?.expectedRevenue ?? 0;
    byType[t].expectedRevenue += expected;
    byType[t].realizedRevenue += channelResult.realizedRevenue;
    byType[t].cost += channelResult.cost;
    if (channelResult.converted) byType[t].converted += 1;

    if (channelResult.delivered) delivered++;
    if (channelResult.opened) opened++;
    if (channelResult.converted) converted++;
    totalCost += channelResult.cost;
    totalRevenue += channelResult.realizedRevenue;
  }

  const roi = totalCost > 0 ? totalRevenue / totalCost : 0;
  return {
    totals: {
      attempts: results.length,
      delivered,
      opened,
      converted,
      totalCost,
      totalRevenue,
      roi,
    },
    byOpportunityType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [
        k,
        {
          count: v.count,
          converted: v.converted,
          expectedRevenue: v.expectedRevenue,
          realizedRevenue: v.realizedRevenue,
          cost: v.cost,
          roi: v.cost > 0 ? v.realizedRevenue / v.cost : 0,
        },
      ])
    ),
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

