import { config } from '../config.mjs';

export function salesOpportunityAgent(intelligence) {
  const deal = intelligence?.profile ? intelligence : null;
  // In this simplified demo, we rely on intelligence signals only.
  const monthsOwned = intelligence?.signals?.monthsOwned ?? 0;
  const churnRisk = intelligence?.scores?.churnRisk ?? 0;

  const loanProgress = intelligence?.signals?.serviceDue?.due
    ? intelligence.signals.loanProgress
    : intelligence?.signals?.loanProgress;

  const candidates = [];

  // trade-up: late in ownership/loan term
  if ((intelligence?.signals?.loanProgress ?? 0) >= 0.7) {
    candidates.push({
      sourceAgent: 'sales_agent',
      vehicleKey: intelligence.vehicleKey,
      customerReference: intelligence.customerReference,
      brand: intelligence.profile.brand,
      type: 'trade_up',
      label: 'Trade-up / upgrade offer',
      expectedRevenue: config.opportunityValue.trade_up,
      urgencyScore: Math.min(1, 0.4 + (intelligence.signals.loanProgress ?? 0) * 0.6),
      relevanceScore: Math.min(1, 0.4 + (1 - churnRisk) * 0.4),
      recommendedAction: 'OFFER_TRADE_UP',
    });
  }

  // refinance/lease end: if churnRisk high but loan exists; use it as a retention-ish sales event
  if ((intelligence.signals?.loanProgress ?? 0) >= 0.4 && churnRisk >= 0.35) {
    candidates.push({
      sourceAgent: 'sales_agent',
      vehicleKey: intelligence.vehicleKey,
      customerReference: intelligence.customerReference,
      brand: intelligence.profile.brand,
      type: 'refinance_or_lease_end',
      label: 'Refinance / lease-end assistance',
      expectedRevenue: config.opportunityValue.refinance_or_lease_end,
      urgencyScore: Math.min(1, 0.35 + churnRisk * 0.5),
      relevanceScore: Math.min(1, 0.45 + monthsOwned / 24),
      recommendedAction: 'OFFER_REFINANCE_OR_LEASE_END',
    });
  }

  // F&I upsell: if value score is decent but engagement moderate
  if ((intelligence.scores?.value ?? 0) >= 0.35 && (intelligence.scores?.engagement ?? 0) >= 0.25) {
    candidates.push({
      sourceAgent: 'sales_agent',
      vehicleKey: intelligence.vehicleKey,
      customerReference: intelligence.customerReference,
      brand: intelligence.profile.brand,
      type: 'fni_upsell',
      label: 'F&I add-on bundle (warranty / protection)',
      expectedRevenue: config.opportunityValue.fni_upsell,
      urgencyScore: 0.35,
      relevanceScore: Math.min(1, 0.35 + intelligence.scores.engagement * 0.6),
      recommendedAction: 'OFFER_FI_UPSELL',
    });
  }

  return candidates;
}

