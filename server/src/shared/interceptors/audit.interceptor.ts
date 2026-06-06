import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLog } from '../../AUDIT_LOGS/audit_logs.entity';
import { KEYNAMES } from '../constants/keynames';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    @Inject(KEYNAMES.AUDIT_LOGS)
    private readonly auditLogRepository: typeof AuditLog,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit CUD operations (POST, PUT, PATCH, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Extract audit metadata before the request
    const user = request.user;
    const tenantId = user?.tenant_id;
    const userId = user?.sub || user?.id;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const path = request.route?.path || request.url;

    // Capture old values for updates (from request body for now)
    const oldValues = method === 'PUT' || method === 'PATCH' ? request.body : null;

    return next.handle().pipe(
      tap({
        next: async (responseData) => {
          try {
            // Only create audit log if we have tenant and user info
            if (!tenantId || !userId) {
              return;
            }

            // Determine action from HTTP method
            let action = 'unknown';
            if (method === 'POST') action = 'create';
            else if (method === 'PUT' || method === 'PATCH') action = 'update';
            else if (method === 'DELETE') action = 'delete';

            // Extract module from path (e.g., /work-orders/:id -> work-orders)
            const module = this.extractModuleFromPath(path);
            if (!module) {
              return; // Skip if we can't determine the module
            }

            // Extract record_id from response or route params
            const recordId = this.extractRecordId(responseData, request);
            if (!recordId) {
              return; // Skip if we can't determine the record ID
            }

            // Extract new values from response
            const newValues = this.extractNewValues(responseData);

            // Create audit log entry asynchronously (don't block the response)
            setImmediate(async () => {
              try {
                await this.auditLogRepository.create({
                  tenant_id: tenantId,
                  user_id: userId,
                  action,
                  module,
                  record_id: recordId,
                  old_values: oldValues,
                  new_values: newValues,
                  ip_address: ipAddress,
                  user_agent: userAgent,
                });
              } catch (error) {
                // Log error but don't fail the request
                this.logger.error(
                  `Failed to create audit log: ${error.message}`,
                  error.stack,
                );
              }
            });
          } catch (error) {
            // Log error but don't fail the request
            this.logger.error(
              `Error in audit interceptor: ${error.message}`,
              error.stack,
            );
          }
        },
        error: () => {
          // Don't audit failed requests
        },
      }),
    );
  }

  private extractModuleFromPath(path: string): string | null {
    // Remove leading slash and extract first segment
    const segments = path.replace(/^\//, '').split('/');
    if (segments.length === 0) return null;

    // Get the first segment (e.g., "work-orders" from "/work-orders/:id")
    const module = segments[0];

    // Filter out non-module paths
    if (['auth', 'health', 'api', 'audit-logs'].includes(module)) {
      return null;
    }

    return module;
  }

  private extractRecordId(responseData: unknown, request: unknown): string | null {
    // Try to extract ID from response data
    if (responseData && typeof responseData === 'object') {
      // Handle DataResponseDto structure
      if ('data' in responseData && responseData.data) {
        const data = responseData.data;
        if (typeof data === 'object' && 'id' in data) {
          return (data as { id: string }).id;
        }
      }

      // Handle direct response with ID
      if ('id' in responseData) {
        return (responseData as { id: string }).id;
      }
    }

    // Fallback: extract from route params
    if (request && typeof request === 'object' && 'params' in request) {
      const params = (request as { params: Record<string, string> }).params;
      if (params && params.id) {
        return params.id;
      }
    }

    return null;
  }

  private extractNewValues(responseData: unknown): Record<string, unknown> | null {
    if (!responseData || typeof responseData !== 'object') {
      return null;
    }

    // Handle DataResponseDto structure
    if ('data' in responseData && responseData.data) {
      const data = responseData.data;
      if (typeof data === 'object') {
        return data as Record<string, unknown>;
      }
    }

    // Handle direct response
    return responseData as Record<string, unknown>;
  }
}
