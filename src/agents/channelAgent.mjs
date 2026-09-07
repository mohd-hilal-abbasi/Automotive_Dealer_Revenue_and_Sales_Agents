import { config } from '../config.mjs';
import { bernoulli } from '../utils/rng.mjs';

export function channelAgent({ job, dryRun = false }) {
  const { vehicleKey, actionType, channel, candidate } = job;
  const channelPerf = config.channels[channel];
  if (!channelPerf) throw new Error(`Unknown channel: ${channel}`);

  if (dryRun) {
    return {
      delivered: false,
      opened: false,
      converted: false,
      cost: 0,
      realizedRevenue: 0,
      status: 'DRY_RUN',
    };
  }

  const deliverProb = 0.98;
  const openProb = Math.min(0.97, channelPerf.openRate * (0.55 + candidate.urgencyScore * 0.75));
  const convertProb = Math.min(
    0.7,
    channelPerf.convertRate * (1.1 + candidate.urgencyScore * 1.3)
  );

  const seedBase = `${vehicleKey}:${actionType}:${channel}:${candidate.type}`;
  const delivered = bernoulli(deliverProb, seedBase + ':delivered');
  const opened = delivered ? bernoulli(openProb, seedBase + ':opened') : false;
  const converted = opened ? bernoulli(convertProb, seedBase + ':converted') : false;

  return {
    delivered,
    opened,
    converted,
    cost: channelPerf.costPerSend,
    realizedRevenue: converted ? candidate.expectedRevenue : 0,
    status: converted ? 'CONVERTED' : delivered ? 'DELIVERED_NO_CONVERSION' : 'NOT_DELIVERED',
  };
}

