import fs from 'node:fs';
import readline from 'node:readline';
import { config } from '../config.mjs';

export async function loadDmsRecords({ limit = Infinity, path = config.dataPath } = {}) {
  const stat = await fs.promises.stat(path);
  if (stat.size === 0) return [];

  if (path.toLowerCase().endsWith('.jsonl')) {
    return loadJsonl({ limit, path });
  }

  // Fallback: assume a JSON array
  const raw = await fs.promises.readFile(path, 'utf8');
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : Object.values(parsed);
  return Number.isFinite(limit) ? arr.slice(0, limit) : arr;
}

async function loadJsonl({ limit, path }) {
  const out = [];
  const rs = fs.createReadStream(path, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line || !line.trim()) continue;
    out.push(JSON.parse(line));
    if (out.length >= limit) break;
  }

  return out;
}

export function normalizeRawRecord(raw, asOf = config.asOfDate) {
  const deal = raw.dealRecords?.[0] ?? null;
  const service = {
    lubricantClass: raw.lubricantClass,
    oilServiceDays: raw.oilServiceDays,
    oilServiceMileage: raw.oilServiceMileage,
    basicServiceDays: raw.basicServiceDays,
    basicServiceMileage: raw.basicServiceMileage,
    midServiceDays: raw.midServiceDays,
    midServiceMileage: raw.midServiceMileage,
    fullServiceDays: raw.fullServiceDays,
    fullServiceMileage: raw.fullServiceMileage,
    serviceReferenceDate: raw.serviceReferenceDate,
    mostRecentServiceDate: raw.mostRecentServiceDate,
    startingMileage: raw.startingMileage,
    estimatedDailyMiles: raw.estimatedDailyMiles,
    serviceProgramMember: Boolean(raw.serviceProgramMember),
  };

  return {
    vehicleKey: raw.vehicleKey,
    tenantKey: raw.tenantKey,
    dealerKey: deal?.dealerKey ?? null,
    ownerReference: raw.ownerReference,
    customerReference: deal?.customerReference ?? raw.dataRecordKey,
    brandLabel: raw.brandLabel,
    currentlyOwned: Boolean(raw.currentlyOwned),
    isActive: Boolean(raw.isActive),
    sourceSystem: raw.sourceSystem,
    sales: deal
      ? {
          transactionKey: deal.transactionKey,
          status: deal.transactionStatus,
          category: deal.transactionCategory,
          dealAction: deal.dealAction,
          acquisitionDate: deal.acquisitionDate,
          agreementDate: deal.agreementDate,
          manufacturer: deal.manufacturer,
          model: deal.vehicleModel,
          year: deal.vehicleYear,
          segment: deal.vehicleSegment,
          condition: deal.vehicleConditionType,
          listPrice: deal.listPrice,
          vehicleCost: deal.vehicleCost,
          financedAmount: deal.financedAmount,
          interestRate: deal.interestRate,
          loanTermMonths: deal.loanTermMonths,
          initialPayment: deal.initialPayment,
          frontEndMargin: deal.frontEndMargin,
          backendMargin: deal.backendMargin,
          dealGrossProfit: deal.dealGrossProfit,
          inventoryKey: deal.inventoryKey,
        }
      : null,
    inventory: deal
      ? {
          inventoryKey: deal.inventoryKey,
          manufacturer: deal.manufacturer,
          model: deal.vehicleModel,
          year: deal.vehicleYear,
          segment: deal.vehicleSegment,
          listPrice: deal.listPrice,
        }
      : null,
    contact: {
      givenName: deal?.buyerGivenName ?? null,
      familyName: deal?.buyerFamilyName ?? null,
      email: deal?.buyerEmail ?? null,
      homePhoneReachable: Boolean(raw.homePhoneReachable),
      mobilePhoneReachable: Boolean(raw.mobilePhoneReachable),
      workPhoneReachable: Boolean(raw.workPhoneReachable),
      emailReachable: Boolean(raw.emailReachable),
      addressBlocked: Boolean(raw.addressBlocked),
      emailBlocked: Boolean(raw.emailBlocked),
      nameBlocked: Boolean(raw.nameBlocked),
      vehicleKeyBlocked: Boolean(raw.vehicleKeyBlocked),
      respectContactPreferences: Boolean(raw.respectContactPreferences),
      enableGlobalSuppression: Boolean(raw.enableGlobalSuppression),
    },
    service,
    asOf,
    raw,
  };
}

