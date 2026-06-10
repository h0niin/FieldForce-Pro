import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Op } from 'sequelize';
import { ApiKey } from './api_keys.entity';
import { CreateApiKeyDto } from './dto/create_api_key.dto';
import { REPOSITORY } from '../shared/constants/keynames';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @Inject(REPOSITORY.API_KEYS)
    private readonly apiKeyRepository: typeof ApiKey,
  ) {}

  async create(
    tenantId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; raw_key: string }> {
    const rawKey = `fk_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 16); // "fk_live_XXXXXXXX"
    const keyHash = await bcrypt.hash(rawKey, 10);

    const apiKey = await this.apiKeyRepository.create({
      tenant_id: tenantId,
      name: dto.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: dto.scopes ?? ['service_requests:create'],
      expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
    });

    // Return raw key once — caller must display it immediately, it cannot be recovered
    return { apiKey, raw_key: rawKey };
  }

  async validateKey(
    rawKey: string,
  ): Promise<{ tenantId: string; apiKeyId: string; scopes: string[] } | null> {
    if (!rawKey || !rawKey.startsWith('fk_live_')) return null;

    const prefix = rawKey.substring(0, 16);
    const candidates = await this.apiKeyRepository.findAll({
      where: {
        key_prefix: prefix,
        is_active: true,
        is_deleted: false,
      },
    });

    for (const candidate of candidates) {
      if (candidate.expires_at && new Date(candidate.expires_at) < new Date()) {
        continue; // skip expired keys
      }

      const isMatch = await bcrypt.compare(rawKey, candidate.key_hash);
      if (isMatch) {
        await candidate.update({ last_used_at: new Date() });
        return {
          tenantId: candidate.tenant_id,
          apiKeyId: candidate.id,
          scopes: candidate.scopes ?? [],
        };
      }
    }

    return null;
  }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<ApiKey>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { key_prefix: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.apiKeyRepository.findAndCountAll({
      where,
      attributes: { exclude: ['key_hash'] }, // never expose hash
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findById(id: string, tenantId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      attributes: { exclude: ['key_hash'] },
    });
    if (!apiKey) throw new NotFoundException('API key not found');
    return apiKey;
  }

  async revoke(id: string, tenantId: string): Promise<ApiKey> {
    const apiKey = await this.findById(id, tenantId);
    await apiKey.update({ is_active: false });
    return apiKey;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const apiKey = await this.findById(id, tenantId);
    await apiKey.update({ is_deleted: true });
  }
}
