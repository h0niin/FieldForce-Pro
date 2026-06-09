import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleTenantModuleDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;
}
