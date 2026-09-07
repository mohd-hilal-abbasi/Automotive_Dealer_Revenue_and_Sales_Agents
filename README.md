# Autonomous Dealer Revenue Agent (Node 24+, ESM .mjs)

This project reads a DMS/CRM export (`vehicle_records_10k.jsonl` by default) and runs an **agent pipeline** to:

1. Build **Customer Intelligence** (service due, reachability, churn risk)
2. Generate **Revenue Opportunities** (Sales / Service / Retention)
3. Use a **Decision Agent** to pick one best action per customer
4. Use a **Campaign / Action Agent** to select a communication channel
5. Simulate **Email / SMS / WhatsApp / Call**
6. Write a **DMS/CRM update** (simulated) and compute **Outcome / ROI learning**

## Requirements

- Node.js **24+**
- Project runs as ESM (`type: "module"` + `.mjs` files)

## How to run

```bash
node src/index.mjs --limit=50 --dry-run --verbose
node src/index.mjs --limit=200
```

### CLI flags

- `--limit=<n>`: process first *n* records (default: all)
- `--dry-run`: do not simulate conversions (no ROI); still produces the decision plan
- `--verbose`: more logs

## Output

All results are written to:

- `output/crm_updates.json` — simulated DMS/CRM update events
- `output/run_results.json` — aggregated ROI + per-run summary

## Data format

- `.jsonl`: one JSON object per line (this repo uses this)
- `.json`: a JSON array (supported as fallback)

