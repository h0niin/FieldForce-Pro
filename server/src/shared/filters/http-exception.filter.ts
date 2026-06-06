import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// Node.js connection-level error codes that indicate a transient DB/network issue.
// We never want to leak these raw strings to API consumers.
const CONNECTION_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'PROTOCOL_CONNECTION_LOST',
]);

function isConnectionError(err: Error): boolean {
  // err.code is present on Node.js system errors
  const code = (err as NodeJS.ErrnoException).code ?? '';
  if (CONNECTION_ERROR_CODES.has(code)) return true;
  // Sequelize wraps some errors where the code ends up in the message
  return CONNECTION_ERROR_CODES.has(err.message?.trim());
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string) || exception.message;
        errors = res.errors || null;

        // Handle class-validator errors
        if (Array.isArray(res.message)) {
          message = 'Validation failed';
          errors = res.message;
        }
      }
    } else if (exception instanceof Error) {
      if (isConnectionError(exception)) {
        // Transient DB/network error — return 503 and keep the raw error out of the response
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Service temporarily unavailable. Please try again.';
        this.logger.error(
          `Database connection error [${(exception as NodeJS.ErrnoException).code ?? exception.message}]`,
          exception.stack,
        );
      } else {
        message = 'Internal server error';
        this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      }
    }

    response.status(status).json({
      statusCode: status,
      status: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}
