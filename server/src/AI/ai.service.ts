import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

// How many knowledge chunks to inject per query. The whole knowledge base is
// far too large to fit in every prompt (it caused Gemini rate-limit errors and
// "lost-in-the-middle" wrong answers), so we retrieve only the most relevant
// chunks for each user message. See buildCorpus()/retrieve().
const MAX_CONTEXT_CHUNKS = 24;
const MAX_TROUBLESHOOTING_CHUNKS = 5;
const MAX_CONCEPT_CHUNKS = 6;

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

// ─── Post-Login: FSM Expert Persona ───────────────────────────────────────────
// The four <fsm_*> blocks are filled PER REQUEST with only the chunks retrieved
// for the user's question (see generateChatResponse → retrieve).

const EXPERT_SYSTEM_PROMPT_BASE = `
You are the ultimate In-App Expert AI for our FSM software. Your ONLY source of truth is the context provided below, which has been selected as the most relevant to the user's current question.

<fsm_capabilities>
[INJECT JSON DATA HERE]
</fsm_capabilities>

<fsm_troubleshooting>
[INJECT TROUBLESHOOTING DATA HERE]
</fsm_troubleshooting>

When a user asks a question, FIRST translate their problem into formal FSM terminology — SILENTLY, in your head. Consider: what is the user trying to achieve, does their phrasing match a capability or a known error state (e.g. "don't have parts" maps to the troubleshooting error "no active parts found"), and which exact capability or error state in the context applies.

CRITICAL: Do NOT write out this reasoning. NEVER output an analysis, a plan, numbered "Analyze / Map / Search" steps, or any meta-commentary about what you are doing. Output ONLY the final, helpful response to the user — nothing before it.

TONE AND TROUBLESHOOTING RULES:
1. NEVER say "I do not have specific information but here are the steps." If you don't know, stop and escalate to support.
2. If a user mentions an error message or being blocked (e.g., "no active parts found"), YOU MUST search the <fsm_troubleshooting> data.
3. DO NOT give standard workflow steps if the user is clearly blocked by an error. You must solve the root cause first.
4. Speak naturally like a helpful human support agent. Never use robotic formatting like "Prerequisites: None. Exact Steps:". Instead say: "It looks like you need to set up your inventory first. Here is how to do that..."

CRITICAL OUTPUT RULES:
1. ABSOLUTE RULE — NEVER mention any filename, file path, or document name in your response. This includes anything ending in ".md", ".json", ".txt", or containing "workflows/", "docs/", "WF-", "UI-". Treat these as internal implementation details that must NEVER reach the user. If you catch yourself about to write a filename, stop and rewrite without it.
2. NEVER output a raw table of contents or index of capabilities.
3. You must read the provided context and synthesize the exact step-by-step instructions in plain, conversational language.
4. If the context contains multiple related tasks (e.g., a broad query like "job sheets"), ask the user which specific task they want to perform, rather than dumping a list of internal files. (e.g., "I can help you with Job Sheets! Would you like to know how to create one, approve one, or edit a template?")
5. CLARIFY BEFORE ANSWERING ambiguous questions. If a user's question could mean two different things (e.g. "create estimate in work order" could mean: create a work order from an estimate, OR view the estimate linked to a work order), ask one short clarifying question before answering. Do NOT assume and answer the wrong thing.
6. The features in this WEB app and the MOBILE app are different. Unless the user explicitly mentions the mobile app or being a field technician on the phone, assume they are asking about the WEB app and give web-app navigation steps. Only describe mobile-app steps when the relevant context is clearly about the mobile app.
7. NAVIGATION REALITY — AUTHORITATIVE. This overrides any "click X in the sidebar" / "go to X → Y" step in the context below. The web app's left sidebar currently contains ONLY these items: Dashboard; Contacts; Companies; Service Locations; Service Requests; Estimates; Work Orders; Scheduling (Dispatch Board, Calendar View, Map View); Job Sheets; Trip History; Invoices; Payments; Catalog (Services Catalog, Parts Catalog); Reviews; Workflow (Workflow Templates, Document Approvals); Users; Reports; API Keys; Settings (General, Roles & Permissions); Security (Security Settings). For a technician-role user the sidebar shows only: Dashboard, My Jobs, My Schedule, Timesheets, Notifications. If the feature the user asks about is NOT in that list — for example Blueprints, Pricebook, Service Agreements, SLA Compliance, Vision AI, Voice Notes, Document AI / OCR, Natural-Language Analytics, Equipment Health, Live Tracking, or the Integration Guide — it currently has NO sidebar menu item. For those features you MUST NOT tell the user to click them in the sidebar or invent a menu location. Instead: explain what the feature does and how to use it once its page is open, then clearly add that this feature is not currently shown in the main navigation menu, so they may need to open it via a direct link or ask their administrator to enable it. When a feature IS in the sidebar list above, give its real sidebar location normally.

OUTPUT FORMATTING & TONE:
1. You are talking to an end user, not a developer. You MUST translate all technical steps into simple, natural English.
2. NEVER output raw code, variable names (e.g., \`isPending\`), icon names (e.g., \`PlusOutlined\`), HTML attributes, or hook names (e.g., \`useMyJobs\`).
2a. NEVER print a URL or route path (anything starting with "/", e.g. "/work-orders/new", or a full http link). If a step in the context says to "navigate to" a route, translate it into real navigation for the user: tell them which item to click in the left sidebar and/or name the page by its on-screen title (e.g. instead of "Navigate to /analytics/ai" say "Open the AI-Powered Analytics page from the sidebar"). Every navigation instruction must name a clickable menu item or page title — never a path.
3. Strip out unnecessary UI details. Instead of "In the Category dropdown (label: 'Category'), select...", just say: "Select a Category from the dropdown."
4. Do not list every single optional field unless the user asks for comprehensive details. Give them the quickest path to success.
5. Use natural bullet points or numbered lists. Do not write dense paragraphs.

STRICT RULES:
1. When a user asks how to do something, search the <fsm_capabilities> for the matching capability. Look closely at the questions and symptoms.
2. Read the steps and provide them to the user accurately. DO NOT skip steps. DO NOT invent steps.
3. If a prerequisite exists, tell the user the prerequisite naturally.
4. CRITICAL RULE: You must ONLY answer using the provided <fsm_capabilities> or <fsm_troubleshooting> data. If the answer is not in the data, you MUST NOT make it up. Reply that you do not have the information.
5. NEVER guess a UI layout. NEVER use your outside knowledge of other software.
6. IMPORTANT — feature availability: If the provided context says a feature is a placeholder, "Coming Soon", not yet wired up, or otherwise unavailable, you MUST tell the user it is not available yet. NEVER invent steps for a feature the context describes as incomplete.

<fsm_concepts>
[INJECT CONCEPTUAL JSON HERE]
</fsm_concepts>

<fsm_general_docs>
[INJECT GENERAL DOCS HERE]
</fsm_general_docs>

CONCEPTUAL QUERIES ("What is X?"):
1. First, search the <fsm_concepts> data for the term. If you find it, explain the definition and then list the actions the user can take based on the "related_workflows" array.
2. TYPO TOLERANCE: The user's query may contain typos or paraphrased terms (e.g., "mmobile" instead of "mobile", "dispatch bord" instead of "Dispatch Board"). Always interpret the user's intent and match to the nearest known term before concluding a term does not exist in the data.
3. GENERAL KNOWLEDGE FALLBACK: If the user asks about a term and it is genuinely NOT in the provided context even after interpreting intent, DO NOT output a generic error message. Instead, use your general knowledge of Field Service Management (FSM) software to explain what the term generally means in this industry, and begin your answer with: "I don't have the exact app-specific details for that feature right now, but in FSM software generally, [your explanation]."
4. GENERAL DOCS & UI MAPS: You have access to additional docs in <fsm_general_docs>. If the user asks about UI layouts, workflows, or roles, search this section to provide accurate, in-app context.
`.trim();

// ─── Stop words excluded from token matching ──────────────────────────────────

const STOP_WORDS = new Set([
  'what',
  'is',
  'are',
  'how',
  'do',
  'does',
  'the',
  'a',
  'an',
  'to',
  'for',
  'in',
  'on',
  'at',
  'of',
  'and',
  'or',
  'can',
  'i',
  'me',
  'my',
  'us',
  'you',
  'we',
  'they',
  'show',
  'tell',
  'explain',
  'about',
  'find',
  'get',
  'see',
  'want',
  'need',
  'where',
  'when',
  'use',
  'using',
  'with',
  'this',
  'that',
  'there',
  'here',
  'from',
  'into',
  'it',
  'be',
  'have',
  'add',
  'new',
]);

type ChunkSource = 'capability' | 'troubleshooting' | 'concept' | 'general';

interface Chunk {
  source: ChunkSource;
  title: string;
  text: string;
  titleTokens: string[];
  bodyTokens: Set<string>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private genAI: GoogleGenerativeAI | null = null;
  private salesModel: any = null;

  // ─── Retrieval corpus + fuzzy search index ─────────────────────────────────
  private corpus: Chunk[] = [];
  private searchableTerms: Array<{ tokens: string[]; canonical: string }> = [];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set — chatbot will not function.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    // Build the retrieval corpus from concepts, troubleshooting, and the
    // markdown knowledge base. We do NOT inject the whole thing per request.
    this.buildCorpus();
    this.buildSearchIndex();

    // The sales persona has no knowledge base, so its model is static.
    this.salesModel = this.createModel(PRIMARY_MODEL, SALES_SYSTEM_PROMPT);

    this.logger.log(
      `AiService initialised — Sales AI + FSM Expert ready. ` +
        `Retrieval corpus: ${this.corpus.length} chunks, ${this.searchableTerms.length} searchable terms.`,
    );
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async generateChatResponse(
    history: { role: string; content: string }[],
    userMessage: string,
    isAuthenticated: boolean,
  ): Promise<string> {
    // Pre-login visitors get the static Sales persona.
    if (!isAuthenticated) {
      if (!this.salesModel) {
        return "I'm sorry, my AI backend is currently unconfigured. Please try again later.";
      }
      return this.runChat(
        this.salesModel,
        SALES_SYSTEM_PROMPT,
        history,
        userMessage,
        PRIMARY_MODEL,
      );
    }

    if (!this.genAI) {
      return "I'm sorry, my AI backend is currently unconfigured. Please try again later.";
    }

    // FSM Expert: retrieve only the relevant context, then build a compact,
    // query-scoped system instruction.
    const hint = this.getQueryHint(userMessage);
    const retrievalQuery = hint ? `${userMessage} ${hint}` : userMessage;
    const systemInstruction = this.buildExpertInstruction(retrievalQuery);

    const resolvedMessage = hint ? `[Resolved term: "${hint}"]\n${userMessage}` : userMessage;

    const expertModel = this.createModel(PRIMARY_MODEL, systemInstruction);
    if (!expertModel) {
      return "I'm sorry, my AI backend is currently unconfigured. Please try again later.";
    }
    return this.runChat(expertModel, systemInstruction, history, resolvedMessage, PRIMARY_MODEL);
  }

  // ─── Chat execution ──────────────────────────────────────────────────────────

  private async runChat(
    model: any,
    systemInstruction: string,
    history: { role: string; content: string }[],
    userMessage: string,
    modelName: string,
  ): Promise<string> {
    try {
      return await this.sendMessage(model, history, userMessage);
    } catch (error: any) {
      this.logger.error(`Gemini API error: ${error?.message}`);

      // Fallback to the secondary model on 404 (primary model not found).
      if (error?.message?.includes('404')) {
        this.logger.warn(`Primary model not found, retrying with ${FALLBACK_MODEL}…`);
        try {
          const fallback = this.createModel(FALLBACK_MODEL, systemInstruction);
          return await this.sendMessage(fallback, history, userMessage);
        } catch (fallbackError: any) {
          this.logger.error(`Fallback model also failed: ${fallbackError?.message}`);
        }
      }

      return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
    }
  }

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
    const rawText = (await result.response).text();

    return this.scrubResponse(rawText);
  }

  /**
   * Cleans the raw model output before it reaches the user. Robust against
   * unpaired / malformed internal tags that previously leaked through.
   */
  private scrubResponse(rawText: string): string {
    let text = rawText;

    // 1. Strip well-formed <thought>...</thought> blocks.
    text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
    // 2. Strip an UNPAIRED leading thought block: everything up to a lone
    //    </thought> (the model sometimes omits the opening tag).
    text = text.replace(/^[\s\S]*?<\/thought>/i, '');
    // 3. Strip a plain-text reasoning preamble (no tags at all) — the model
    //    sometimes emits "1. Analyze User Input... 3. Search Strategy: ..."
    //    before the real answer. Cut everything up to and including the
    //    Search Strategy line.
    text = text.replace(/^[\s\S]*?\bsearch strategy\b[^\n]*\n+/i, '');
    text = text.replace(/^\s*\d+\.\s*Analyze User Input[\s\S]*?(?=\n\s*\n|\n\d+\.\s)/i, '');
    // 4. Remove any other stray angle-bracket pseudo-tags the model emits
    //    (e.g. <step_list>, </step_list>, <thought>).
    text = text.replace(/<\/?(thought|step_list|steps|answer|response|final)>/gi, '');
    // 5. Remove markdown code-block fences.
    text = text.replace(/```[a-z_]*\n?/gi, '').replace(/```/g, '');
    // 6. Clean up escaped quotes.
    text = text.replace(/\\"/g, '"');
    // 7. Safety net — scrub internal doc codes and filenames that leaked through.
    text = text.replace(/\b(WF|UI)-[A-Z0-9-]+(\.md)?\b\s*[—–-]?\s*/gi, '');
    text = text.replace(/\b[\w/-]+\.(md|json|txt)\b/gi, '');
    text = text.replace(/workflows\//gi, '');
    text = text.replace(/See\s+\S+\.(md|json|txt)/gi, '');
    text = text.replace(/--- FILE:.*?---/gi, '');
    // 7b. Protect EXTERNAL API endpoints (e.g. "POST /service-requests/inbound")
    //     from the in-app route scrubbing below — those ARE meant to reach the
    //     user (Integration Guide). Mask them, scrub routes, then restore.
    const apiEndpoints: string[] = [];
    text = text.replace(/\b(POST|GET|PUT|PATCH|DELETE)\s+(\/[a-z0-9][a-z0-9/_:{}.-]*)/gi, (m) => {
      apiEndpoints.push(m);
      return ` API${apiEndpoints.length - 1} `;
    });
    // 8. Backstop for route paths the prompt should already have converted to
    //    menu navigation. First remove a whole "navigate/go to <route>." lead-in
    //    so we never leave a dangling "Go to ." stub, then strip any remaining
    //    backtick-wrapped route elsewhere in the text.
    text = text.replace(/\b(?:navigate|go|head)\s+to\s+`?\/[a-z0-9][a-z0-9/_:.-]*`?\s*\.?/gi, '');
    text = text.replace(/`\/[a-z0-9][a-z0-9/_:.-]*`/gi, '');
    // Strip any remaining bare multi-segment route path (incl. query strings),
    // e.g. /scheduling/new?work_order_id={id}. Requires two segments so it
    // can't match ordinary prose like "and/or".
    text = text.replace(/\/[a-z0-9][a-z0-9_.-]*\/[a-z0-9_.:?=&{}-]+/gi, '');
    // 9. Clean up wrappers/whitespace left behind by scrubbing.
    text = text.replace(/\*\*\s*\*\*/g, ''); // empty bold
    text = text.replace(/`\s*`/g, ''); // empty inline code
    // Restore the protected external API endpoints masked in step 7b.
    text = text.replace(/\bAPI(\d+)\b/g, (_, i) => apiEndpoints[+i] ?? '');
    text = text.replace(/[ \t]{2,}/g, ' ');

    return text.trim();
  }

  // ─── Retrieval ────────────────────────────────────────────────────────────

  /** Builds the compact, query-scoped expert system instruction. */
  private buildExpertInstruction(query: string): string {
    const selected = this.retrieve(query);

    const join = (chunks: Chunk[]) =>
      chunks
        .map((c) => c.text)
        .join('\n\n')
        .trim() || '(none relevant to this question)';

    const capabilities = join(selected.filter((c) => c.source === 'capability'));
    const general = join(selected.filter((c) => c.source === 'general'));
    const troubleshooting = join(selected.filter((c) => c.source === 'troubleshooting'));
    const concepts = join(selected.filter((c) => c.source === 'concept'));

    return EXPERT_SYSTEM_PROMPT_BASE.replace('[INJECT JSON DATA HERE]', () => capabilities)
      .replace('[INJECT TROUBLESHOOTING DATA HERE]', () => troubleshooting)
      .replace('[INJECT CONCEPTUAL JSON HERE]', () => concepts)
      .replace('[INJECT GENERAL DOCS HERE]', () => general);
  }

  /**
   * Scores every corpus chunk against the query and returns the most relevant,
   * with category quotas so troubleshooting and concept chunks are not crowded
   * out by how-to chunks.
   */
  private retrieve(query: string): Chunk[] {
    const qTokens = this.tokenize(query).filter((t) => !STOP_WORDS.has(t));
    if (qTokens.length === 0) return [];

    const scored = this.corpus
      .map((chunk) => ({ chunk, score: this.scoreChunk(qTokens, chunk) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return [];

    const picked: Chunk[] = [];
    const taken = new Set<Chunk>();
    let troubleCount = 0;
    let conceptCount = 0;

    for (const { chunk } of scored) {
      if (picked.length >= MAX_CONTEXT_CHUNKS) break;
      if (taken.has(chunk)) continue;
      if (chunk.source === 'troubleshooting' && troubleCount >= MAX_TROUBLESHOOTING_CHUNKS)
        continue;
      if (chunk.source === 'concept' && conceptCount >= MAX_CONCEPT_CHUNKS) continue;

      picked.push(chunk);
      taken.add(chunk);
      if (chunk.source === 'troubleshooting') troubleCount++;
      if (chunk.source === 'concept') conceptCount++;
    }

    return picked;
  }

  /** Title matches (fuzzy, typo-tolerant) weighted 3×; body matches exact 1×. */
  private scoreChunk(qTokens: string[], chunk: Chunk): number {
    let titleScore = 0;
    for (const qt of qTokens) {
      for (const tt of chunk.titleTokens) {
        const threshold = qt.length <= 5 ? 1 : 2;
        if (qt === tt || this.levenshtein(qt, tt) <= threshold) {
          titleScore++;
          break;
        }
      }
    }

    let bodyScore = 0;
    for (const qt of qTokens) {
      if (chunk.bodyTokens.has(qt)) bodyScore++;
    }

    return titleScore * 3 + bodyScore;
  }

  // ─── Corpus construction ────────────────────────────────────────────────────

  private tokenize(s: string): string[] {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3);
  }

  private addChunk(source: ChunkSource, title: string, text: string): void {
    const titleTokens = this.tokenize(title).filter((t) => !STOP_WORDS.has(t));
    const bodyTokens = new Set(this.tokenize(text));
    this.corpus.push({ source, title, text: text.trim(), titleTokens, bodyTokens });
  }

  private buildCorpus(): void {
    const docsDir = path.join(process.cwd(), 'docs');

    // 1. Concepts → one chunk each.
    for (const c of this.readJson(path.join(docsDir, 'fsm-concepts.json'))) {
      const related = Array.isArray(c.related_workflows) ? c.related_workflows.join(', ') : '';
      const text =
        `${c.entity_name}: ${c.definition ?? ''} ${c.business_value ?? ''}` +
        (related ? `\nRelated actions: ${related}` : '');
      this.addChunk('concept', c.entity_name ?? '', text);
    }

    // 2. Troubleshooting → one chunk each.
    for (const t of this.readJson(path.join(docsDir, 'fsm-troubleshooting.json'))) {
      const symptoms = Array.isArray(t.user_symptoms) ? t.user_symptoms.join('; ') : '';
      const text =
        `Error: ${t.error_state}\nSymptoms: ${symptoms}\n` +
        `Cause: ${t.root_cause ?? ''}\nResolution: ${t.resolution ?? ''}`;
      this.addChunk('troubleshooting', `${t.error_state} ${symptoms}`, text);
    }

    // 3. Markdown knowledge base → one chunk per "## " section.
    this.readMarkdownChunks(path.join(docsDir, 'fsm-knowledge'));

    this.logger.log(`Corpus built: ${this.corpus.length} chunks.`);
  }

  private readJson(jsonPath: string): any[] {
    if (!fs.existsSync(jsonPath)) {
      this.logger.warn(`Registry not found at "${jsonPath}".`);
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch (e) {
      this.logger.error(`Error parsing ${jsonPath}: ${e.message}`);
      return [];
    }
  }

  /**
   * Recursively reads .md files and splits each into chunks by "## " heading.
   * Each chunk is prefixed with the file's H1 title for context. "How-to"
   * docs (numbered knowledge articles + workflows) are tagged 'capability';
   * glossary/FAQ/index/UI-map docs are tagged 'general'.
   */
  private readMarkdownChunks(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const walk = (d: string) => {
      for (const file of fs.readdirSync(d)) {
        const full = path.join(d, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (file.toLowerCase().endsWith('.md') && file.toLowerCase() !== 'readme.md') {
          this.chunkMarkdownFile(full);
        }
      }
    };
    walk(dir);
  }

  private chunkMarkdownFile(filePath: string): void {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      this.logger.error(`Error reading ${filePath}: ${e.message}`);
      return;
    }

    const base = path.basename(filePath).toLowerCase();
    const isGeneral =
      base.includes('glossary') ||
      base.includes('faq') ||
      base.includes('index') ||
      base.includes('overview') ||
      base.startsWith('ui-map');
    const source: ChunkSource = isGeneral ? 'general' : 'capability';

    // H1 title (first "# " line) used as context prefix on every section.
    // Strip the internal "WF-XXX —" / "UI-XXX —" code prefix so it can never
    // leak into a user-facing answer.
    const h1Match = content.match(/^#\s+(.+)$/m);
    const rawTitle = h1Match ? h1Match[1].trim() : path.basename(filePath, '.md');
    const docTitle = rawTitle.replace(/^(WF|UI)-[A-Z0-9-]+\s*[—–-]\s*/i, '').trim() || rawTitle;

    // Split on "## " headings.
    const parts = content.split(/^##\s+/m);
    for (let i = 0; i < parts.length; i++) {
      const raw = parts[i].trim();
      if (!raw) continue;

      // For i === 0 this is the pre-first-heading intro; skip if it's just the H1.
      const sectionTitle = i === 0 ? docTitle : raw.split('\n')[0].trim();
      const text = i === 0 ? raw.replace(/^#\s+.+$/m, '').trim() : `## ${raw}`;
      if (!text) continue;

      // Title tokens come from both the doc title and the section heading so a
      // query like "dashboard builder" matches the right file's sections.
      this.addChunk(source, `${docTitle} ${sectionTitle}`, `[${docTitle}]\n${text}`);
    }
  }

  // ─── Fuzzy term resolution (typo correction) ────────────────────────────────

  /** Build the searchable-term index from chunk titles for typo correction. */
  private buildSearchIndex(): void {
    const seen = new Set<string>();
    for (const chunk of this.corpus) {
      const canonical = chunk.title.trim();
      if (!canonical || seen.has(canonical)) continue;
      seen.add(canonical);
      this.searchableTerms.push({ tokens: chunk.titleTokens, canonical });
    }
  }

  /** Levenshtein edit distance between two strings. */
  private levenshtein(a: string, b: string): number {
    const m = a.length,
      n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  /**
   * Fuzzy-matches the user's tokens against indexed term titles and returns the
   * best canonical term, or null. Used to correct typos before retrieval.
   */
  private getQueryHint(userMessage: string): string | null {
    if (this.searchableTerms.length === 0) return null;

    const queryTokens = this.tokenize(userMessage).filter((t) => !STOP_WORDS.has(t));
    if (queryTokens.length === 0) return null;

    let bestCanonical = '';
    let bestScore = -1;

    for (const { tokens: termTokens, canonical } of this.searchableTerms) {
      if (termTokens.length === 0) continue;
      let matchCount = 0;
      for (const qt of queryTokens) {
        for (const tt of termTokens) {
          const threshold = qt.length <= 5 ? 1 : 2;
          if (qt === tt || this.levenshtein(qt, tt) <= threshold) {
            matchCount++;
            break;
          }
        }
      }
      const score = matchCount / termTokens.length;
      if (score > 0.5 && score > bestScore) {
        bestScore = score;
        bestCanonical = canonical;
      }
    }

    return bestCanonical || null;
  }
}
