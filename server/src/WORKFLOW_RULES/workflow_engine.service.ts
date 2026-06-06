import { Injectable, Inject, Logger } from '@nestjs/common';
import { WorkflowRule } from './workflow_rules.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import axios from 'axios';

export interface WorkflowContext {
  [key: string]: unknown;
  tenant_id?: string;
  user_id?: string;
  record_id?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
}

export interface WorkflowAction {
  type: 'send_notification' | 'update_field' | 'create_record' | 'call_webhook';
  config: Record<string, unknown>;
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @Inject(KEYNAMES.WORKFLOW_RULES)
    private readonly workflowRuleRepository: typeof WorkflowRule,
  ) {}

  /**
   * Execute all workflow rules for a specific event
   */
  async executeRulesForEvent(
    eventName: string,
    module: string,
    context: WorkflowContext,
  ): Promise<void> {
    try {
      // Find all active rules for this event and module
      const rules = await this.workflowRuleRepository.findAll({
        where: {
          tenant_id: context.tenant_id,
          module,
          trigger_event: eventName,
          is_active: true,
          is_deleted: false,
        },
      });

      if (rules.length === 0) {
        this.logger.debug(`No workflow rules found for event: ${eventName} in module: ${module}`);
        return;
      }

      this.logger.log(`Executing ${rules.length} workflow rules for event: ${eventName}`);

      // Execute each rule asynchronously
      for (const rule of rules) {
        setImmediate(() => {
          this.executeRule(rule, context).catch((error) => {
            this.logger.error(
              `Failed to execute workflow rule ${rule.id}: ${error.message}`,
              error.stack,
            );
          });
        });
      }
    } catch (error) {
      this.logger.error(
        `Error executing workflow rules for event ${eventName}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Execute a single workflow rule
   */
  private async executeRule(rule: WorkflowRule, context: WorkflowContext): Promise<void> {
    try {
      this.logger.debug(`Evaluating workflow rule: ${rule.name}`);

      // Evaluate conditions
      if (rule.conditions && Object.keys(rule.conditions).length > 0) {
        const conditionsMet = this.evaluateConditions(rule.conditions, context);
        if (!conditionsMet) {
          this.logger.debug(`Conditions not met for rule: ${rule.name}`);
          return;
        }
      }

      this.logger.log(`Executing actions for rule: ${rule.name}`);

      // Execute actions
      if (rule.actions && Object.keys(rule.actions).length > 0) {
        await this.executeActions(rule.actions, context);
      }
    } catch (error) {
      this.logger.error(
        `Error executing rule ${rule.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Evaluate workflow conditions
   */
  evaluateConditions(conditions: Record<string, unknown>, context: WorkflowContext): boolean {
    try {
      // Support both array format and object format
      const conditionsList = Array.isArray(conditions)
        ? conditions
        : (conditions.conditions as WorkflowCondition[] || []);

      if (!Array.isArray(conditionsList) || conditionsList.length === 0) {
        return true; // No conditions means always execute
      }

      const matchType = (conditions.match_type as string) || 'all';

      for (const condition of conditionsList) {
        const result = this.evaluateSingleCondition(condition, context);

        if (matchType === 'all' && !result) {
          return false; // All conditions must match
        }
        if (matchType === 'any' && result) {
          return true; // At least one condition must match
        }
      }

      return matchType === 'all'; // If we get here, all matched for 'all' mode
    } catch (error) {
      this.logger.error(`Error evaluating conditions: ${error.message}`);
      return false;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSingleCondition(condition: WorkflowCondition, context: WorkflowContext): boolean {
    const fieldValue = context[condition.field];
    const targetValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === targetValue;
      case 'not_equals':
        return fieldValue !== targetValue;
      case 'contains':
        return String(fieldValue).includes(String(targetValue));
      case 'greater_than':
        return Number(fieldValue) > Number(targetValue);
      case 'less_than':
        return Number(fieldValue) < Number(targetValue);
      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(targetValue) && !targetValue.includes(fieldValue);
      default:
        this.logger.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Execute workflow actions
   */
  async executeActions(actions: Record<string, unknown>, context: WorkflowContext): Promise<void> {
    const actionsList = Array.isArray(actions) ? actions : (actions.actions as WorkflowAction[] || []);

    if (!Array.isArray(actionsList)) {
      this.logger.warn('Actions is not an array, skipping');
      return;
    }

    for (const action of actionsList) {
      try {
        await this.executeSingleAction(action, context);
      } catch (error) {
        this.logger.error(
          `Error executing action ${action.type}: ${error.message}`,
          error.stack,
        );
        // Continue with other actions even if one fails
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeSingleAction(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    switch (action.type) {
      case 'send_notification':
        await this.sendNotification(action, context);
        break;
      case 'update_field':
        await this.updateField(action, context);
        break;
      case 'create_record':
        await this.createRecord(action, context);
        break;
      case 'call_webhook':
        await this.callWebhook(action, context);
        break;
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send notification action
   */
  async sendNotification(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    this.logger.log(`[NOTIFICATION] Would send notification to: ${action.config.recipient}`);
    this.logger.log(`[NOTIFICATION] Subject: ${action.config.subject}`);
    this.logger.log(`[NOTIFICATION] Message: ${action.config.message}`);
    // TODO: Integrate with actual notification service when implemented
  }

  /**
   * Update field action
   */
  async updateField(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    this.logger.log(`[UPDATE_FIELD] Would update field '${action.config.field}' to value: ${action.config.value}`);
    this.logger.log(`[UPDATE_FIELD] Record ID: ${context.record_id}`);
    // TODO: Implement actual field update logic based on module type
  }

  /**
   * Create record action
   */
  async createRecord(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    this.logger.log(`[CREATE_RECORD] Would create record in module: ${action.config.module}`);
    this.logger.log(`[CREATE_RECORD] Data: ${JSON.stringify(action.config.data)}`);
    // TODO: Implement actual record creation based on module type
  }

  /**
   * Call webhook action
   */
  async callWebhook(action: WorkflowAction, context: WorkflowContext): Promise<void> {
    try {
      const url = action.config.url as string;
      const method = (action.config.method as string) || 'POST';
      const headers = (action.config.headers as Record<string, string>) || {};

      this.logger.log(`[WEBHOOK] Calling webhook: ${url}`);

      const payload = {
        ...context,
        timestamp: new Date().toISOString(),
        custom_data: action.config.data || {},
      };

      await axios({
        method: method as 'GET' | 'POST' | 'PUT' | 'PATCH',
        url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FieldForce-Workflow-Engine/1.0',
          ...headers,
        },
        timeout: 10000, // 10 second timeout
      });

      this.logger.log(`[WEBHOOK] Successfully called: ${url}`);
    } catch (error) {
      this.logger.error(`[WEBHOOK] Failed to call webhook: ${error.message}`);
      throw error;
    }
  }
}
