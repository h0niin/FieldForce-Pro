import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../../API_KEYS/api_keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const result = await this.apiKeysService.validateKey(rawKey);
    if (!result) {
      throw new UnauthorizedException('Invalid, expired, or revoked API key');
    }

    // Attach context to request so controller/service can read it
    request.tenantId = result.tenantId;
    request.apiKeyId = result.apiKeyId;
    request.apiKeyScopes = result.scopes;

    return true;
  }
}
