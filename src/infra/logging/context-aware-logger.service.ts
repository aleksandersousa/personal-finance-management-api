import { Injectable, LoggerService } from "@nestjs/common";
import * as winston from "winston";

export interface BusinessEvent {
  event: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
  duration?: number;
  [key: string]: any;
}

export interface SecurityEvent {
  event: string;
  severity: "low" | "medium" | "high" | "critical";
  traceId?: string;
  clientIp?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface PerformanceEvent {
  event: string;
  duration: number;
  endpoint?: string;
  traceId?: string;
  [key: string]: any;
}

@Injectable()
export class ContextAwareLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  logBusinessEvent(event: BusinessEvent) {
    this.logger.info({
      type: "business_event",
      timestamp: new Date().toISOString(),
      ...event,
    });
  }

  logSecurityEvent(event: SecurityEvent) {
    this.logger.warn({
      type: "security_event",
      timestamp: new Date().toISOString(),
      ...event,
    });
  }

  logPerformanceEvent(event: PerformanceEvent) {
    this.logger.info({
      type: "performance_event",
      timestamp: new Date().toISOString(),
      ...event,
    });
  }
}
