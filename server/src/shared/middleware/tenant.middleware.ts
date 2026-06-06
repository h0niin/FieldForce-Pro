import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Tenant ID is extracted from JWT payload in the auth strategy.
    // This middleware can be extended to also check for tenant header.
    const tenantHeader = req.headers['x-tenant-id'] as string;
    if (tenantHeader) {
      (req as unknown as Record<string, unknown>).tenantId = tenantHeader;
    }
    next();
  }
}
