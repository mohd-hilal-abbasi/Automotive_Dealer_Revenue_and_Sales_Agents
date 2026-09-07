const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

export function createLogger({ verbose = false } = {}) {
  const minLevel = verbose ? LEVELS.debug : LEVELS.info;

  function emit(level, msg, meta) {
    if (LEVELS[level] < minLevel) return;
    const ts = new Date().toISOString();
    const line = `[${ts}] ${level.toUpperCase()} ${msg}${meta !== undefined ? ` ${JSON.stringify(meta)}` : ''}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  return {
    debug: (msg, meta) => emit('debug', msg, meta),
    info: (msg, meta) => emit('info', msg, meta),
    warn: (msg, meta) => emit('warn', msg, meta),
    error: (msg, meta) => emit('error', msg, meta),
  };
}

