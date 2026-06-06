import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserDocumentResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  tenant_id: string;

  @Expose()
  @ApiProperty()
  user_id: string;

  @Expose()
  @ApiProperty({
    enum: ['certification', 'license', 'id_proof', 'insurance', 'contract', 'other'],
  })
  document_type: string;

  @Expose()
  @ApiProperty()
  document_name: string;

  @Expose()
  @ApiProperty()
  file_url: string;

  @Expose()
  @ApiPropertyOptional()
  file_type: string;

  @Expose()
  @ApiPropertyOptional()
  file_size: number;

  @Expose()
  @ApiPropertyOptional()
  issue_date: Date;

  @Expose()
  @ApiPropertyOptional()
  expiry_date: Date;

  @Expose()
  @ApiPropertyOptional()
  issuing_authority: string;

  @Expose()
  @ApiPropertyOptional()
  document_number: string;

  @Expose()
  @ApiPropertyOptional()
  notes: string;

  @Expose()
  @ApiProperty()
  is_verified: boolean;

  @Expose()
  @ApiPropertyOptional()
  verified_at: Date;

  @Expose()
  @ApiPropertyOptional()
  verified_by: string;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;
}
