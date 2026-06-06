import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Setting } from './settings.entity';
import { UpsertSettingDto } from './dto/settings_upsert.dto';
import { KEYNAMES } from '../shared/constants/keynames';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(KEYNAMES.SETTINGS)
    private readonly settingRepository: typeof Setting,
  ) {}

  async findAll(tenantId: string): Promise<Setting[]> {
    return this.settingRepository.findAll({
      where: { tenant_id: tenantId },
      order: [['category', 'ASC'], ['key', 'ASC']],
    });
  }

  async findByKey(key: string, tenantId: string): Promise<Setting> {
    const setting = await this.settingRepository.findOne({
      where: { key, tenant_id: tenantId },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return setting;
  }

  async findByCategory(category: string, tenantId: string): Promise<Setting[]> {
    return this.settingRepository.findAll({
      where: { category, tenant_id: tenantId },
      order: [['key', 'ASC']],
    });
  }

  async upsert(
    key: string,
    tenantId: string,
    dto: UpsertSettingDto,
  ): Promise<Setting> {
    const existing = await this.settingRepository.findOne({
      where: { key, tenant_id: tenantId },
    });

    if (existing) {
      await existing.update({
        value: dto.value,
        category: dto.category,
      });
      return existing;
    }

    return this.settingRepository.create({
      tenant_id: tenantId,
      key,
      value: dto.value,
      category: dto.category,
    });
  }
}
