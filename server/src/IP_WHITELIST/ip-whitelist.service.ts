import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPWhitelist } from './ip-whitelist.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { REPOSITORY } from '../shared/constants/keynames';
import { Op } from 'sequelize';

export interface CreateIPWhitelistDto {
  ip_address: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateIPWhitelistDto {
  ip_address?: string;
  description?: string;
  is_active?: boolean;
}

export interface IPWhitelistConfigDto {
  enabled: boolean;
  entry_count: number;
}

@Injectable()
export class IPWhitelistService {
  constructor(
    @Inject('IPWhitelistRepository')
    private ipWhitelistRepository: typeof IPWhitelist,
    @Inject(REPOSITORY.TENANTS)
    private tenantRepository: typeof Tenant,
  ) { }

  /**
   * Get IP whitelist configuration for tenant
   */
  async getConfig(tenantId: string): Promise<IPWhitelistConfigDto> {
    const enabled = await this.isEnabled(tenantId);
    const entryCount = await this.ipWhitelistRepository.count({
      where: {
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    return { enabled, entry_count: entryCount };
  }

  /**
   * Enable or disable IP whitelisting for tenant
   */
  async setEnabled(tenantId: string, enabled: boolean): Promise<void> {
    const tenant = await this.tenantRepository.findByPk(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const settings = { ...(tenant.settings || {}), ip_whitelist_enabled: enabled };
    await tenant.update({ settings });
  }

  /**
   * Check if IP whitelisting is enabled for tenant
   */
  async isEnabled(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantRepository.findByPk(tenantId);
    if (!tenant) {
      return false;
    }

    return !!(tenant.settings as Record<string, unknown>)?.ip_whitelist_enabled;
  }

  /**
   * Check if IP address is whitelisted
   */
  async isIPWhitelisted(tenantId: string, ipAddress: string): Promise<boolean> {
    const entry = await this.ipWhitelistRepository.findOne({
      where: {
        tenant_id: tenantId,
        ip_address: ipAddress,
        is_active: true,
        is_deleted: false,
      },
    });

    return !!entry;
  }

  /**
   * Check if IP address matches CIDR range
   */
  async isIPInWhitelistedRange(tenantId: string, ipAddress: string): Promise<boolean> {
    console.log(ipAddress, '----------tenantId', tenantId)
    const entries = await this.ipWhitelistRepository.findAll({
      where: {
        tenant_id: tenantId,
        is_active: true,
        is_deleted: false,
      },
    });

    for (const entry of entries) {
      if (this.matchesIPOrRange(ipAddress, entry.ip_address)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all whitelisted IPs for tenant
   */
  async findAll(tenantId: string): Promise<IPWhitelist[]> {
    return this.ipWhitelistRepository.findAll({
      where: {
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Add IP to whitelist
   */
  async create(tenantId: string, dto: CreateIPWhitelistDto): Promise<IPWhitelist> {
    // Validate IP address format
    if (!this.isValidIP(dto.ip_address)) {
      throw new BadRequestException('Invalid IP address or CIDR notation');
    }

    // Check if IP already exists
    const existing = await this.ipWhitelistRepository.findOne({
      where: {
        tenant_id: tenantId,
        ip_address: dto.ip_address,
        is_deleted: false,
      },
    });

    if (existing) {
      throw new BadRequestException('IP address already whitelisted');
    }

    return this.ipWhitelistRepository.create({
      tenant_id: tenantId,
      ip_address: dto.ip_address,
      description: dto.description,
      is_active: dto.is_active !== false,
    });
  }

  /**
   * Update IP whitelist entry
   */
  async update(
    id: string,
    tenantId: string,
    dto: UpdateIPWhitelistDto,
  ): Promise<IPWhitelist> {
    const entry = await this.ipWhitelistRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (!entry) {
      throw new NotFoundException('IP whitelist entry not found');
    }

    if (dto.ip_address && !this.isValidIP(dto.ip_address)) {
      throw new BadRequestException('Invalid IP address or CIDR notation');
    }

    await entry.update(dto);
    return entry;
  }

  /**
   * Remove IP from whitelist (soft delete)
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const entry = await this.ipWhitelistRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (!entry) {
      throw new NotFoundException('IP whitelist entry not found');
    }

    await entry.update({ is_deleted: true });
  }

  // ========== Helper Methods ==========

  /**
   * Validate IP address or CIDR notation
   */
  private isValidIP(ip: string): boolean {
    // IPv4 address
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv4 CIDR
    const ipv4CidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    // IPv6 address
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

    if (ipv4Regex.test(ip)) {
      // Validate each octet is 0-255
      const octets = ip.split('.');
      return octets.every((octet) => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }

    if (ipv4CidrRegex.test(ip)) {
      const [address, mask] = ip.split('/');
      const maskNum = parseInt(mask, 10);
      return this.isValidIP(address) && maskNum >= 0 && maskNum <= 32;
    }

    if (ipv6Regex.test(ip)) {
      return true;
    }

    return false;
  }

  /**
   * Check if IP matches address or CIDR range
   */
  private matchesIPOrRange(testIP: string, whitelistedIP: string): boolean {
    // Exact match
    if (testIP === whitelistedIP) {
      return true;
    }

    // Check CIDR range
    if (whitelistedIP.includes('/')) {
      return this.isIPInCIDRRange(testIP, whitelistedIP);
    }

    return false;
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIPInCIDRRange(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split('/');
    const mask = parseInt(bits, 10);

    const ipNum = this.ipToNumber(ip);
    const rangeNum = this.ipToNumber(range);
    const maskNum = ((0xffffffff << (32 - mask)) & 0xffffffff) >>> 0;

    return (ipNum & maskNum) === (rangeNum & maskNum);
  }

  /**
   * Convert IP address to number
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }
}