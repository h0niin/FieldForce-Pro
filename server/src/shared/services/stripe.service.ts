import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe | null = null;

    constructor(private configService: AppConfigService) {}

    private getClient(): Stripe {
        if (!this.stripe) {
            const key = this.configService.stripeSecretKey;
            if (!key) {
                throw new InternalServerErrorException(
                    'Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.',
                );
            }
            this.stripe = new Stripe(key, { apiVersion: '2023-10-16' as any });
        }
        return this.stripe;
    }

    async createConnectionToken() {
        try {
            const token = await this.getClient().terminal.connectionTokens.create();
            return token;
        } catch (error) {
            throw new InternalServerErrorException('Failed to create Stripe connection token');
        }
    }

    async createPaymentIntent(amount: number, currency: string = 'usd', metadata: Record<string, string> = {}) {
        try {
            const paymentIntent = await this.getClient().paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe expects cents
                currency,
                payment_method_types: ['card_present'],
                capture_method: 'automatic',
                metadata,
            });
            return paymentIntent;
        } catch (error) {
            throw new InternalServerErrorException('Failed to create Stripe payment intent');
        }
    }

    async retrievePaymentIntent(id: string) {
        try {
            return await this.getClient().paymentIntents.retrieve(id);
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve Stripe payment intent');
        }
    }
}
