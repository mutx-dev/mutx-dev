// Minimal logger stub — replace with real implementation
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

function format(level: LogLevel, msg: string, meta?: object) {
  const out = { level, msg, ts: new Date().toISOString(), ...meta }
  if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
    console.log(JSON.stringify(out))
  }
}

export const logger = {
  debug: (msg: string, meta?: object) => format('debug', msg, meta),
  info:  (msg: string, meta?: object) => format('info', msg, meta),
  warn:  (msg: string, meta?: object) => format('warn', msg, meta),
  error: (msg: string, meta?: object) => format('error', msg, meta),
}
