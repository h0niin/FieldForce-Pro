import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, Length, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { MFAService } from './mfa.service';

export class VerifyMFACodeDto {
  @IsString()
  @Length(6, 6)
  code: string;
}

export class EnableEmailMFADto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

@ApiTags('MFA')
@Controller('mfa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MFAController {
  constructor(private readonly mfaService: MFAService) {}

  // ─── Email MFA ────────────────────────────────────────────

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a verification code to enable email MFA, returns a setup token' })
  async setupMFA(
    @Request() req: { user: { id: string } },
    @TenantId() tenantId: string,
  ) {
    const result = await this.mfaService.generateAndSendMFACode(req.user.id, tenantId);
    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Verification code sent to your email',
      data: { token: result.mfa_token },
    });
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA code (standalone check)' })
  async verifyMFA(
    @Request() req: { user: { id: string } },
    @Body() dto: VerifyMFACodeDto,
  ) {
    const valid = await this.mfaService.verifyMFACode(req.user.id, dto.code);
    if (!valid) {
      throw new BadRequestException('Invalid verification code');
    }
    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Code verified successfully',
      data: { valid: true },
    });
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable email MFA — requires setup token + OTP code' })
  async enableMFA(
    @Body() dto: EnableEmailMFADto,
  ) {
    const result = await this.mfaService.verifyAndEnableMFA(dto.token, dto.code);

    if (!result.success) {
      throw new BadRequestException('Invalid verification code');
    }

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'MFA enabled successfully',
      data: { recovery_codes: result.recovery_codes },
    });
  }

  // ─── TOTP (Authenticator App) MFA ─────────────────────────

  @Post('setup-totp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate TOTP secret and QR code URL for authenticator app' })
  async setupTOTP(
    @Request() req: { user: { id: string } },
    @TenantId() tenantId: string,
  ) {
    const data = await this.mfaService.setupTOTP(req.user.id, tenantId);
    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'TOTP setup initiated. Scan the QR code with your authenticator app.',
      data,
    });
  }

  @Post('enable-totp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP code and enable authenticator MFA' })
  async enableTOTP(
    @Request() req: { user: { id: string } },
    @TenantId() tenantId: string,
    @Body() dto: VerifyMFACodeDto,
  ) {
    const result = await this.mfaService.verifyAndEnableTOTP(req.user.id, tenantId, dto.code);

    if (!result.success) {
      throw new BadRequestException('Invalid verification code. Please try again.');
    }

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'TOTP MFA enabled successfully',
      data: { recovery_codes: result.recovery_codes },
    });
  }

  // ─── Common ───────────────────────────────────────────────

  @Delete('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA for user' })
  async disableMFA(
    @Request() req: { user: { id: string } },
    @TenantId() tenantId: string,
  ) {
    await this.mfaService.disableMFA(req.user.id, tenantId);
    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'MFA disabled successfully',
      data: null,
    });
  }

  @Get('status')
  @ApiOperation({ summary: 'Get MFA status for current user' })
  async getMFAStatus(
    @Request() req: { user: { id: string } },
    @TenantId() tenantId: string,
  ) {
    const status = await this.mfaService.getMFAStatus(req.user.id, tenantId);
    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'MFA status retrieved',
      data: status,
    });
  }

  @Post('regenerate-recovery-codes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate recovery codes (replaces existing codes)' })
  async regenerateRecoveryCodes(
    @Request() req: { user: { id: string } },
    @TenantId() tenantId: string,
  ) {
    const codes = await this.mfaService.regenerateRecoveryCodes(req.user.id, tenantId);
    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Recovery codes regenerated successfully',
      data: { recovery_codes: codes },
    });
  }
}
