import { config } from '../config.mjs';

export function serviceOpportunityAgent(intelligence) {
  const due = intelligence?.signals?.serviceDue;
  if (!due?.due) return [];

  const projectedMileage = due.projectedMileage;
  const overdueFactor = due.overdueFactor ?? 1;

  const base = {
    sourceAgent: 'service_agent',
    vehicleKey: intelligence.vehicleKey,
    customerReference: intelligence.customerReference,
    brand: intelligence.profile.brand,
    projectedMileage,
    overdueFactor,
  };

  // Primary due opportunity
  const primary = {
    ...base,
    type: due.dueKey,
    label: due.label,
    expectedRevenue: config.opportunityValue[due.dueKey] ?? 0,
    urgencyScore: Math.min(1, 0.35 + overdueFactor * 0.2),
    relevanceScore: Math.min(1, 0.5 + intelligence.scores.value * 0.35),
    recommendedAction: due.dueKey === 'full_service' ? 'BOOK_SERVICE' : 'BOOK_SERVICE',
  };

  const candidates = [primary];

  // Optional: service plan conversion if full due and not already a member.
  if (due.stage === 'full' && !intelligence.signals?.serviceProgramMember) {
    const plan = {
      ...base,
      type: 'service_plan',
      label: 'Service plan enrollment (bundled maintenance)',
      expectedRevenue: config.opportunityValue.service_plan,
      urgencyScore: Math.min(1, 0.25 + overdueFactor * 0.15),
      relevanceScore: Math.min(1, 0.45 + intelligence.scores.engagement * 0.3),
      recommendedAction: 'ENROLL_SERVICE_PLAN',
    };
    candidates.push(plan);
  }

  return candidates;
}

