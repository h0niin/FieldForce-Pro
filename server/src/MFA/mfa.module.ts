import { Module } from '@nestjs/common';
import { MFAController } from './mfa.controller';
import { MFAService } from './mfa.service';
import { DatabaseModule } from '../database/database.module';
import { User } from '../USERS/users.entity';
import { REPOSITORY } from '../shared/constants/keynames';

@Module({
  imports: [DatabaseModule],
  controllers: [MFAController],
  providers: [
    MFAService,
    {
      provide: REPOSITORY.USERS,
      useValue: User,
    },
  ],
  exports: [MFAService],
})
export class MFAModule {}
