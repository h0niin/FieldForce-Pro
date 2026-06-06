import { Module } from '@nestjs/common';
import { MagicLinksController } from './magic_links.controller';
import { MagicLinksService } from './magic_links.service';
import { magicLinksProviders } from './magic_links.provider';
import { UsersModule } from '../USERS/users.module';
import { LoginSessionsModule } from '../LOGIN_SESSIONS/login_sessions.module';

@Module({
  imports: [UsersModule, LoginSessionsModule],
  controllers: [MagicLinksController],
  providers: [MagicLinksService, ...magicLinksProviders],
})
export class MagicLinksModule {}
