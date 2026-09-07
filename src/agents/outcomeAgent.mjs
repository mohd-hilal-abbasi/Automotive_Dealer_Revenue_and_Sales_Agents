export function outcomeAgent({ job, channelResult }) {
  if (!job || !job.candidate) {
    return { outcome: null };
  }

  const candidate = job.candidate;
  const { converted, realizedRevenue, cost, status } = channelResult;

  const revenue = realizedRevenue;
  const netProfit = revenue - cost;
  const roi = cost > 0 ? revenue / cost : 0;

  return {
    outcome: {
      vehicleKey: job.vehicleKey,
      customerReference: job.customerReference,
      actionType: job.actionType,
      channel: job.channel,
      converted,
      revenue,
      cost,
      netProfit,
      roi,
      deliveryStatus: status,
      // Lightweight learning signal for future decisioning
      learning: {
        opportunityType: candidate.type,
        expectedRevenue: candidate.expectedRevenue,
        realizedRevenue: revenue,
        roi,
      },
    },
  };
}

