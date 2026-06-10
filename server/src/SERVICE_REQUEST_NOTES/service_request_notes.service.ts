import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ServiceRequestNote } from './service_request_notes.entity';
import { CreateServiceRequestNoteDto } from './dto/service_request_notes_create.dto';
import { KEYNAMES } from '../shared/constants/keynames';

@Injectable()
export class ServiceRequestNotesService {
  constructor(
    @Inject(KEYNAMES.SERVICE_REQUEST_NOTES)
    private readonly noteRepository: typeof ServiceRequestNote,
  ) {}

  async findByServiceRequestId(serviceRequestId: string, tenantId: string): Promise<ServiceRequestNote[]> {
    return this.noteRepository.findAll({
      where: { service_request_id: serviceRequestId, tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async create(tenantId: string, dto: CreateServiceRequestNoteDto): Promise<ServiceRequestNote> {
    return this.noteRepository.create({ tenant_id: tenantId, ...dto });
  }
}
