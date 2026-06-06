import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extracts tenantId set by ApiKeyGuard onto the request object */
export const ApiKeyTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().tenantId;
  },
);

/** Extracts apiKeyId set by ApiKeyGuard onto the request object */
export const ApiKeyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().apiKeyId;
  },
);
