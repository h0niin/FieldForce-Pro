import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';

export class QueryNotesDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by entity type (e.g., Contact, Company)' })
  @IsString()
  @IsOptional()
  readonly entity_type?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID' })
  @IsUUID()
  @IsOptional()
  readonly entity_id?: string;
}
