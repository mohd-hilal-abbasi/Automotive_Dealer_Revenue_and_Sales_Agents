import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function defaultDataPath() {
  const jsonl = path.join(root, 'vehicle_records_10k.jsonl');
  const json = path.join(root, 'vehicle_records_10k.json');
  // Prefer jsonl if present
  if (fs.existsSync(jsonl)) return jsonl;
  return fs.existsSync(json) ? json : jsonl;
}

export const config = {
  dataPath: defaultDataPath(),
  outputDir: path.join(root, 'output'),

  /**
   * "As of" date used to compute aging / due opportunities against synthetic epoch dates.
   * (Synthetic dataset uses 2026-05-01 serviceReferenceDate / acquisitionDate)
   */
  asOfDate: new Date('2026-09-03T00:00:00Z'),

  decision: {
    minScore: 0.35,
    maxActionsPerCustomer: 1,
    /** Hard stop to prevent spamming in the demo runner */
    maxCampaigns: 5000,
  },

  /** Revenue model used by Outcome Agent for ROI learning */
  opportunityValue: {
    service_due: 280,
    mid_service: 650,
    full_service: 1200,
    service_plan: 899,
    trade_up: 4500,
    refinance_or_lease_end: 1800,
    loyalty_retention: 350,
    fni_upsell: 950,
  },

  /** Channel performance model (simulated) */
  channels: {
    email: { costPerSend: 0.02, openRate: 0.28, convertRate: 0.04 },
    sms: { costPerSend: 0.04, openRate: 0.65, convertRate: 0.06 },
    whatsapp: { costPerSend: 0.05, openRate: 0.72, convertRate: 0.07 },
    call: { costPerSend: 2.5, openRate: 0.45, convertRate: 0.12 },
  },

  /** Text templates for simulated communications */
  messageTemplates: {
    email: (name, actionLabel, brand) =>
      `Hi ${name || 'there'} — ${brand} service offer: ${actionLabel}. Reply YES to book.`,
    sms: (name, actionLabel, brand) =>
      `Hi ${name || ''} — ${brand}: ${actionLabel}. Reply YES to book.`,
    whatsapp: (name, actionLabel, brand) =>
      `Hi ${name || ''} — ${brand}: ${actionLabel}. Want to book? Reply YES.`,
    call: (name, actionLabel, brand) =>
      `Call script for ${name || 'customer'} (${brand}): Offer ${actionLabel}, confirm availability.`,
  },
};

