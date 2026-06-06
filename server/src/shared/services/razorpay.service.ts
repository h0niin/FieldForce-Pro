import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
    private readonly logger = new Logger(RazorpayService.name);
    private razorpay: InstanceType<typeof Razorpay> | null = null;

    constructor(private configService: AppConfigService) {}

    private get isMockMode(): boolean {
        return this.configService.razorpayMode === 'mock';
    }

    private getClient(): InstanceType<typeof Razorpay> {
        if (!this.razorpay) {
            const keyId = this.configService.razorpayKeyId;
            const keySecret = this.configService.razorpayKeySecret;
            if (
                !keyId ||
                !keySecret ||
                keyId.includes('replace_me') ||
                keySecret.includes('replace_me')
            ) {
                throw new InternalServerErrorException(
                    'Razorpay is not configured. Set valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your server .env file.',
                );
            }
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
        }
        return this.razorpay;
    }

    async createOrder(
        amount: number,
        currency: string = 'INR',
        receipt?: string,
        notes?: Record<string, string>,
    ) {
        // Mock mode: return a fake order without calling Razorpay API
        if (this.isMockMode) {
            this.logger.log(`[MOCK] Creating order: amount=${amount}, currency=${currency}`);
            return {
                id: `order_mock_${Date.now()}`,
                amount: Math.round(amount * 100),
                currency,
                receipt: receipt || `rcpt_${Date.now()}`,
                status: 'created',
                notes: notes || {},
            };
        }

        try {
            const order = await this.getClient().orders.create({
                amount: Math.round(amount * 100), // Razorpay expects paise
                currency,
                receipt: receipt || `rcpt_${Date.now()}`,
                notes: notes || {},
            });
            return order;
        } catch (error: any) {
            const msg = error?.error?.description || error?.message || 'Failed to create Razorpay order';
            throw new InternalServerErrorException(`Razorpay: ${msg}`);
        }
    }

    verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string,
    ): boolean {
        // Mock mode: always verify successfully
        if (this.isMockMode) {
            this.logger.log(`[MOCK] Verifying payment: order=${orderId}, payment=${paymentId}`);
            return true;
        }

        const keySecret = this.configService.razorpayKeySecret;
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');
        return expectedSignature === signature;
    }
}
