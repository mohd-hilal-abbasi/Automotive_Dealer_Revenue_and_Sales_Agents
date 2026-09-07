import { config } from '../config.mjs';

export function retentionOpportunityAgent(intelligence) {
  const churnRisk = intelligence?.scores?.churnRisk ?? 0;
  const engagement = intelligence?.scores?.engagement ?? 0;
  const channels = intelligence?.signals?.channels ?? [];

  if (!channels.length) return [];
  if (churnRisk < 0.45) return [];

  // In a real system: retention might depend on explicit opt-outs, service lapses, etc.
  const candidate = {
    sourceAgent: 'retention_agent',
    vehicleKey: intelligence.vehicleKey,
    customerReference: intelligence.customerReference,
    brand: intelligence.profile.brand,
    type: 'loyalty_retention',
    label: 'Retention check-in (thank-you + next service reminder)',
    expectedRevenue: config.opportunityValue.loyalty_retention,
    urgencyScore: Math.min(1, 0.25 + churnRisk * 0.7),
    relevanceScore: Math.min(1, 0.3 + engagement * 0.5),
    recommendedAction: 'SEND_RETENTION_MESSAGE',
  };

  return [candidate];
}

