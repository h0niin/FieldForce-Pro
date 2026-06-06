import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PRIMARY_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

/**
 * A single extracted issue from the email.
 */
export interface ExtractedIssue {
  /** Clean one-line summary of the issue */
  summary: string;
  /** Inferred category or null */
  category: string | null;
  /** Inferred sub-category or null */
  sub_category: string | null;
  /** Inferred priority (low/medium/high/urgent) or null */
  priority: string | null;
  /** Extracted location/site or null */
  location: string | null;
  /** Any reference numbers, asset IDs, or prior ticket numbers */
  reference_numbers: string[];
  /** All extracted structured fields for this issue */
  extracted_fields: Record<string, unknown>;
}

/**
 * Structured response from the Email AI classification engine.
 */
export interface EmailAiResponse {
  /** Whether this is a genuine service request */
  is_service_request: boolean;
  /** Classification of the email */
  classification: 'service_request' | 'spam' | 'auto_reply' | 'newsletter' | 'sensitive' | 'unclear';
  /** Array of distinct issues found in the email (usually 1, but can be 2+ for multi-issue emails) */
  issues: ExtractedIssue[];
  /** Detected sentiment */
  sentiment: 'neutral' | 'frustrated' | 'angry' | 'escalated';
  /** Detected language */
  language_detected: string;
  /** AI confidence score (0-1) */
  confidence: number;
  /** Whether clarification is needed from the customer */
  needs_clarification: boolean;
  /** Reply to send if clarification is needed */
  clarification_reply: string | null;
  /** Acknowledgement reply template (with ticket details filled in) */
  acknowledgement_reply: string;
}

/**
 * Builds the system prompt for the Email AI classification engine.
 */
function buildEmailClassificationPrompt(config: {
  companyName: string;
  categories: string[];
  priorityRules: Record<string, unknown>;
  defaultCategory: string;
  defaultPriority: string;
  humanHandoffKeywords: string[];
}): string {
  const categoryList = config.categories?.length
    ? config.categories.join(', ')
    : 'General, Electrical, Plumbing, HVAC, IT, Cleaning, Other';

  const handoffKeywords = config.humanHandoffKeywords?.length
    ? config.humanHandoffKeywords.join(', ')
    : 'lawyer, legal, refund, sue, complaint';

  const priorityKeywords = config.priorityRules?.['keywords']
    ? Object.entries(config.priorityRules['keywords'] as Record<string, string>)
        .map(([word, level]) => `"${word}" → ${level}`)
        .join(', ')
    : '"urgent" → HIGH, "emergency" → CRITICAL, "asap" → HIGH';

  return `
You are the ${config.companyName || 'Support'} AI email classification assistant. Your job is to read an incoming email and extract structured information to create a service request (support ticket).

YOUR ROLE:
- Read the email subject, body, and any attachment metadata
- Determine if this is a real service request, spam, an auto-reply/OOO, a newsletter, or a sensitive/escalation email
- Extract all relevant structured data from the email in a single pass
- Generate appropriate reply text

AVAILABLE CATEGORIES: ${categoryList}
DEFAULT CATEGORY: ${config.defaultCategory || 'General'}
DEFAULT PRIORITY: ${config.defaultPriority || 'Medium'}
PRIORITY KEYWORDS: ${priorityKeywords}
SENSITIVE/HANDOFF KEYWORDS: ${handoffKeywords}

CLASSIFICATION RULES:
1. "service_request" — A genuine request for service, maintenance, repair, or support
2. "spam" — Marketing, promotions, unsolicited messages
3. "auto_reply" — Out-of-office replies, delivery failure bounces, auto-acknowledgements
4. "newsletter" — Newsletters, digests, subscription emails
5. "sensitive" — Contains legal threats, refund demands, or other keywords requiring human review (${handoffKeywords})
6. "unclear" — Real customer, but insufficient info to create a clear ticket

EXTRACTION RULES:
- Extract the customer name from the email signature or "From" header
- Summarize the issue in one clear, concise sentence
- Infer the category from the email content (e.g. "printer jammed" → IT / Printer)
- Infer priority from urgency words and context
- Extract any location/site/address from the body or signature
- Extract any reference numbers (asset IDs, contract numbers, prior ticket numbers)
- Detect the language of the email
- Assess the sender's sentiment (neutral, frustrated, angry, escalated)

MULTIPLE ISSUES:
- If the email describes two or more DISTINCT issues (e.g. "the AC is noisy AND the tap is leaking"), return each as a separate object in the "issues" array
- Each issue will become its own service request
- If there is only one issue, still return it as a single-element array

SPAM/AUTO-REPLY DETECTION:
- Out-of-office patterns: "out of office", "auto-reply", "automatic reply", "OOO", "I am currently away"
- Bounce patterns: "delivery failed", "undeliverable", "mailer-daemon"
- Newsletter patterns: "unsubscribe", "view in browser", "email preferences"
- Ignore these and set is_service_request = false

RESPONSE FORMAT — CRITICAL:
You MUST respond with a valid JSON object (no markdown fences, no extra text). The JSON must have these exact keys:
{
  "is_service_request": true,
  "classification": "service_request",
  "issues": [
    {
      "summary": "One-line description of the issue",
      "category": "Category name",
      "sub_category": "Sub-category if applicable",
      "priority": "low|medium|high|urgent",
      "location": "Extracted location or null",
      "reference_numbers": [],
      "extracted_fields": {
        "customer_name": "...",
        "issue_description": "...",
        "category": "...",
        "sub_category": "...",
        "location": "...",
        "priority": "...",
        "reference_numbers": [],
        "attachments_noted": []
      }
    }
  ],
  "sentiment": "neutral|frustrated|angry|escalated",
  "language_detected": "en",
  "confidence": 0.95,
  "needs_clarification": false,
  "clarification_reply": null,
  "acknowledgement_reply": "Your reply to the customer confirming ticket creation"
}

Rules:
- For spam/auto-reply/newsletter: set is_service_request=false, classification accordingly, and issues can be empty []
- For "unclear": set needs_clarification=true and provide a helpful clarification_reply asking for missing details
- For "sensitive": set classification="sensitive" and keep acknowledgement_reply neutral and professional
- The acknowledgement_reply should reference the issue summary and assure the customer their request is logged
- If multiple issues, mention all of them in the acknowledgement_reply
- Always reply in the same language as the email
`.trim();
}

@Injectable()
export class EmailAiService {
  private readonly logger = new Logger(EmailAiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — Email AI will not function.');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log('EmailAiService initialized with Gemini.');
  }

  /**
   * Classify and extract data from an inbound email.
   */
  async classifyEmail(
    subject: string,
    textBody: string,
    senderEmail: string,
    senderName: string,
    attachmentsSummary: string,
    channelConfig: {
      companyName: string;
      categories: string[];
      priorityRules: Record<string, unknown>;
      defaultCategory: string;
      defaultPriority: string;
      humanHandoffKeywords: string[];
    },
  ): Promise<EmailAiResponse> {
    if (!this.genAI) {
      return this.fallbackResponse(subject, textBody);
    }

    const systemPrompt = buildEmailClassificationPrompt(channelConfig);

    // Compose the email content for AI analysis
    const emailContent = [
      `From: ${senderName} <${senderEmail}>`,
      `Subject: ${subject || '(no subject)'}`,
      '',
      'Body:',
      textBody || '(empty body)',
      attachmentsSummary ? `\nAttachments: ${attachmentsSummary}` : '',
    ].join('\n');

    try {
      const response = await this.callGemini(systemPrompt, emailContent, PRIMARY_MODEL);
      return this.parseAiResponse(response);
    } catch (error) {
      this.logger.error(`Gemini primary model failed: ${error.message}`);

      // Fallback to secondary model
      try {
        const response = await this.callGemini(systemPrompt, emailContent, FALLBACK_MODEL);
        return this.parseAiResponse(response);
      } catch (fallbackError) {
        this.logger.error(`Gemini fallback also failed: ${fallbackError.message}`);

        // Check for quota errors
        if (
          fallbackError.message?.toLowerCase().includes('quota') ||
          fallbackError.message?.includes('429') ||
          error.message?.toLowerCase().includes('quota') ||
          error.message?.includes('429')
        ) {
          return this.fallbackResponse(subject, textBody, 'AI service temporarily unavailable due to high demand.');
        }

        return this.fallbackResponse(subject, textBody);
      }
    }
  }

  private async callGemini(
    systemPrompt: string,
    emailContent: string,
    modelName: string,
  ): Promise<string> {
    const model = this.genAI!.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(emailContent);
    return (await result.response).text();
  }

  private parseAiResponse(rawText: string): EmailAiResponse {
    // Strip markdown fences if present
    let cleaned = rawText
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.warn('AI response was not valid JSON, using fallback');
      return this.fallbackResponse('', cleaned);
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Build issues array — support both old flat format and new issues array
      let issues: ExtractedIssue[];
      if (Array.isArray(parsed.issues) && parsed.issues.length > 0) {
        issues = parsed.issues.map((issue: Record<string, unknown>) => ({
          summary: (issue.summary as string) || 'Service request',
          category: (issue.category as string) || null,
          sub_category: (issue.sub_category as string) || null,
          priority: (issue.priority as string) || null,
          location: (issue.location as string) || null,
          reference_numbers: (issue.reference_numbers as string[]) || [],
          extracted_fields: (issue.extracted_fields as Record<string, unknown>) || {},
        }));
      } else {
        // Fallback: AI returned flat format — wrap in single-element array
        issues = [{
          summary: parsed.summary || 'Email service request',
          category: parsed.category || null,
          sub_category: parsed.sub_category || null,
          priority: parsed.priority || null,
          location: parsed.location || null,
          reference_numbers: parsed.reference_numbers || [],
          extracted_fields: parsed.extracted_fields || {},
        }];
      }

      return {
        is_service_request: parsed.is_service_request !== false,
        classification: parsed.classification || 'service_request',
        issues,
        sentiment: parsed.sentiment || 'neutral',
        language_detected: parsed.language_detected || 'en',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        needs_clarification: parsed.needs_clarification === true,
        clarification_reply: parsed.clarification_reply || null,
        acknowledgement_reply: parsed.acknowledgement_reply || 'Your request has been received.',
      };
    } catch (parseError) {
      this.logger.warn(`Failed to parse AI JSON: ${parseError.message}`);
      return this.fallbackResponse('', cleaned);
    }
  }

  private fallbackResponse(
    subject: string,
    textBody: string,
    errorNote?: string,
  ): EmailAiResponse {
    return {
      is_service_request: true,
      classification: 'unclear',
      issues: [{
        summary: subject || textBody?.substring(0, 200) || 'Email service request',
        category: null,
        sub_category: null,
        priority: null,
        location: null,
        reference_numbers: [],
        extracted_fields: {},
      }],
      sentiment: 'neutral',
      language_detected: 'en',
      confidence: 0,
      needs_clarification: true,
      clarification_reply: errorNote ||
        'Thank you for contacting us. Could you provide more details about your issue so we can assist you better?',
      acknowledgement_reply: 'Your request has been received and logged.',
    };
  }
}
