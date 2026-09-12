import pino, { Logger, LoggerOptions } from 'pino';

export interface CreateLoggerOptions {
  level?: string;
  isProduction?: boolean;
  serviceName?: string;
}

const SENSITIVE_KEYS = [
  'password',
  'passwordConfirm',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'cookie',
  'set-cookie',
  'secret',
  'apiKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'otp',
  'code',
  'pin',
  'aadhaar',
  'pan',
  'ssn',
  'bankAccount',
  'secretKey',
  'accessKey',
  'sessionSecret',
  'privateKey',
  'verificationDocument',
  'documentUrl',
  'documents',
  'paymentSecret',
  'clientSecret',
  'razorpaySignature',
  'webhookSecret',
];

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const {
    level = process.env['LOG_LEVEL'] || 'info',
    isProduction = process.env['NODE_ENV'] === 'production',
    serviceName = 'kaamsetu-api',
  } = options;

  const pinoOptions: LoggerOptions = {
    level,
    base: {
      service: serviceName,
      env: isProduction ? 'production' : (process.env['NODE_ENV'] || 'development'),
    },
    redact: {
      paths: SENSITIVE_KEYS.flatMap((key) => [
        key,
        `*.${key}`,
        `*.*.${key}`,
        `*.*.*.${key}`,
        `req.headers.${key.toLowerCase()}`,
        `req.headers["${key.toLowerCase()}"]`,
        `req.body.${key}`,
        `req.body.${key.toLowerCase()}`,
      ]),
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  };

  return pino(pinoOptions);
}

export const logger = createLogger();
export type { Logger };
