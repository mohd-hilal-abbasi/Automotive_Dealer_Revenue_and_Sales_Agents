/** Convert unix seconds (or Date/ISO string) to Date */
export function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // treat values < 1e12 as seconds
    return new Date(value < 1e12 ? value * 1000 : value);
  }
  return new Date(value);
}

export function daysBetween(from, to) {
  const a = toDate(from).getTime();
  const b = toDate(to).getTime();
  return Math.floor((b - a) / 86_400_000);
}

export function monthsBetween(from, to) {
  return daysBetween(from, to) / 30.4375;
}

/** Projected current mileage from starting mileage + daily miles since reference */
export function projectedMileage(record, asOf) {
  const ref =
    record?.service?.serviceReferenceDate ??
    record?.serviceReferenceDate ??
    record?.initialUseDate;
  const days = Math.max(0, daysBetween(ref, asOf));
  const startingMileage = record?.service?.startingMileage ?? record?.startingMileage ?? 0;
  const estimatedDailyMiles =
    record?.service?.estimatedDailyMiles ?? record?.estimatedDailyMiles ?? 0;
  return Math.round(startingMileage + estimatedDailyMiles * days);
}

