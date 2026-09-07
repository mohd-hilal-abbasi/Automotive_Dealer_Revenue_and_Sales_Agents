import { config } from '../config.mjs';
import { daysBetween, monthsBetween, projectedMileage } from '../utils/dates.mjs';
import { computeServiceDue } from '../utils/opportunityLogic.mjs';

export function customerIntelligenceAgent(record) {
  const asOf = record.asOf;
  const contact = record.contact;
  const deal = record.sales;
  const svc = record.service;

  const name =
    [contact.givenName, contact.familyName].filter(Boolean).join(' ') || 'Unknown';

  const serviceDue = computeServiceDue(record, asOf);
  const refDate = svc?.serviceReferenceDate ?? record.asOf;
  const daysSinceRef = daysBetween(refDate, asOf);

  const monthsOwned =
    deal?.acquisitionDate ? monthsBetween(deal.acquisitionDate, asOf) : 0;
  const loanProgress =
    deal?.loanTermMonths ? Math.min(1, monthsOwned / deal.loanTermMonths) : 0;

  const suppressed =
    contact.enableGlobalSuppression &&
    (contact.addressBlocked ||
      contact.emailBlocked ||
      contact.nameBlocked ||
      contact.vehicleKeyBlocked);

  const channels = [];
  if (!suppressed && contact.respectContactPreferences) {
    if (contact.emailReachable && contact.email && !contact.emailBlocked) channels.push('email');
    if (contact.mobilePhoneReachable) {
      channels.push('sms', 'whatsapp');
      channels.push('call');
    } else if (contact.homePhoneReachable || contact.workPhoneReachable) {
      channels.push('call');
    }
  }

  const engagementScore = Math.min(
    1,
    (channels.length / 4) * 0.6 +
      (contact.emailReachable ? 0.2 : 0) +
      (svc?.serviceProgramMember ? 0.2 : 0.05)
  );

  const churnRisk = Math.min(
    1,
    (daysSinceRef > 180 ? 0.45 : daysSinceRef > 120 ? 0.25 : daysSinceRef > 60 ? 0.12 : 0) +
      (loanProgress > 0.6 ? 0.25 : 0) +
      (svc?.serviceProgramMember ? -0.1 : 0.15)
  );

  const valueScore = serviceDue.due ? Math.min(1, 0.45 + (serviceDue.overdueFactor * 0.25)) : 0.25;

  const preferredChannel = pickPreferredChannel(channels, churnRisk);

  return {
    agent: 'customer_intelligence',
    profile: {
      name,
      email: contact.email,
      brand: record.brandLabel,
      vehicle: record.sales
        ? `${record.sales.year} ${record.sales.manufacturer} ${record.sales.model}`
        : record.brandLabel,
    },
    customerReference: record.customerReference,
    vehicleKey: record.vehicleKey,
    signals: {
      suppressed,
      channels,
      preferredChannel,
      engagementScore: Number(engagementScore.toFixed(3)),
      churnRisk: Number(churnRisk.toFixed(3)),
      monthsOwned: Number(monthsOwned.toFixed(2)),
      loanProgress: Number(loanProgress.toFixed(3)),
      projectedMileage: serviceDue.projectedMileage,
      serviceDue,
    },
    scores: {
      engagement: Number(engagementScore.toFixed(3)),
      value: Number(valueScore.toFixed(3)),
      churnRisk: Number(churnRisk.toFixed(3)),
    },
  };
}

function pickPreferredChannel(channels, churnRisk) {
  if (!channels.length) return null;
  if (churnRisk >= 0.55 && channels.includes('call')) return 'call';
  if (channels.includes('whatsapp')) return 'whatsapp';
  if (channels.includes('sms')) return 'sms';
  if (channels.includes('email')) return 'email';
  return channels[0];
}

