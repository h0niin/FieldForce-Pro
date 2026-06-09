import { Module } from '@nestjs/common';
import { FieldPermissionsController } from './field_permissions.controller';
import { FieldPermissionsService } from './field_permissions.service';
import { fieldPermissionsProviders } from './field_permissions.provider';
import { rolesProviders } from '../ROLES/roles.provider';
import { customFieldsProviders } from '../CUSTOM_FIELDS/custom_fields.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FieldPermissionsController],
  providers: [
    FieldPermissionsService,
    ...fieldPermissionsProviders,
    ...rolesProviders,
    ...customFieldsProviders,
  ],
  exports: [FieldPermissionsService],
})
export class FieldPermissionsModule {}
