import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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
    } else {
      // Handle unexpected errors (sensitive - don't expose details)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "Internal server error occurred";
      error = "Internal Server Error";

      // Log the actual error for debugging
      this.logger.error(
        `Unexpected error: ${exception}`,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${request.url}`
      );
    }

    // Log the error response
    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)}`,
      `${request.method} ${request.url}`
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    });
  }
}
