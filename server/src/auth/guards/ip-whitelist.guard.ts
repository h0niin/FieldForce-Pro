import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { networkInterfaces } from 'os';
import { IS_PUBLIC_KEY } from '../../shared/decorator/public.decorator';
import { IPWhitelistService } from '../../IP_WHITELIST/ip-whitelist.service';

@Injectable()
export class IPWhitelistGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private ipWhitelistService: IPWhitelistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenant_id) {
      return true;
    }

    const tenantId = user.tenant_id;

    const enabled = await this.ipWhitelistService.isEnabled(tenantId);
    if (!enabled) {
      return true;
    }

    const clientIP = this.extractClientIP(request);

    const isWhitelisted = await this.ipWhitelistService.isIPInWhitelistedRange(
      tenantId,
      clientIP,
    );

    if (!isWhitelisted) {
      throw new ForbiddenException(
        'Access denied: your IP address is not whitelisted',
      );
    }

    return true;
  }

  private extractClientIP(request: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
    // 1. Check x-forwarded-for (behind proxy)
    const forwarded = request.headers?.['x-forwarded-for'];
    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return this.normalizeIP(forwardedStr.split(',')[0].trim());
    }

    // 2. Check x-real-ip (nginx)
    const realIP = request.headers?.['x-real-ip'];
    if (realIP) {
      const realIPStr = Array.isArray(realIP) ? realIP[0] : realIP;
      return this.normalizeIP(realIPStr);
    }

    // 3. Use req.ip
    const rawIP = this.normalizeIP(request.ip || '');

    // 4. If loopback (localhost request), resolve to server's LAN IP
    if (rawIP === '127.0.0.1' || rawIP === '::1' || rawIP === '') {
      return this.getServerNetworkIP();
    }

    return rawIP;
  }

  private normalizeIP(ip: string): string {
    // Strip IPv6-mapped IPv4 prefix  ::ffff:192.168.1.5 → 192.168.1.5
    if (ip.startsWith('::ffff:')) {
      return ip.slice(7);
    }
    return ip;
  }

  private getServerNetworkIP(): string {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        // Skip loopback and non-IPv4
        if (net.family === 'IPv4' && !net.internal) {
          return net.address; // e.g. 192.168.1.5
        }
      }
    }
    return '127.0.0.1';
  }
}
