import { daysBetween, projectedMileage } from './dates.mjs';

export function computeServiceDue(record, asOf) {
  const svc = record.service;
  if (!svc) return { due: false, stage: null };

  const refDate = svc.serviceReferenceDate ?? record.asOf ?? asOf;
  const daysSinceRef = daysBetween(refDate, asOf);
  const projected = projectedMileage(record, asOf);

  const checks = [
    {
      stage: 'oil',
      days: svc.oilServiceDays,
      miles: svc.oilServiceMileage,
      dueKey: 'service_due',
      label: 'Oil change due',
    },
    {
      stage: 'basic',
      days: svc.basicServiceDays,
      miles: svc.basicServiceMileage,
      dueKey: 'service_due',
      label: 'Basic service due',
    },
    {
      stage: 'mid',
      days: svc.midServiceDays,
      miles: svc.midServiceMileage,
      dueKey: 'mid_service',
      label: 'Mid service due',
    },
    {
      stage: 'full',
      days: svc.fullServiceDays,
      miles: svc.fullServiceMileage,
      dueKey: 'full_service',
      label: 'Full service due',
    },
  ];

  // Choose the most advanced stage that is due (by days OR projected miles).
  let chosen = null;
  for (const c of checks) {
    const dueByDays = daysSinceRef >= c.days;
    const dueByMiles = projected >= c.miles;
    if (dueByDays || dueByMiles) chosen = c;
  }

  if (!chosen) return { due: false, stage: null, projectedMileage: projected, daysSinceRef };

  const overdueByDays = daysSinceRef / chosen.days;
  const overdueByMiles = projected / chosen.miles;
  const overdueFactor = Math.max(overdueByDays, overdueByMiles);

  return {
    due: true,
    stage: chosen.stage,
    dueKey: chosen.dueKey,
    label: chosen.label,
    projectedMileage: projected,
    daysSinceRef,
    overdueFactor: Number(overdueFactor.toFixed(3)),
  };
}

