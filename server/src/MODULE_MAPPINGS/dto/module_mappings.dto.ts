import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MappingItemDto {
  @IsString()
  source_field: string;

  @IsString()
  target_field: string;
}

export class SaveModuleMappingsDto {
  @IsString()
  sourceModule: string;

  @IsString()
  targetModule: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MappingItemDto)
  mappings: MappingItemDto[];
}
