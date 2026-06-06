import { Module } from '@nestjs/common';
import { loginSessionsProviders } from './login_sessions.provider';

@Module({
  providers: [...loginSessionsProviders],
  exports: [...loginSessionsProviders],
})
export class LoginSessionsModule {}
