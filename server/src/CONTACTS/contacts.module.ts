import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { contactsProviders } from './contacts.provider';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, ...contactsProviders],
  exports: [ContactsService, ...contactsProviders],
})
export class ContactsModule {}
