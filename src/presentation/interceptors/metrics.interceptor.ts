import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { FinancialMetricsService } from '../../infra/metrics/financial-metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: FinancialMetricsService) {}

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
