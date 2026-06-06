import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import * as os from 'os';
import { RedisCacheService } from '../../shared/services/redis-cache.service';

@Injectable()
export class SuperAdminHealthService {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async getHealthStatus() {
    let dbStatus = 'healthy';
    let dbQueryTime = 0;
    try {
      const start = Date.now();
      await this.sequelize.query('SELECT 1');
      dbQueryTime = Date.now() - start;
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    let redisStatus = 'healthy';
    let redisPingTime = 0;
    try {
      const start = Date.now();
      await this.redisCacheService.ping();
      redisPingTime = Date.now() - start;
    } catch (error) {
      redisStatus = 'unhealthy';
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuUsage = os.loadavg()[0]; // 1 minute load average

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          queryTimeMs: dbQueryTime,
        },
        api: {
          status: 'healthy',
          uptimeSeconds: process.uptime(),
          memoryUsage: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usedPercentage: Math.round((usedMem / totalMem) * 100),
          },
          cpuLoad: cpuUsage,
        },
        redis: {
          status: redisStatus,
          pingTimeMs: redisPingTime,
        },
      },
    };
  }
}
