import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'hireai-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, traceId, ...meta }) => {
          const tid = traceId ? `[${traceId}] ` : '';
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${tid}${message}${extra}`;
        })
      ),
    }),
  ],
});

export function createTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
