import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from './audit-log.service';

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'pin',
  'oldPin',
  'newPin',
  'refreshToken',
  'accessToken',
  'token',
  'secret',
]);

function sanitizeBody(input: any): any {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) {
    return input.slice(0, 10).map((item) => sanitizeBody(item));
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(key)) {
      clean[key] = '[MASKED]';
    } else if (typeof val === 'string' && val.length > 200) {
      clean[key] = `${val.slice(0, 200)}...`;
    } else if (val && typeof val === 'object') {
      clean[key] = sanitizeBody(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function inferEntity(path: string): string {
  if (path.includes('feature-flags')) return 'FeatureFlag';
  if (path.includes('period-notifications')) return 'PeriodNotification';
  if (path.includes('support')) return 'SupportTicket';
  if (path.includes('subscription')) return 'Subscription';
  if (path.includes('retention')) return 'Retention';
  if (path.includes('admin/users') || path.includes('/users') || path.includes('bulk')) return 'User';
  if (path.includes('cycles')) return 'PeriodCycle';
  if (path.includes('reminders')) return 'Reminder';
  if (path.includes('qna')) return 'QnA';
  if (path.includes('discover')) return 'Article';
  if (path.includes('ai-providers') || path.includes('model-policies') || path.includes('quotas')) {
    return 'AIConfig';
  }
  if (path.includes('auth')) return 'Auth';
  return 'System';
}

function inferAction(method: string, path: string): string {
  if (path.startsWith('/auth/login')) return 'LOGIN';
  if (path.startsWith('/auth/register')) return 'CREATE';
  if (path.startsWith('/auth/logout')) return 'LOGOUT';
  if (path.includes('impersonate')) return 'USER_IMPERSONATION';
  if (method === 'POST') return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return method;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const method = (req.method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const rawUrl = (req.url || '').split('?')[0];
    if (
      rawUrl.startsWith('/auth/refresh') ||
      rawUrl.startsWith('/audit-logs') ||
      rawUrl.startsWith('/health')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          const userId =
            req.user?.id ||
            responseData?.user?.id ||
            undefined;
          const entity = inferEntity(rawUrl);
          const action = inferAction(method, rawUrl);
          const entityId =
            req.params?.id ||
            req.params?.key ||
            req.params?.userId ||
            responseData?.id ||
            responseData?.key ||
            undefined;

          const metadataJson = {
            method,
            path: rawUrl,
            body: req.body ? sanitizeBody(req.body) : undefined,
          };

          this.auditLogService
            .log({
              userId,
              action,
              entity,
              entityId: entityId ? String(entityId) : undefined,
              metadataJson,
            })
            .catch(() => {});
        },
        error: (err) => {
          const status = err?.status || err?.statusCode || 500;
          if (status < 500) return;

          const entity = inferEntity(rawUrl);
          this.auditLogService
            .log({
              userId: req.user?.id || undefined,
              action: 'SERVER_ERROR',
              entity,
              metadataJson: {
                method,
                path: rawUrl,
                status,
                message: String(err?.message || 'Internal Server Error').slice(0, 200),
              },
            })
            .catch(() => {});
        },
      }),
    );
  }
}
