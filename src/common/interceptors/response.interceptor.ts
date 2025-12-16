// src/interceptors/response.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { formatResponse } from '../util/response-formatting.utils';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
      context: ExecutionContext,
      next: CallHandler,
  ): Observable<any> {
      return next.handle().pipe(
          map((data) => {
              const ctx = context.switchToHttp();
              const response = ctx.getResponse();
              const statusCode = response.statusCode || 200;
              const message = (typeof data == 'string') ? data : (data?.message || 'Request successful');

              return formatResponse({
                  statusCode,
                  message,
                  data: (typeof data !== 'string') ? data : null,
              });
          }),
      );
  }
}
