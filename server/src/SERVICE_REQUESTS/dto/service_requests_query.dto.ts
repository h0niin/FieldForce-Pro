import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';

export class ServiceRequestQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsString()
  @IsOptional()
  readonly status?: string;

  @ApiPropertyOptional({ description: 'Filter by asset ID' })
  @IsUUID()
  @IsOptional()
  readonly asset_id?: string;

  @ApiPropertyOptional({ description: 'Filter by contact ID' })
  @IsUUID()
  @IsOptional()
  readonly contact_id?: string;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsUUID()
  @IsOptional()
  readonly company_id?: string;
}
