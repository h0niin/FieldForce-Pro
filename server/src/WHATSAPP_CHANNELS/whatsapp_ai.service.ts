import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PRIMARY_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

/**
 * Structured response from the AI intake engine.
 */
export interface WhatsAppAiResponse {
  /** The text reply to send to the customer */
  reply: string;
  /** Structured fields collected so far (merged with existing) */
  collected_fields: Record<string, unknown>;
  /** Whether all required fields have been collected */
  is_complete: boolean;
  /** Whether the AI recommends creating the ticket now */
  should_create_ticket: boolean;
  /** Whether the customer requested a human agent */
  wants_human: boolean;
  /** AI-inferred priority (low/medium/high/urgent) or null */
  inferred_priority: string | null;
  /** AI-inferred category or null */
  inferred_category: string | null;
}

/**
 * Builds the system prompt for the WhatsApp intake AI based on channel config.
 */
function buildIntakePrompt(config: {
  displayName: string;
  greeting: string;
  requiredFields: Record<string, boolean>;
  categories?: string[];
  languages?: string[];
  defaultPriority?: string;
}): string {
  const requiredList = Object.entries(config.requiredFields || {})
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ');

  const categoryList = config.categories?.length
    ? config.categories.join(', ')
    : 'General, Electrical, Plumbing, HVAC, Appliance, Cleaning, Other';

  return `
You are the ${config.displayName || 'Support'} AI assistant on WhatsApp. Your job is to collect information from customers to create a service request (support ticket).

YOUR ROLE:
- Have a natural, friendly conversation to collect the required information
- Ask ONLY for what's missing — if the customer provides everything at once, extract it all
- Be empathetic, professional, and concise
- When all required info is collected, show a summary and ask for confirmation

REQUIRED FIELDS TO COLLECT: ${requiredList || 'name, location, category'}
AVAILABLE CATEGORIES: ${categoryList}
DEFAULT PRIORITY: ${config.defaultPriority || 'Medium'}
LANGUAGES: ${config.languages?.join(', ') || 'English'}

CONVERSATION FLOW:
1. If this is a new conversation, greet the customer
2. Understand their issue from their messages
3. Ask for missing required fields one at a time (don't overwhelm)
4. When you have enough info, present a summary and ask "Shall I create this service request?"
5. If they confirm, signal that the ticket should be created

EDGE CASES:
- If the customer says "hello" or something vague, ask what they need help with
- If they mention an existing ticket, note it but still collect info for a new request
- If they ask for a human agent, acknowledge and flag it
- If the message is spam/irrelevant, politely decline and do NOT create a ticket
- If they send just a photo with no text, ask what the issue is
- If they want to cancel, acknowledge it
- If they provide two separate issues, offer to create two tickets

RESPONSE FORMAT — CRITICAL:
You MUST respond with a valid JSON object (no markdown fences, no extra text). The JSON must have these exact keys:
{
  "reply": "Your message to the customer",
  "collected_fields": {
    "customer_name": "...",
    "issue_description": "...",
    "category": "...",
    "sub_category": "...",
    "location": "...",
    "priority": "low|medium|high|urgent",
    "preferred_time": "...",
    "photos": []
  },
  "is_complete": false,
  "should_create_ticket": false,
  "wants_human": false,
  "inferred_priority": null,
  "inferred_category": null
}

Rules for collected_fields:
- Only include fields you've actually extracted from the conversation
- "priority" should be inferred from urgency words (e.g., "emergency" → "urgent", "water leaking" → "high")
- Set is_complete=true ONLY when all required fields are collected
- Set should_create_ticket=true ONLY when the customer confirms the summary
- Set wants_human=true if the customer explicitly asks for a person/human/agent
`.trim();
}

@Injectable()
export class WhatsAppAiService {
  private readonly logger = new Logger(WhatsAppAiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — WhatsApp AI will not function.');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log('WhatsAppAiService initialized with Gemini.');
  }

  /**
   * Process a customer message through the AI intake engine.
   */
  async processMessage(
    customerMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    channelConfig: {
      displayName: string;
      greeting: string;
      requiredFields: Record<string, boolean>;
      categories?: string[];
      languages?: string[];
      defaultPriority?: string;
    },
    existingCollectedData: Record<string, unknown> = {},
  ): Promise<WhatsAppAiResponse> {
    if (!this.genAI) {
      return {
        reply: "I'm sorry, our AI assistant is temporarily unavailable. Please try again later or call our support line.",
        collected_fields: existingCollectedData,
        is_complete: false,
        should_create_ticket: false,
        wants_human: false,
        inferred_priority: null,
        inferred_category: null,
      };
    }

    const systemPrompt = buildIntakePrompt(channelConfig);

    // Build context with existing collected data
    const contextPrefix = Object.keys(existingCollectedData).length > 0
      ? `[CONTEXT: Previously collected data: ${JSON.stringify(existingCollectedData)}]\n`
      : '';

    try {
      const response = await this.callGemini(
        systemPrompt,
        conversationHistory,
        contextPrefix + customerMessage,
        PRIMARY_MODEL,
      );
      return this.parseAiResponse(response, existingCollectedData);
    } catch (error) {
      this.logger.error(`Gemini primary model failed: ${error.message}`);

      // Fallback to secondary model
      try {
        const response = await this.callGemini(
          systemPrompt,
          conversationHistory,
          contextPrefix + customerMessage,
          FALLBACK_MODEL,
        );
        return this.parseAiResponse(response, existingCollectedData);
      } catch (fallbackError) {
        this.logger.error(`Gemini fallback also failed: ${fallbackError.message}`);
        
        let errorMessage = "I'm having trouble processing your request right now. Please try again in a moment.";
        
        // Detect quota exceeded error specifically
        if (
          fallbackError.message?.toLowerCase().includes('quota') ||
          fallbackError.message?.includes('429') ||
          error.message?.toLowerCase().includes('quota') ||
          error.message?.includes('429')
        ) {
          errorMessage = "Our AI assistant is currently unavailable due to high demand (Quota Exceeded). Please try again later or contact support directly.";
        }

        return {
          reply: errorMessage,
          collected_fields: existingCollectedData,
          is_complete: false,
          should_create_ticket: false,
          wants_human: false,
          inferred_priority: null,
          inferred_category: null,
        };
      }
    }
  }

  private async callGemini(
    systemPrompt: string,
    history: Array<{ role: string; content: string }>,
    userMessage: string,
    modelName: string,
  ): Promise<string> {
    const model = this.genAI!.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    return (await result.response).text();
  }

  private parseAiResponse(
    rawText: string,
    existingData: Record<string, unknown>,
  ): WhatsAppAiResponse {
    // Strip markdown fences if present
    let cleaned = rawText
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.warn('AI response was not valid JSON, using raw text as reply');
      return {
        reply: cleaned,
        collected_fields: existingData,
        is_complete: false,
        should_create_ticket: false,
        wants_human: false,
        inferred_priority: null,
        inferred_category: null,
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Merge collected_fields with existing data (new data takes precedence)
      const mergedFields = {
        ...existingData,
        ...Object.fromEntries(
          Object.entries(parsed.collected_fields || {}).filter(
            ([, v]) => v !== null && v !== undefined && v !== '',
          ),
        ),
      };

      return {
        reply: parsed.reply || 'I received your message.',
        collected_fields: mergedFields,
        is_complete: parsed.is_complete === true,
        should_create_ticket: parsed.should_create_ticket === true,
        wants_human: parsed.wants_human === true,
        inferred_priority: parsed.inferred_priority || null,
        inferred_category: parsed.inferred_category || null,
      };
    } catch (parseError) {
      this.logger.warn(`Failed to parse AI JSON: ${parseError.message}`);
      return {
        reply: cleaned,
        collected_fields: existingData,
        is_complete: false,
        should_create_ticket: false,
        wants_human: false,
        inferred_priority: null,
        inferred_category: null,
      };
    }
  }
}
