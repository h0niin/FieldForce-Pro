import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  statusCode: number;
  status: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has our response structure, pass through
        if (data && typeof data === 'object' && 'statusCode' in data && 'status' in data) {
          return data;
        }

        const statusCode = context.switchToHttp().getResponse().statusCode;

        return {
          statusCode,
          status: true,
          message: 'Success',
          data,
        };
      }),
    );
  }
}
