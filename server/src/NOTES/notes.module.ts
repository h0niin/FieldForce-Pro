import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from './notes.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import { ActivityLogsModule } from '../ACTIVITY_LOGS/activity_logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [NotesController],
  providers: [
    NotesService,
    {
      provide: KEYNAMES.NOTES,
      useValue: Note,
    },
  ],
  exports: [NotesService],
})
export class NotesModule {}
