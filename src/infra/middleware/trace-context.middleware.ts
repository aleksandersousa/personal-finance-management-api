import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// Extend Request interface to include traceContext
declare global {
  namespace Express {
    interface Request {
      traceContext?: {
        traceId: string;
        spanId: string;
      };
    }
  }
}

@Injectable()
export class TraceContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or preserve traceId from headers
    const traceId = (req.headers["x-trace-id"] as string) || randomUUID();
    const spanId = randomUUID().split("-")[0];

    // Set trace context on request
    req.traceContext = { traceId, spanId };

    // Add headers for propagation to downstream services
    res.setHeader("x-trace-id", traceId);
    res.setHeader("x-span-id", spanId);

    // Security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    next();
  }
}
