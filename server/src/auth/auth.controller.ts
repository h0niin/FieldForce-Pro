import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SubscriptionMagicLinksService } from '../SUBSCRIPTION_MAGIC_LINKS/subscription_magic_links.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyMFALoginDto,
  RequestMagicLinkDto,
  RegisterMagicLinkDto,
  VerifyMagicLinkDto,
} from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from '../shared/decorator/public.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly subscriptionMagicLinksService: SubscriptionMagicLinksService,
  ) { }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and tenant' })
  async register(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterDto,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.register(dto, ip, userAgent);

    this.setAuthCookies(res, result);
    const body = this.stripTokensFromAuthResult(result);
    return DataResponseDto.created(body, 'Registration successful');
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() loginDto: LoginDto) {
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.login(req.user as never, loginDto, ip, userAgent);

    // Check if MFA is required (no tokens in this case)
    if ('mfa_required' in result && result.mfa_required) {
      return DataResponseDto.success(result, 'MFA verification required');
    }

    if ('access_token' in result && result.access_token) {
      // Mobile clients use bearer-token auth — return tokens in body, skip cookies.
      // Web/desktop clients use cookie-based auth — set HttpOnly cookies, strip tokens from body.
      if (loginDto.device_type === 'mobile' || loginDto.device_type === 'tablet') {
        return DataResponseDto.success(result, 'Login successful');
      }
      this.setAuthCookies(res, result);
      return DataResponseDto.success(this.stripTokensFromAuthResult(result), 'Login successful');
    }

    return DataResponseDto.success(result, 'Login successful');
  }

  @Public()
  @Post('verify-mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA code during login' })
  async verifyMFA(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: VerifyMFALoginDto) {
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.verifyMFALogin(dto, ip, userAgent);

    this.setAuthCookies(res, result);
    return DataResponseDto.success(this.stripTokensFromAuthResult(result), 'MFA verification successful');
  }

  @Public()
  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a magic link for login' })
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    const result = await this.authService.requestMagicLink(dto);
    return DataResponseDto.success(result, 'Magic link requested');
  }

  @Public()
  @Post('magic-link/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register and request a magic link' })
  async requestMagicLinkRegister(@Body() dto: RegisterMagicLinkDto) {
    const result = await this.authService.requestMagicLinkRegister(dto);
    return DataResponseDto.success(result, 'Magic link registration requested');
  }

  @Public()
  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify magic link and login' })
  async verifyMagicLink(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: VerifyMagicLinkDto) {
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.verifyMagicLink(dto, ip, userAgent);

    this.setAuthCookies(res, result);
    return DataResponseDto.success(this.stripTokensFromAuthResult(result), 'Magic link verification successful');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: RefreshTokenDto) {
    // If refresh_token not in body, try to get it from cookie
    const refreshToken = dto.refresh_token || req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new HttpException('Refresh token is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.authService.refreshTokens({ refresh_token: refreshToken });

    // Set new tokens in HTTP-only cookies
    if (result.access_token) {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use 'lax' to allow cookies in development
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
      });
    }

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use 'lax' to allow cookies in development
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    // Remove tokens from response body
    const { access_token, refresh_token, ...dataWithoutTokens } = result;
    return DataResponseDto.success(dataWithoutTokens, 'Tokens refreshed successfully');
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session' })
  async logout(@CurrentUser() user: { id: string; session_id: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logout(user.id, user.session_id);

    // Clear authentication cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return DataResponseDto.success(result, 'Logout successful');
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate all active sessions' })
  async logoutAll(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logoutAll(userId);

    // Clear authentication cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return DataResponseDto.success(result, 'All sessions terminated');
  }

  @ApiBearerAuth()
  @Post('terminate-session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate a specific session' })
  async terminateSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.authService.terminateSession(userId, sessionId);
    return DataResponseDto.success(result);
  }

  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'List all active login sessions/devices' })
  async getSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.authService.getActiveSessions(userId);
    return DataResponseDto.success(sessions);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return DataResponseDto.success(result);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return DataResponseDto.success(result);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (authenticated)' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    const result = await this.authService.changePassword(userId, dto);
    return DataResponseDto.success(result);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with roles and permissions' })
  async getMe(@CurrentUser('id') userId: string) {
    const result = await this.authService.getMe(userId);
    return DataResponseDto.success(result);
  }

  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (e.g. fcm token)' })
  async updateMe(@CurrentUser('id') userId: string, @Body() dto: Partial<typeof RegisterDto.prototype>) {
    // using authService to pass down to usersService
    const result = await this.authService.updateMe(userId, dto);
    return DataResponseDto.success(result, 'Profile updated successfully');
  }

  private setAuthCookies(
    res: Response,
    result: { access_token?: string; refresh_token?: string },
  ): void {
    if (result.access_token) {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });
    }

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
  }

  // ── Subscription Magic Link signup flow ─────────────────────────────────

  @Public()
  @Get('subscription-plans')
  @ApiOperation({ summary: 'Get active subscription plans (public)' })
  async getSubscriptionPlans() {
    const plans = await this.authService.listSubscriptionPlans();
    return DataResponseDto.success(plans, 'Subscription plans fetched successfully');
  }

  @Public()
  @Get('signup-magic-link/validate')
  @ApiOperation({ summary: 'Validate a subscription magic link token (public)' })
  async validateSignupToken(@Req() req: Request) {
    const token = (req.query as any).token as string;
    if (!token) throw new HttpException('token query parameter is required', HttpStatus.BAD_REQUEST);
    const { plan, link } = await this.subscriptionMagicLinksService.validate(token);
    // Return only what the signup page needs — no internal details
    return DataResponseDto.success({
      valid: true,
      plan_name: plan.name,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_total_users: plan.max_total_users,
      max_appointments_monthly: plan.max_appointments_monthly,
      features: plan.features,
      currency: plan.currency || 'USD',
      expires_at: link.expires_at,
      max_uses: link.max_uses,
      used_count: link.used_count,
    });
  }


  @Public()
  @Post('signup-from-magic-link')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new tenant via subscription magic link (public)' })
  async signupFromMagicLink(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: {
      token: string;
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      company_name: string;
      phone?: string;
    },
  ) {
    const { token, ...registerData } = body;

    // 1. Validate the token (throws if invalid/expired/used)
    await this.subscriptionMagicLinksService.validate(token);

    // 2. Register tenant + admin user via the standard flow
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.register(
      {
        email: registerData.email,
        password: registerData.password,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        company_name: registerData.company_name,
        phone: registerData.phone,
      } as any,
      ip,
      userAgent,
    );

    // 3. Consume the token (increment use count, assign plan to tenant)
    const { planId } = await this.subscriptionMagicLinksService.consume(token, 'system', registerData.company_name);

    // 4. Assign the subscription plan to the newly created tenant
    if (result.tenant?.id && planId) {
      const { Tenant } = await import('../TENANTS/tenants.entity');
      await Tenant.update(
        { subscription_plan_id: planId, subscription_status: 'active' },
        { where: { id: result.tenant.id } },
      );
    }

    this.setAuthCookies(res, result);
    const body2 = this.stripTokensFromAuthResult(result);
    return DataResponseDto.created(body2, 'Account created successfully');
  }

  private stripTokensFromAuthResult<T extends { access_token?: string; refresh_token?: string }>(
    result: T,
  ): Omit<T, 'access_token' | 'refresh_token'> {
    const { access_token: _a, refresh_token: _r, ...rest } = result;
    return rest;
  }
}