import * as Sentry from '@sentry/node';
import { env, logger } from '../config/index.js';

export interface SentryErrorContext {
  requestId?: string;
  userId?: string;
  userRole?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  extra?: Record<string, unknown>;
}

export class SentryService {
  private initialized = false;

  init(): void {
    if (!env.SENTRY_DSN) {
      logger.info('SENTRY_DSN not configured; Sentry error tracking running in no-op mode');
      return;
    }

    try {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT,
        release: `kaamsetu-api@${env.APP_VERSION}`,
        tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
        beforeSend(event, hint) {
          // Filter out client 4xx operational errors that are not actionable bugs
          const err = hint.originalException;
          if (err && typeof err === 'object' && 'statusCode' in err) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status && status >= 400 && status < 500) {
              return null; // Do not report 4xx client errors to Sentry
            }
          }
          return event;
        },
      });

      this.initialized = true;
      logger.info(
        { environment: env.SENTRY_ENVIRONMENT },
        'Sentry error tracking initialized successfully'
      );
    } catch (err) {
      logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Failed to initialize Sentry'
      );
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  captureException(error: unknown, context: SentryErrorContext = {}): string | undefined {
    if (!this.initialized) {
      return undefined;
    }

    return Sentry.withScope((scope) => {
      if (context.requestId) {
        scope.setTag('requestId', context.requestId);
      }
      if (context.route) {
        scope.setTag('route', context.route);
      }
      if (context.method) {
        scope.setTag('method', context.method);
      }
      if (context.statusCode) {
        scope.setTag('statusCode', String(context.statusCode));
      }
      if (context.userId) {
        scope.setUser({ id: context.userId, role: context.userRole });
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }

      return Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context: SentryErrorContext = {}): string | undefined {
    if (!this.initialized) {
      return undefined;
    }

    return Sentry.withScope((scope) => {
      if (context.requestId) {
        scope.setTag('requestId', context.requestId);
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }
      return Sentry.captureMessage(message, level);
    });
  }

  async close(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return true;
    return Sentry.close(timeout);
  }
}

export const sentryService = new SentryService();
