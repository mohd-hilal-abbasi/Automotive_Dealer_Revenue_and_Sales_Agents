import { config } from '../config.mjs';

export function decisionAgent({ intelligence, candidates, campaignCount = 0 }) {
  if (!intelligence || intelligence.signals?.suppressed) {
    return { selected: null, reason: 'Suppressed by contact preferences / suppression rules.' };
  }

  if (!candidates?.length) {
    return { selected: null, reason: 'No revenue opportunities detected.' };
  }

  if (campaignCount >= config.decision.maxCampaigns) {
    return { selected: null, reason: 'Campaign limit reached.' };
  }

  const engagement = intelligence.scores.engagement ?? 0;
  const churnRisk = intelligence.scores.churnRisk ?? 0;

  const scored = candidates
    .map((c) => {
      // Encourage service when engagement/value are high.
      const churnPenalty = c.type === 'loyalty_retention' ? 1 : 1 - churnRisk * 0.35;
      const finalScore = c.urgencyScore * 0.35 + c.relevanceScore * 0.45 + engagement * 0.25;
      return { ...c, finalScore: Number((finalScore * churnPenalty).toFixed(4)) };
    })
    .sort((a, b) => b.finalScore - a.finalScore);

  const top = scored[0];
  const minScore = config.decision.minScore;
  if (top.finalScore < minScore) {
    return { selected: null, reason: `Top candidate below threshold (${top.finalScore} < ${minScore}).` };
  }

  return {
    selected: {
      ...top,
      decisionScore: top.finalScore,
    },
    reason: 'Selected best opportunity under decision thresholds.',
    allConsidered: scored.slice(0, 5),
  };
}

