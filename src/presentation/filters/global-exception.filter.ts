import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ContextAwareLoggerService } from "../../infra/logging/context-aware-logger.service";

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly defaultLogger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly customLogger?: ContextAwareLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const logger = this.customLogger || this.defaultLogger;

    // Extract trace context if available
    const { traceId, spanId } = (request as any).traceContext || {};
    const clientIp = request.ip || request.connection.remoteAddress;

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      // Handle known HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        error = HttpStatus[status] || "HTTP Exception";
      } else {
        message = (exceptionResponse as any).message || exception.message;
        error =
          (exceptionResponse as any).error ||
          HttpStatus[status] ||
          "HTTP Exception";
      }

      // Log HTTP exceptions with context
      if (this.customLogger) {
        this.customLogger.logSecurityEvent({
          event: "http_exception",
          severity: status >= 500 ? "high" : status >= 400 ? "medium" : "low",
          statusCode: status,
          message: Array.isArray(message) ? message.join(", ") : message,
          endpoint: `${request.method} ${request.url}`,
          userAgent: request.headers["user-agent"],
          clientIp,
          traceId,
          details: {
            exceptionType: exception.constructor.name,
            stack: exception.stack,
          },
        });
      } else {
        this.defaultLogger.error(
          `HTTP ${status}: ${JSON.stringify(message)}`,
          exception.stack,
          `${request.method} ${request.url}`
        );
      }
    } else {
      // Handle unexpected errors (sensitive - don't expose details)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "Internal server error occurred";
      error = "Internal Server Error";

      // Log unexpected errors with full context
      if (this.customLogger) {
        this.customLogger.logSecurityEvent({
          event: "unexpected_error",
          severity: "critical",
          statusCode: status,
          message:
            exception instanceof Error ? exception.message : String(exception),
          endpoint: `${request.method} ${request.url}`,
          userAgent: request.headers["user-agent"],
          clientIp,
          traceId,
          spanId,
          details: {
            stack: exception instanceof Error ? exception.stack : undefined,
            exceptionType: exception?.constructor?.name || typeof exception,
          },
        });
      } else {
        this.defaultLogger.error(
          `Unexpected error: ${exception}`,
          exception instanceof Error ? exception.stack : undefined,
          `${request.method} ${request.url}`
        );
      }
    }

    // Enhanced error response with trace ID for debugging
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      ...(traceId && { traceId }), // Include trace ID for client debugging
    };

    response.status(status).json(errorResponse);
  }
}
