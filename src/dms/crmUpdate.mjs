import fs from 'node:fs/promises';

export class CrmUpdateStore {
  #updates = [];

  apply({ vehicleKey, actionType, channel, message, status, meta = {} }) {
    const entry = {
      vehicleKey,
      actionType,
      channel,
      message,
      status,
      meta,
      createdAt: new Date().toISOString(),
    };
    this.#updates.push(entry);
    return entry;
  }

  getAll() {
    return [...this.#updates];
  }

  async writeToDisk(outputDir) {
    await fs.mkdir(outputDir, { recursive: true });
    const outPath = `${outputDir.replace(/\\+$/, '')}\\crm_updates.json`;
    await fs.writeFile(outPath, JSON.stringify(this.#updates, null, 2), 'utf8');
    return outPath;
  }
}

