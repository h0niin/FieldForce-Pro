import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(private configService: AppConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.redisHost,
      port: this.configService.redisPort,
      password: this.configService.redisPassword || undefined,
      maxRetriesPerRequest: 3,
    });
    
    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
    
    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (err) {
      this.logger.error(`Redis get error: ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, data, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, data);
      }
    } catch (err) {
      this.logger.error(`Redis set error: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Redis del error: ${err.message}`);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      this.logger.error(`Redis incr error: ${err.message}`);
      return 1;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (err) {
      this.logger.error(`Redis expire error: ${err.message}`);
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (err) {
      this.logger.error(`Redis ping error: ${err.message}`);
      throw err;
    }
  }
}
