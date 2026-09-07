import { config } from '../config.mjs';

export function campaignAgent({ intelligence, selected, campaignId = 0, dryRun = false }) {
  if (!selected) return { campaign: null, job: null };
  const channel = intelligence?.signals?.preferredChannel;
  if (!channel) {
    return {
      campaign: null,
      job: null,
      reason: 'No reachable channel available for this customer.',
    };
  }

  const contactName = intelligence?.profile?.name ?? '';
  const brand = intelligence?.profile?.brand ?? selected.brand ?? '';
  const template = config.messageTemplates[channel];
  if (!template) throw new Error(`No message template for channel ${channel}`);

  const message = template(contactName.split(' ')[0] || contactName, selected.label, brand);

  const job = {
    campaignId,
    vehicleKey: selected.vehicleKey,
    customerReference: selected.customerReference,
    channel,
    actionType: selected.type,
    message,
    candidate: selected,
    dryRun,
  };

  return {
    campaign: {
      campaignId,
      actionType: selected.type,
      label: selected.label,
      channel,
      status: dryRun ? 'PLANNED' : 'SCHEDULED',
    },
    job,
  };
}

