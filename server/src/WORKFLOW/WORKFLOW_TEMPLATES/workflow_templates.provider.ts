import { WorkflowTemplate } from './workflow_templates.entity';
import { KEYNAMES } from '../../shared/constants/keynames';

export const workflowTemplatesProviders = [
  {
    provide: KEYNAMES.WORKFLOW_TEMPLATES,
    useValue: WorkflowTemplate,
  },
];
