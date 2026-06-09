import { Injectable, Inject, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { User } from '../USERS/users.entity';
import { EmailService } from '../shared/services/email.service';
import { AppConfigService } from '../shared/config/config.service';
import { REPOSITORY } from '../shared/constants/keynames';
import * as crypto from 'crypto';

@Injectable()
export class MFAService {
  constructor(
    @Inject(REPOSITORY.USERS)
    private readonly usersRepository: typeof User,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: AppConfigService,
  ) { }

  // ─── Email MFA ────────────────────────────────────────────

  async generateAndSendMFACode(
    userId: string,
    tenantId: string,
  ): Promise<{ mfa_token: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenant_id: tenantId, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const code = this.generateCode();

    // Store only the code in DB — expiry is handled by the JWT token
    await user.update({ mfa_code: code, mfa_code_expires: null });

    await this.emailService.sendMFACode(user.email, code, user.first_name);

    // Token expiry (10m) controls how long the code is valid
    const mfaToken = this.jwtService.sign(
      { sub: userId, tenant_id: tenantId, type: 'mfa' },
      { expiresIn: '10m' },
    );

    return { mfa_token: mfaToken };
  }

  async verifyMFACode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfa_code) {
      throw new BadRequestException('No MFA code pending');
    }

    // No DB expiry check — the JWT token handles expiration
    if (user.mfa_code !== code) {
      return false;
    }

    // Clear the code after successful verification
    await user.update({ mfa_code: null, mfa_code_expires: null });
    return true;
  }

  async verifyAndEnableMFA(
    token: string,
    code: string,
  ): Promise<{ success: boolean; recovery_codes?: string[] }> {
    // Token verification handles expiry — if token is expired, this throws
    const decoded = this.verifyMFAToken(token);

    const user = await this.usersRepository.findOne({
      where: { id: decoded.sub, tenant_id: decoded.tenant_id, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfa_code) {
      return { success: false };
    }

    // No DB expiry check — token expiry is the single source of truth
    if (user.mfa_code !== code) {
      return { success: false };
    }

    // Code valid → enable MFA and clear the code
    await user.update({
      mfa_enabled: true,
      mfa_method: 'email',
      mfa_code: null,
      mfa_code_expires: null,
    });

    // Generate recovery codes on MFA enable
    const recoveryCodes = this.generateRecoveryCodes();
    await this.storeRecoveryCodes(user.id, recoveryCodes);

    return { success: true, recovery_codes: recoveryCodes };
  }

  async enableMFA(userId: string, tenantId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenant_id: tenantId, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await user.update({ mfa_enabled: true, mfa_method: 'email' });
  }

  async disableMFA(userId: string, tenantId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenant_id: tenantId, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await user.update({
      mfa_enabled: false,
      mfa_method: null,
      mfa_code: null,
      mfa_code_expires: null,
      totp_secret: null,
      recovery_codes: null,
    });
  }

  async getMFAStatus(
    userId: string,
    tenantId: string,
  ): Promise<{ mfa_enabled: boolean; mfa_method: string | null; recovery_codes_remaining: number }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenant_id: tenantId, is_deleted: false },
      attributes: ['mfa_enabled', 'mfa_method', 'recovery_codes'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const remaining = (user.recovery_codes || []).filter((c) => !c.used).length;
    return {
      mfa_enabled: user.mfa_enabled,
      mfa_method: user.mfa_method || null,
      recovery_codes_remaining: remaining,
    };
  }

  // ─── TOTP (Authenticator App) MFA ─────────────────────────

  async setupTOTP(
    userId: string,
    tenantId: string,
  ): Promise<{ secret: string; otpauth_url: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenant_id: tenantId, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = authenticator.generateSecret();
    const otpauth_url = authenticator.keyuri(user.email, this.configService.appName, secret);

    // Store secret but don't enable yet — user must verify first
    await user.update({ totp_secret: secret });

    return { secret, otpauth_url };
  }

  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.totp_secret) {
      throw new BadRequestException('TOTP not configured for this user');
    }

    const isValid = authenticator.verify({ token: code, secret: user.totp_secret });
    return isValid;
  }

  async verifyAndEnableTOTP(
    userId: string,
    tenantId: string,
    code: string,
  ): Promise<{ success: boolean; recovery_codes?: string[] }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenant_id: tenantId, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.totp_secret) {
      throw new BadRequestException('TOTP not set up. Call setup-totp first.');
    }

    const isValid = authenticator.verify({ token: code, secret: user.totp_secret });
    if (!isValid) {
      return { success: false };
    }

    await user.update({
      mfa_enabled: true,
      mfa_method: 'totp',
      mfa_code: null,
      mfa_code_expires: null,
    });

    // Generate recovery codes on MFA enable
    const recoveryCodes = this.generateRecoveryCodes();
    await this.storeRecoveryCodes(user.id, recoveryCodes);

    return { success: true, recovery_codes: recoveryCodes };
  }

  // ─── Recovery Codes ─────────────────────────────────────

  generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusing chars: I,O,0,1
    for (let i = 0; i < 8; i++) {
      let part1 = '';
      let part2 = '';
      for (let j = 0; j < 4; j++) {
        part1 += chars[crypto.randomInt(chars.length)];
        part2 += chars[crypto.randomInt(chars.length)];
      }
      codes.push(`${part1}-${part2}`);
    }
    return codes;
  }

  async storeRecoveryCodes(userId: string, codes: string[]): Promise<void> {
    const entries = codes.map((code) => ({ code, used: false }));
    await this.usersRepository.update(
      { recovery_codes: entries },
      { where: { id: userId } },
    );
  }

  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, is_deleted: false },
    });
    if (!user || !user.recovery_codes) {
      return false;
    }

    const normalizedCode = code.toUpperCase().trim();
    const codeEntry = user.recovery_codes.find(
      (c) => c.code === normalizedCode && !c.used,
    );
    if (!codeEntry) {
      return false;
    }

    // Mark as used
    const updatedCodes = user.recovery_codes.map((c) =>
      c.code === normalizedCode ? { ...c, used: true } : c,
    );
    await user.update({ recovery_codes: updatedCodes });
    return true;
  }

  async regenerateRecoveryCodes(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenant_id: tenantId, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.mfa_enabled) {
      throw new BadRequestException('MFA must be enabled to generate recovery codes');
    }

    const codes = this.generateRecoveryCodes();
    await this.storeRecoveryCodes(userId, codes);
    return codes;
  }

  // ─── Helpers ──────────────────────────────────────────────

  verifyMFAToken(token: string): { sub: string; tenant_id: string; type: string } {
    let decoded: { sub: string; tenant_id: string; type: string };
    try {
      decoded = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (decoded.type !== 'mfa') {
      throw new UnauthorizedException('Invalid MFA token');
    }

    return decoded;
  }

  private generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }
}
