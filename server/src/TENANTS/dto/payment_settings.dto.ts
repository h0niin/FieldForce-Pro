import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * A tenant's payment details shown to the customer in the technician app (Step 12).
 * Supports both an uploaded QR image (any provider) and UPI details for an
 * on-device generated QR. All fields optional — the tenant fills what applies.
 */
export class UpdatePaymentSettingsDto {
  @ApiPropertyOptional({ description: 'UPI VPA / handle', example: 'bluestar@okhdfcbank' })
  @IsString()
  @IsOptional()
  upi_vpa?: string;

  @ApiPropertyOptional({ description: 'Payee / merchant display name', example: 'Bluestar AC Services' })
  @IsString()
  @IsOptional()
  upi_name?: string;

  @ApiPropertyOptional({ description: 'Uploaded QR image (URL or data URI). Takes priority over generated UPI QR.' })
  @IsString()
  @IsOptional()
  qr_image_url?: string;

  @ApiPropertyOptional({ description: 'Bank account holder name' })
  @IsString()
  @IsOptional()
  bank_account_name?: string;

  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsString()
  @IsOptional()
  bank_account_number?: string;

  @ApiPropertyOptional({ description: 'Bank IFSC / routing code' })
  @IsString()
  @IsOptional()
  bank_ifsc?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsString()
  @IsOptional()
  bank_name?: string;

  @ApiPropertyOptional({ description: 'Free-text payment instructions shown to the customer' })
  @IsString()
  @IsOptional()
  instructions?: string;
}
