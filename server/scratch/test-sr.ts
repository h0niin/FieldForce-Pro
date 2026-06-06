import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const { ServiceRequest } = require('../src/SERVICE_REQUESTS/service_requests.entity');
    const srs = await ServiceRequest.findAll({ attributes: ['id', 'request_number', 'is_deleted', 'created_at'] });
    console.log('All Service Requests:');
    srs.forEach((sr: any) => console.log(sr.request_number, sr.is_deleted, sr.created_at));
  } catch (err: any) {
    console.error('FAILED:', err);
  }

  await app.close();
}

bootstrap();
