import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import type { Metrics } from '@/data/protocols';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(@Inject('Metrics') private readonly metricsService: Metrics) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Record HTTP request metrics
        this.metricsService.recordHttpRequest(
          method,
          route,
          statusCode,
          duration,
        );
      }),
    );
  }
}
