import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { MagicLinksService } from './magic_links.service';
import { GenerateMagicLinkDto, CompleteOnboardingDto } from './dto/magic_links.dto';
import { Public } from '../shared/decorator/public.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('Magic Links')
@Controller('auth')
export class MagicLinksController {
  constructor(private readonly magicLinksService: MagicLinksService) {}

  @ApiBearerAuth()
  @Post('magic-link/generate')
  @ApiOperation({ summary: 'Generate a magic link for a target user (JWT required)' })
  async generate(
    @CurrentUser() user: { id: string; tenant_id: string | null; is_super_admin: boolean; primary_role: string | null },
    @Body() dto: GenerateMagicLinkDto,
  ) {
    const result = await this.magicLinksService.generateLink(user, dto);
    return DataResponseDto.success(result, 'Magic link generated successfully');
  }

  @Public()
  @Get('magic/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a magic link token and issue session cookies (public)' })
  async verify(
    @Query('token') token: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.magicLinksService.validateAndConsume(token, ip, userAgent);

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return DataResponseDto.success(
      { user: result.user, purpose: result.purpose },
      'Magic link verified successfully',
    );
  }

  @ApiBearerAuth()
  @Patch('magic/complete-onboarding')
  @ApiOperation({ summary: 'Complete onboarding: set name and password after magic link login' })
  async completeOnboarding(
    @CurrentUser() user: { id: string },
    @Body() dto: CompleteOnboardingDto,
  ) {
    await this.magicLinksService.completeOnboarding(user.id, dto);
    return DataResponseDto.success(null, 'Onboarding completed successfully');
  }
}
