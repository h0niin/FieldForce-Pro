import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { BlueprintDefinition } from './blueprint_definitions.entity';
import { BlueprintState } from '../BLUEPRINT_STATES/blueprint_states.entity';
import { BlueprintTransition } from '../BLUEPRINT_TRANSITIONS/blueprint_transitions.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import axios from 'axios';

export interface TransitionContext {
  [key: string]: unknown;
}

export interface TransitionResult {
  success: boolean;
  message: string;
  nextState?: BlueprintState;
  errors?: string[];
}

@Injectable()
export class BlueprintEngineService {
  private readonly logger = new Logger(BlueprintEngineService.name);

  constructor(
    @Inject(KEYNAMES.BLUEPRINT_DEFINITIONS)
    private readonly blueprintRepository: typeof BlueprintDefinition,
    @Inject(KEYNAMES.BLUEPRINT_STATES)
    private readonly stateRepository: typeof BlueprintState,
    @Inject(KEYNAMES.BLUEPRINT_TRANSITIONS)
    private readonly transitionRepository: typeof BlueprintTransition,
  ) {}

  /**
   * Validates if a state transition is allowed
   */
  async validateTransition(
    blueprintId: string,
    fromStateId: string,
    toStateId: string,
    userId: string,
    context: TransitionContext = {},
  ): Promise<TransitionResult> {
    try {
      // Find the transition definition
      const transition = await this.transitionRepository.findOne({
        where: {
          blueprint_id: blueprintId,
          from_state_id: fromStateId,
          to_state_id: toStateId,
          is_deleted: false,
        },
        include: [
          { model: BlueprintState, as: 'from_state' },
          { model: BlueprintState, as: 'to_state' },
        ],
      });

      if (!transition) {
        return {
          success: false,
          message: `No transition defined from state ${fromStateId} to ${toStateId}`,
        };
      }

      const errors: string[] = [];

      // Validate required fields
      if (transition.required_fields && transition.required_fields.length > 0) {
        const missingFields = this.validateRequiredFields(
          transition.required_fields,
          context,
        );
        if (missingFields.length > 0) {
          errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        }
      }

      // Evaluate guard condition if present
      if (transition.guard_condition) {
        const guardResult = this.evaluateGuardCondition(
          transition.guard_condition,
          context,
        );
        if (!guardResult) {
          errors.push('Guard condition failed');
        }
      }

      // TODO: Validate allowed roles when user roles are available in context
      // if (transition.allowed_roles && transition.allowed_roles.length > 0) {
      //   const userRoles = context.userRoles || [];
      //   const hasPermission = transition.allowed_roles.some(role => userRoles.includes(role));
      //   if (!hasPermission) {
      //     errors.push('User does not have permission for this transition');
      //   }
      // }

      if (errors.length > 0) {
        return {
          success: false,
          message: 'Transition validation failed',
          errors,
        };
      }

      return {
        success: true,
        message: 'Transition is valid',
        nextState: transition.to_state,
      };
    } catch (error) {
      this.logger.error(
        `Error validating transition: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: `Validation error: ${error.message}`,
      };
    }
  }

  /**
   * Gets available transitions from the current state
   */
  async getAvailableTransitions(
    blueprintId: string,
    currentStateId: string,
  ): Promise<BlueprintTransition[]> {
    return this.transitionRepository.findAll({
      where: {
        blueprint_id: blueprintId,
        from_state_id: currentStateId,
        is_deleted: false,
      },
      include: [
        { model: BlueprintState, as: 'from_state' },
        { model: BlueprintState, as: 'to_state' },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  /**
   * Executes a state transition with guards and webhooks
   */
  async executeTransition(
    blueprintId: string,
    fromStateId: string,
    toStateId: string,
    recordId: string,
    userId: string,
    context: TransitionContext = {},
  ): Promise<TransitionResult> {
    // First validate the transition
    const validationResult = await this.validateTransition(
      blueprintId,
      fromStateId,
      toStateId,
      userId,
      context,
    );

    if (!validationResult.success) {
      return validationResult;
    }

    try {
      // Get the transition to check for webhook
      const transition = await this.transitionRepository.findOne({
        where: {
          blueprint_id: blueprintId,
          from_state_id: fromStateId,
          to_state_id: toStateId,
          is_deleted: false,
        },
      });

      // Trigger webhook if configured (asynchronously, don't block)
      if (transition?.webhook_url) {
        setImmediate(() => {
          this.triggerWebhook(transition.webhook_url, {
            blueprint_id: blueprintId,
            transition_id: transition.id,
            from_state_id: fromStateId,
            to_state_id: toStateId,
            record_id: recordId,
            user_id: userId,
            context,
            timestamp: new Date().toISOString(),
          }).catch((error) => {
            this.logger.error(
              `Webhook failed for transition ${transition.id}: ${error.message}`,
            );
          });
        });
      }

      return {
        success: true,
        message: 'Transition executed successfully',
        nextState: validationResult.nextState,
      };
    } catch (error) {
      this.logger.error(
        `Error executing transition: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: `Execution error: ${error.message}`,
      };
    }
  }

  /**
   * Evaluates a JavaScript guard condition
   * Guard conditions are simple JavaScript expressions that return boolean
   */
  evaluateGuardCondition(
    guardCondition: string,
    context: TransitionContext,
  ): boolean {
    try {
      // Create a safe evaluation context
      // This is a simplified implementation - in production, use a proper sandbox
      const func = new Function(
        ...Object.keys(context),
        `return (${guardCondition});`,
      );
      const result = func(...Object.values(context));
      return Boolean(result);
    } catch (error) {
      this.logger.warn(
        `Guard condition evaluation failed: ${error.message}. Condition: ${guardCondition}`,
      );
      return false;
    }
  }

  /**
   * Validates that required fields are present in the context
   */
  validateRequiredFields(
    requiredFields: string[],
    context: TransitionContext,
  ): string[] {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!(field in context) || context[field] === null || context[field] === undefined) {
        missingFields.push(field);
      }
    }

    return missingFields;
  }

  /**
   * Triggers a webhook with the given payload
   */
  async triggerWebhook(webhookUrl: string, payload: Record<string, unknown>): Promise<void> {
    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FieldForce-Blueprint-Engine/1.0',
        },
        timeout: 10000, // 10 second timeout
      });
      this.logger.log(`Webhook triggered successfully: ${webhookUrl}`);
    } catch (error) {
      this.logger.error(
        `Webhook failed: ${webhookUrl}. Error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get initial state for a blueprint
   */
  async getInitialState(blueprintId: string): Promise<BlueprintState | null> {
    return this.stateRepository.findOne({
      where: {
        blueprint_id: blueprintId,
        is_initial: true,
        is_deleted: false,
      },
    });
  }

  /**
   * Get final states for a blueprint
   */
  async getFinalStates(blueprintId: string): Promise<BlueprintState[]> {
    return this.stateRepository.findAll({
      where: {
        blueprint_id: blueprintId,
        is_final: true,
        is_deleted: false,
      },
    });
  }
}
