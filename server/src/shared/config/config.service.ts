import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) { }

  // App
  get appPort(): number {
    return this.configService.get<number>('APP_PORT', 3000);
  }
  get appEnv(): string {
    return this.configService.get<string>('APP_ENV', 'development');
  }
  get appName(): string {
    return this.configService.get<string>('APP_NAME', 'FieldForce Pro');
  }
  get isProduction(): boolean {
    return this.appEnv === 'production';
  }

  // Database
  get dbHost(): string {
    return this.configService.get<string>('DB_HOST', 'localhost');
  }
  get dbPort(): number {
    return this.configService.get<number>('DB_PORT', 5432);
  }
  get dbUsername(): string {
    return this.configService.get<string>('DB_USERNAME', 'postgres');
  }
  get dbPassword(): string {
    return this.configService.get<string>('DB_PASSWORD', 'postgres');
  }
  get dbName(): string {
    return this.configService.get<string>('DB_NAME', 'fieldforce_pro');
  }
  get dbLogging(): boolean {
    return this.configService.get<string>('DB_LOGGING', 'true') === 'true';
  }

  // JWT
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'default-secret');
  }
  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }
  get jwtRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret');
  }
  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  // Redis
  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }
  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }
  get redisPassword(): string {
    return this.configService.get<string>('REDIS_PASSWORD', '');
  }

  // AWS S3
  get s3Bucket(): string {
    return this.configService.get<string>('AWS_S3_BUCKET', '');
  }
  get s3Region(): string {
    return this.configService.get<string>('AWS_S3_REGION', 'us-east-1');
  }
  get awsAccessKeyId(): string {
    return this.configService.get<string>('AWS_ACCESS_KEY_ID', '');
  }
  get awsSecretAccessKey(): string {
    return this.configService.get<string>('AWS_SECRET_ACCESS_KEY', '');
  }

  // Mail
  get mailHost(): string {
    return this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
  }
  get mailPort(): number {
    return this.configService.get<number>('MAIL_PORT', 587);
  }
  get mailUser(): string {
    return this.configService.get<string>('MAIL_USER', '');
  }
  get mailPassword(): string {
    return this.configService.get<string>('MAIL_PASSWORD', '');
  }
  get mailFrom(): string {
    return this.configService.get<string>('MAIL_FROM', 'noreply@fieldforcepro.com');
  }

  // Frontend
  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  // Security
  get maxFailedLoginAttempts(): number {
    return this.configService.get<number>('MAX_FAILED_LOGIN_ATTEMPTS', 5);
  }
  get accountLockDurationMinutes(): number {
    return this.configService.get<number>('ACCOUNT_LOCK_DURATION_MINUTES', 30);
  }
  get passwordResetTokenExpiresMinutes(): number {
    return this.configService.get<number>('PASSWORD_RESET_TOKEN_EXPIRES_MINUTES', 60);
  }

  get mfaCodeExpiresMinutes(): number {
    return Number(this.configService.get('MFA_CODE_EXPIRES_MINUTES', '10'));
  }

  // Stripe
  get stripeSecretKey(): string {
    return this.configService.get<string>('STRIPE_SECRET_KEY', '');
  }

  get stripePublishableKey(): string {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY', '');
  }

  get stripeWebhookSecret(): string {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  // Razorpay
  get razorpayMode(): string {
    return this.configService.get<string>('RAZORPAY_MODE', '');
  }

  get razorpayKeyId(): string {
    return this.configService.get<string>('RAZORPAY_KEY_ID', '');
  }

  get razorpayKeySecret(): string {
    return this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
  }

  // UPI
  get upiMerchantVpa(): string {
    return this.configService.get<string>('UPI_MERCHANT_VPA', '');
  }

  get upiMerchantName(): string {
    return this.configService.get<string>('UPI_MERCHANT_NAME', 'FieldForce Pro');
  }
}
