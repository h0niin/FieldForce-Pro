import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { REPOSITORY } from '../../shared/constants/keynames';
import { SuperAdminApiKey } from './super_admin_api_keys.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminApiKeysService {
  constructor(
    @Inject(REPOSITORY.SUPER_ADMIN_API_KEYS)
    private readonly superAdminApiKeyRepository: typeof SuperAdminApiKey,
  ) {}

  async createKey(superAdminId: string, keyName: string, expiresInDays?: number) {
    const rawKey = `sa_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);

    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const newKey = await this.superAdminApiKeyRepository.create({
      super_admin_id: superAdminId,
      key_name: keyName,
      key_hash: keyHash,
      expires_at: expiresAt || undefined,
      is_active: true,
    } as any);

    return {
      id: newKey.id,
      key_name: newKey.key_name,
      api_key: rawKey, // Only returned once!
      created_at: newKey.created_at,
      expires_at: newKey.expires_at,
    };
  }

  async listKeys(superAdminId: string) {
    const keys = await this.superAdminApiKeyRepository.findAll({
      where: { super_admin_id: superAdminId },
      attributes: ['id', 'key_name', 'is_active', 'last_used_at', 'expires_at', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    return keys;
  }

  async revokeKey(superAdminId: string, id: string) {
    const key = await this.superAdminApiKeyRepository.findOne({
      where: { id, super_admin_id: superAdminId },
    });

    if (!key) {
      throw new NotFoundException('API Key not found');
    }

    await key.update({ is_active: false });
    return { success: true };
  }

  async validateKey(rawKey: string): Promise<SuperAdminApiKey | null> {
    const keys = await this.superAdminApiKeyRepository.findAll({
      where: { is_active: true },
    });

    for (const key of keys) {
      if (key.expires_at && new Date() > key.expires_at) {
        continue; // Expired
      }
      const isMatch = await bcrypt.compare(rawKey, key.key_hash);
      if (isMatch) {
        await key.update({ last_used_at: new Date() });
        return key;
      }
    }

    return null;
  }
}
