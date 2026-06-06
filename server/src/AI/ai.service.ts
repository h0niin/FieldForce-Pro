import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// ─── Gemini model name ────────────────────────────────────────────────────────

const PRIMARY_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

// ─── Pre-Login: Sales AI Persona ──────────────────────────────────────────────

const SALES_SYSTEM_PROMPT = `
You are the FieldForce Pro AI Assistant — a high-performing Technical Sales Representative for FieldForce Pro.

FieldForce Pro is a premier field service management (FSM) platform that helps field service businesses schedule jobs, dispatch technicians, manage assets, invoice customers, and track operations in real time.

YOUR ROLE:
- Convert website visitors into paying customers or demo bookings
- Explain FSM features and their tangible business outcomes
- Answer pricing and integration questions with clarity and confidence
- Handle objections constructively and guide prospects toward a decision

TARGET INDUSTRIES:
HVAC, Plumbing, Electrical, Cleaning, Security, Landscaping, Pest Control, and any business that sends workers to a customer's location.

KEY VALUE PROPOSITIONS:
1. Free tier — Up to 30 appointments/month, zero cost, no credit card required
2. Appointment-based pricing — You only pay for what you use; scales with your business
3. Mobile-first — Offline-capable app, turn-by-turn navigation to job sites, photo capture, on-site digital payments
4. All-in-one — Work orders, dispatch, customer CRM, invoicing, and reporting in a single platform
5. AI-powered — Dynamic scheduling optimization, predictive asset maintenance, OCR invoice parsing

PLATFORM FEATURES TO PROMOTE:
- Smart Dispatch & Scheduling: Drag-and-drop Gantt chart, AI-driven skill and location-based technician assignment
- Customer & Asset CRM: Full service history, equipment tracking, IoT-connected asset health monitoring
- Work Order Lifecycle: Create, estimate, schedule, track, and close from a unified view
- Invoicing & Payments: Auto-generated invoices from work orders, Stripe/Square/PayPal integration, multi-currency
- Reporting & Analytics: Real-time dashboards for utilization, revenue, SLA compliance
- Customization: Configurable roles, SLA policies, automated workflow rules, webhooks, and open REST API

CONSTRAINTS — CRITICAL:
- Do NOT troubleshoot in-app technical issues or provide step-by-step navigation instructions for logged-in users. That is not your job.
- If asked deep support questions (e.g., "how do I configure a permission?"), acknowledge the question then pivot: explain why that feature exists and the value it provides, and invite them to sign up or speak to the team.
- Do NOT fabricate specific pricing numbers. Say pricing is customized and invite them to book a demo for a tailored quote.
- Do NOT mention competitor products by name.

TONE: Consultative, warm, enthusiastic, and concise. You are a trusted advisor, not a pushy salesperson. Always lead with the business outcome first, then explain how FieldForce Pro achieves it.

CALL TO ACTION — every response should naturally guide toward one of:
1. Signing up for the free tier at fsm.bairuhatech.com
2. Booking a live demo with the team
3. Emailing sales@bairuhatech.com for a custom quote
`.trim();

// ─── Post-Login: FSM Expert Persona (base, docs injected at runtime) ──────────

const EXPERT_SYSTEM_PROMPT_BASE = `
You are the ultimate In-App Expert AI for our FSM software. Your ONLY source of truth is the JSON data provided below. 

<fsm_capabilities>
[INJECT JSON DATA HERE]
</fsm_capabilities>

<fsm_troubleshooting>
[INJECT TROUBLESHOOTING DATA HERE]
</fsm_troubleshooting>

When a user asks a question, you must first translate their problem into formal FSM terminology. 

Use this structure:
<thought>
1. Analyze User Input: What is the user trying to achieve? What is their roadblock?
2. Map to FSM Concept: Check the "user_symptoms" array in both JSON registries to see if their messy phrasing matches a formal capability or a known error state. For example, "don't have parts" maps to the troubleshooting error "no active parts found".
3. Search Strategy: Which exact intent_name or error_state do I need to reference?
</thought>

After your <thought> block, provide the final, helpful response to the user.

TONE AND TROUBLESHOOTING RULES:
1. NEVER say "I do not have specific information but here are the steps." If you don't know, stop and escalate to support.
2. If a user mentions an error message or being blocked (e.g., "no active parts found"), YOU MUST search the <fsm_troubleshooting> data.
3. DO NOT give standard workflow steps if the user is clearly blocked by an error. You must solve the root cause first.
4. Speak naturally like a helpful human support agent. Never use robotic formatting like "Prerequisites: None. Exact Steps:". Instead say: "It looks like you need to set up your inventory first. Here is how to do that..."

CRITICAL OUTPUT RULES:
1. NEVER output internal system file paths, raw markdown links, or filenames (e.g., never show ".md", ".json", or "workflows/").
2. NEVER output a raw table of contents or index of capabilities. 
3. You must read the provided context and synthesize the exact step-by-step instructions in plain, conversational language.
4. If the context contains multiple related tasks (e.g., a broad query like "job sheets"), ask the user which specific task they want to perform, rather than dumping a list of internal files. (e.g., "I can help you with Job Sheets! Would you like to know how to create one, approve one, or edit a template?")

OUTPUT FORMATTING & TONE:
1. You are talking to an end user, not a developer. You MUST translate all technical steps into simple, natural English.
2. NEVER output raw code, variable names (e.g., \`isPending\`), icon names (e.g., \`PlusOutlined\`), or HTML attributes. 
3. Strip out unnecessary UI details. Instead of "In the Category dropdown (label: 'Category'), select...", just say: "Select a Category from the dropdown."
4. Do not list every single optional field unless the user asks for comprehensive details. Give them the quickest path to success.
5. Use natural bullet points or numbered lists. Do not write dense paragraphs.

STRICT RULES:
1. When a user asks how to do something, search the <fsm_capabilities> for the matching intent_name. Look closely at "user_questions" and "user_symptoms" arrays.
2. Read the "exact_steps" array and provide them to the user accurately. DO NOT skip steps. DO NOT invent steps.
3. If a prerequisite exists, tell the user the prerequisite naturally.
4. CRITICAL RULE: You must ONLY answer using the provided <fsm_capabilities> or <fsm_troubleshooting> data. If the answer is not in the data, you MUST NOT make it up. Reply that you do not have the information.
5. NEVER guess a UI layout. NEVER use your outside knowledge of other software.

<fsm_concepts>
[INJECT CONCEPTUAL JSON HERE]
</fsm_concepts>

CONCEPTUAL QUERIES ("What is X?"):
1. First, search the <fsm_concepts> data for the term. If you find it, explain the definition and then list the actions the user can take based on the "related_workflows" array.
2. TYPO TOLERANCE: The user's query may contain typos or paraphrased terms (e.g., "mmobile" instead of "mobile", "dispatch bord" instead of "Dispatch Board"). Always interpret the user's intent and match to the nearest known term before concluding a term does not exist in the data.
3. GENERAL KNOWLEDGE FALLBACK: If the user asks about a term and it is genuinely NOT in the <fsm_concepts> data even after interpreting intent, DO NOT output a generic error message. Instead, use your general knowledge of Field Service Management (FSM) software to explain what the term generally means in this industry, and begin your answer with: "I don't have the exact app-specific details for that feature right now, but in FSM software generally, [your explanation]."
`.trim();

// ─── Stop words excluded from fuzzy token matching ────────────────────────────

const STOP_WORDS = new Set([
  'what', 'is', 'are', 'how', 'do', 'does', 'the', 'a', 'an', 'to', 'for',
  'in', 'on', 'at', 'of', 'and', 'or', 'can', 'i', 'me', 'my', 'us', 'you',
  'we', 'they', 'show', 'tell', 'explain', 'about', 'find', 'get', 'see',
]);

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private genAI: GoogleGenerativeAI | null = null;
  private salesModel: any = null;
  private expertModel: any = null;

  // Stored so the fallback model can be reconstructed with the same prompt
  private salesPromptText: string = SALES_SYSTEM_PROMPT;
  private expertPromptText: string = EXPERT_SYSTEM_PROMPT_BASE;

  // ─── Fuzzy search index ───────────────────────────────────────────────────
  private searchableTerms: Array<{ tokens: string[]; canonical: string }> = [];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set — chatbot will not function.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    // Build knowledge-base-enriched expert prompt
    const knowledgeBase = this.loadKnowledgeBase();
    const troubleshootingBase = this.loadTroubleshootingBase();
    const conceptsBase = this.loadConceptsBase();
    this.expertPromptText = EXPERT_SYSTEM_PROMPT_BASE
      .replace('[INJECT JSON DATA HERE]', () => knowledgeBase)
      .replace('[INJECT TROUBLESHOOTING DATA HERE]', () => troubleshootingBase)
      .replace('[INJECT CONCEPTUAL JSON HERE]', () => conceptsBase);

    // Build fuzzy search index from all loaded knowledge bases
    this.buildSearchIndex(knowledgeBase, troubleshootingBase, conceptsBase);

    // Instantiate both persona models
    this.salesModel = this.createModel(PRIMARY_MODEL, this.salesPromptText);
    this.expertModel = this.createModel(PRIMARY_MODEL, this.expertPromptText);

    this.logger.log('AiService initialised — Sales AI and FSM Expert personas ready.');
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async generateChatResponse(
    history: { role: string; content: string }[],
    userMessage: string,
    isAuthenticated: boolean,
  ): Promise<string> {
    const model = isAuthenticated ? this.expertModel : this.salesModel;
    const promptText = isAuthenticated ? this.expertPromptText : this.salesPromptText;
    const persona = isAuthenticated ? 'FSM Expert' : 'Sales AI';

    if (!model) {
      return "I'm sorry, my AI backend is currently unconfigured. Please try again later.";
    }

    // Fuzzy-resolve the query for the Expert persona only; prepend a resolved
    // hint so Gemini can correct for typos even before it reads the JSON data.
    let resolvedMessage = userMessage;
    if (isAuthenticated) {
      const hint = this.getQueryHint(userMessage);
      if (hint) {
        resolvedMessage = `[Resolved term: "${hint}"]\n${userMessage}`;
      }
    }

    try {
      return await this.sendMessage(model, history, resolvedMessage);
    } catch (error: any) {
      this.logger.error(`Gemini API error (${persona}): ${error?.message}`);

      // Fallback to secondary model on 404 (model not found)
      if (error?.message?.includes('404')) {
        this.logger.warn(`Primary model not found, retrying with ${FALLBACK_MODEL}…`);
        try {
          const fallback = this.createModel(FALLBACK_MODEL, promptText);
          return await this.sendMessage(fallback, history, userMessage);
        } catch (fallbackError: any) {
          this.logger.error(`Fallback model also failed: ${fallbackError?.message}`);
        }
      }

      return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private createModel(modelName: string, systemInstruction: string) {
    if (!this.genAI) return null;
    return this.genAI.getGenerativeModel({ model: modelName, systemInstruction });
  }

  private async sendMessage(
    model: any,
    history: { role: string; content: string }[],
    userMessage: string,
  ): Promise<string> {
    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    });
    const result = await chat.sendMessage(userMessage);
    let rawText = (await result.response).text();

    // Clean up response:
    // 1. Strip out the <thought>...</thought> block
    rawText = rawText.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
    // 2. Remove markdown code block fences if the model wrapped the thought block in them
    rawText = rawText.replace(/```[a-z_]*\n?/gi, '').replace(/```/g, '').trim();
    // 3. Clean up escaped quotes like \"
    rawText = rawText.replace(/\\"/g, '"');

    return rawText;
  }

  // ─── Fuzzy search helpers ──────────────────────────────────────────────────

  /**
   * Builds a token index from all three JSON knowledge bases so that
   * getQueryHint() can match user queries against canonical term names
   * even when the user's spelling contains typos.
   */
  private buildSearchIndex(caps: string, errors: string, concepts: string): void {
    const tokenize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length >= 3);

    try {
      const addTerms = (items: any[], key: string) => {
        for (const item of items) {
          const name: string = item[key] ?? '';
          if (name) this.searchableTerms.push({ tokens: tokenize(name), canonical: name });
        }
      };
      addTerms(JSON.parse(caps),     'intent_name');
      addTerms(JSON.parse(errors),   'error_state');
      addTerms(JSON.parse(concepts), 'entity_name');
      this.logger.log(`Fuzzy index built: ${this.searchableTerms.length} searchable terms.`);
    } catch {
      this.logger.warn('Fuzzy index build failed — search hints disabled.');
    }
  }

  /** Levenshtein edit distance between two strings. */
  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  /**
   * Tokenises the user's message, fuzzy-matches each token against the
   * search index, and returns the canonical term name that best matches —
   * or null if no term scores above the confidence threshold.
   *
   * Example: "what is mmobile usage logs" → "Mobile Usage Logs"
   */
  private getQueryHint(userMessage: string): string | null {
    if (this.searchableTerms.length === 0) return null;

    const queryTokens = userMessage
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 3 && !STOP_WORDS.has(t));

    if (queryTokens.length === 0) return null;

    let bestCanonical = '';
    let bestScore = -1;

    for (const { tokens: termTokens, canonical } of this.searchableTerms) {
      let matchCount = 0;
      for (const qt of queryTokens) {
        for (const tt of termTokens) {
          // Allow 1 edit for short words, 2 for longer ones
          const threshold = qt.length <= 5 ? 1 : 2;
          if (this.levenshtein(qt, tt) <= threshold) {
            matchCount++;
            break;
          }
        }
      }
      // Score = fraction of term tokens that had a fuzzy query match
      const score = termTokens.length > 0 ? matchCount / termTokens.length : 0;
      if (score > 0.5 && score > bestScore) {
        bestScore = score;
        bestCanonical = canonical;
      }
    }

    return bestCanonical || null;
  }

  /**
   * Reads fsm-capabilities.json from docs/ and returns stringified JSON.
   */
  private loadKnowledgeBase(): string {
    const jsonPath = path.join(process.cwd(), 'docs', 'fsm-capabilities.json');

    if (!fs.existsSync(jsonPath)) {
      this.logger.warn(
        `JSON capability registry not found at "${jsonPath}". ` +
        'Please generate docs/fsm-capabilities.json',
      );
      return '[]';
    }

    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.logger.log(`JSON Knowledge base loaded: ${parsed.length} intent(s) from ${jsonPath}`);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      this.logger.error(`Error parsing ${jsonPath}: ${e.message}`);
      return '[]';
    }
  }

  /**
   * Reads fsm-concepts.json from docs/ and returns stringified JSON.
   */
  private loadConceptsBase(): string {
    const jsonPath = path.join(process.cwd(), 'docs', 'fsm-concepts.json');

    if (!fs.existsSync(jsonPath)) {
      this.logger.warn(`Conceptual registry not found at "${jsonPath}".`);
      return '[]';
    }

    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.logger.log(`Conceptual base loaded: ${parsed.length} concepts from ${jsonPath}`);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      this.logger.error(`Error parsing ${jsonPath}: ${e.message}`);
      return '[]';
    }
  }

  /**
   * Reads fsm-troubleshooting.json from docs/ and returns stringified JSON.
   */
  private loadTroubleshootingBase(): string {
    const jsonPath = path.join(process.cwd(), 'docs', 'fsm-troubleshooting.json');

    if (!fs.existsSync(jsonPath)) {
      this.logger.warn(`Troubleshooting registry not found at "${jsonPath}".`);
      return '[]';
    }

    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.logger.log(`Troubleshooting base loaded: ${parsed.length} error state(s) from ${jsonPath}`);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      this.logger.error(`Error parsing ${jsonPath}: ${e.message}`);
      return '[]';
    }
  }
}
