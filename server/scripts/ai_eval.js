/*
 * ai_eval.js — standalone faithful reproduction of server/src/AI/ai.service.ts.
 * Builds the same retrieval corpus from ./docs, does the same typo-hinting +
 * retrieval + prompt assembly + response scrubbing, then asks real Gemini.
 * Run from server/:  node scripts/ai_eval.js
 * Output: scripts/ai_eval_results.md
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const PRIMARY_MODEL = 'gemini-2.0-flash';
const MAX_CONTEXT_CHUNKS = 24;
const MAX_TROUBLESHOOTING_CHUNKS = 5;
const MAX_CONCEPT_CHUNKS = 6;

const SALES_SYSTEM_PROMPT = `
You are the FieldForce Pro AI Assistant — a high-performing Technical Sales Representative for FieldForce Pro.
FieldForce Pro is a premier field service management (FSM) platform that helps field service businesses schedule jobs, dispatch technicians, manage assets, invoice customers, and track operations in real time.
YOUR ROLE: Convert visitors into customers/demos, explain FSM features + outcomes, answer pricing/integration questions, handle objections.
TARGET INDUSTRIES: HVAC, Plumbing, Electrical, Cleaning, Security, Landscaping, Pest Control.
KEY VALUE PROPS: Free tier up to 30 appointments/month no credit card; appointment-based pricing; mobile-first offline app; all-in-one; AI-powered.
CONSTRAINTS: Do NOT troubleshoot in-app issues or give step-by-step navigation for logged-in users. Do NOT fabricate specific pricing numbers — say pricing is customized, invite a demo. Do NOT mention competitors by name.
TONE: Consultative, warm, concise. Lead with the business outcome.
CALL TO ACTION: sign up free at fsm.bairuhatech.com, book a demo, or email sales@bairuhatech.com.
`.trim();

const EXPERT_SYSTEM_PROMPT_BASE = `
You are the ultimate In-App Expert AI for our FSM software. Your ONLY source of truth is the context provided below, which has been selected as the most relevant to the user's current question.

<fsm_capabilities>
[INJECT JSON DATA HERE]
</fsm_capabilities>

<fsm_troubleshooting>
[INJECT TROUBLESHOOTING DATA HERE]
</fsm_troubleshooting>

When a user asks a question, FIRST translate their problem into formal FSM terminology — SILENTLY, in your head. Consider what they want to achieve and which capability or error state applies.

CRITICAL: Do NOT write out this reasoning. NEVER output an analysis, a plan, numbered "Analyze / Map / Search" steps, or meta-commentary. Output ONLY the final, helpful response.

TONE AND TROUBLESHOOTING RULES:
1. NEVER say "I do not have specific information but here are the steps." If you don't know, stop and escalate to support.
2. If a user mentions an error or being blocked, search the <fsm_troubleshooting> data.
3. DO NOT give standard workflow steps if the user is blocked by an error. Solve the root cause first.
4. Speak naturally like a helpful human support agent.

CRITICAL OUTPUT RULES:
1. ABSOLUTE RULE — NEVER mention any filename, file path, or document name (".md", ".json", "workflows/", "WF-", "UI-").
2. NEVER output a raw table of contents or index of capabilities.
3. Synthesize exact step-by-step instructions in plain, conversational language.
4. If the context contains multiple related tasks for a broad query, ask which specific task they want rather than dumping a list.
5. CLARIFY BEFORE ANSWERING ambiguous questions. Ask one short clarifying question before answering. Do NOT assume.
6. Web app and mobile app differ. Unless the user mentions mobile/being a field technician, assume WEB app.
7. NAVIGATION REALITY — AUTHORITATIVE. This overrides any "click X in the sidebar" / "go to X → Y" step in the context. The web app's left sidebar currently contains ONLY: Dashboard; Contacts; Companies; Service Locations; Service Requests; Estimates; Work Orders; Scheduling (Dispatch Board, Calendar View, Map View); Job Sheets; Trip History; Invoices; Payments; Catalog (Services Catalog, Parts Catalog); Reviews; Workflow (Workflow Templates, Document Approvals); Users; Reports; API Keys; Settings (General, Roles & Permissions); Security (Security Settings). Technician role sidebar: Dashboard, My Jobs, My Schedule, Timesheets, Notifications. If the feature asked about is NOT in that list — e.g. Blueprints, Pricebook, Service Agreements, SLA Compliance, Vision AI, Voice Notes, Document AI / OCR, Natural-Language Analytics, Equipment Health, Live Tracking, Integration Guide — it has NO sidebar item. For those you MUST NOT tell the user to click them in the sidebar or invent a menu location. Instead explain the feature and how to use its page, then add that it is not currently in the main navigation menu, so they may need a direct link or to ask their administrator to enable it. When a feature IS in the list, give its real sidebar location.

OUTPUT FORMATTING & TONE:
1. Talking to an end user, not a developer. Translate technical steps into simple English.
2. NEVER output raw code, variable names, icon names, HTML attributes, or hook names.
2a. NEVER print a URL or route path. Name the sidebar item or page title to click instead.
3. Strip unnecessary UI details.
4. Don't list every optional field unless asked. Give the quickest path.
5. Use natural bullet points or numbered lists.

STRICT RULES:
1. Search <fsm_capabilities> for the matching capability.
2. Provide steps accurately. DO NOT skip or invent steps.
3. State prerequisites naturally.
4. CRITICAL: ONLY answer using the provided context. If not in the data, do NOT make it up — say you don't have the information.
5. NEVER guess a UI layout. NEVER use outside knowledge of other software.
6. Feature availability: if context says a feature is a placeholder/"Coming Soon"/not wired up, tell the user it is not available yet.

<fsm_concepts>
[INJECT CONCEPTUAL JSON HERE]
</fsm_concepts>

<fsm_general_docs>
[INJECT GENERAL DOCS HERE]
</fsm_general_docs>

CONCEPTUAL QUERIES ("What is X?"):
1. Search <fsm_concepts>. If found, explain the definition then list related actions.
2. TYPO TOLERANCE: interpret intent, match nearest known term before concluding it does not exist.
3. GENERAL KNOWLEDGE FALLBACK: if genuinely not in context, explain generally and begin with: "I don't have the exact app-specific details for that feature right now, but in FSM software generally, [explanation]."
4. GENERAL DOCS & UI MAPS: search <fsm_general_docs> for UI layouts, workflows, roles.
`.trim();

const STOP_WORDS = new Set(['what', 'is', 'are', 'how', 'do', 'does', 'the', 'a', 'an', 'to', 'for', 'in', 'on', 'at', 'of', 'and', 'or', 'can', 'i', 'me', 'my', 'us', 'you', 'we', 'they', 'show', 'tell', 'explain', 'about', 'find', 'get', 'see', 'want', 'need', 'where', 'when', 'use', 'using', 'with', 'this', 'that', 'there', 'here', 'from', 'into', 'it', 'be', 'have', 'add', 'new']);

const corpus = [];
const searchableTerms = [];

function tokenize(s) { return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length >= 3); }
function addChunk(source, title, text) {
  const titleTokens = tokenize(title).filter(t => !STOP_WORDS.has(t));
  const bodyTokens = new Set(tokenize(text));
  corpus.push({ source, title, text: text.trim(), titleTokens, bodyTokens });
}
function readJson(p) { if (!fs.existsSync(p)) return []; try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (e) { console.error('parse', p, e.message); return []; } }
function chunkMarkdownFile(filePath) {
  let content; try { content = fs.readFileSync(filePath, 'utf-8'); } catch (e) { return; }
  const base = path.basename(filePath).toLowerCase();
  const isGeneral = base.includes('glossary') || base.includes('faq') || base.includes('index') || base.includes('overview') || base.startsWith('ui-map');
  const source = isGeneral ? 'general' : 'capability';
  const h1 = content.match(/^#\s+(.+)$/m);
  const rawTitle = h1 ? h1[1].trim() : path.basename(filePath, '.md');
  const docTitle = rawTitle.replace(/^(WF|UI)-[A-Z0-9-]+\s*[—–-]\s*/i, '').trim() || rawTitle;
  const parts = content.split(/^##\s+/m);
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i].trim(); if (!raw) continue;
    const sectionTitle = i === 0 ? docTitle : raw.split('\n')[0].trim();
    const text = i === 0 ? raw.replace(/^#\s+.+$/m, '').trim() : `## ${raw}`;
    if (!text) continue;
    addChunk(source, `${docTitle} ${sectionTitle}`, `[${docTitle}]\n${text}`);
  }
}
function readMarkdownChunks(dir) {
  if (!fs.existsSync(dir)) return;
  const walk = d => { for (const f of fs.readdirSync(d)) { const full = path.join(d, f); const st = fs.statSync(full); if (st.isDirectory()) walk(full); else if (f.toLowerCase().endsWith('.md') && f.toLowerCase() !== 'readme.md') chunkMarkdownFile(full); } };
  walk(dir);
}
function buildCorpus() {
  const docsDir = path.join(process.cwd(), 'docs');
  for (const c of readJson(path.join(docsDir, 'fsm-concepts.json'))) {
    const related = Array.isArray(c.related_workflows) ? c.related_workflows.join(', ') : '';
    const text = `${c.entity_name}: ${c.definition ?? ''} ${c.business_value ?? ''}` + (related ? `\nRelated actions: ${related}` : '');
    addChunk('concept', c.entity_name ?? '', text);
  }
  for (const t of readJson(path.join(docsDir, 'fsm-troubleshooting.json'))) {
    const symptoms = Array.isArray(t.user_symptoms) ? t.user_symptoms.join('; ') : '';
    const text = `Error: ${t.error_state}\nSymptoms: ${symptoms}\nCause: ${t.root_cause ?? ''}\nResolution: ${t.resolution ?? ''}`;
    addChunk('troubleshooting', `${t.error_state} ${symptoms}`, text);
  }
  readMarkdownChunks(path.join(docsDir, 'fsm-knowledge'));
}
function buildSearchIndex() { const seen = new Set(); for (const ch of corpus) { const c = ch.title.trim(); if (!c || seen.has(c)) continue; seen.add(c); searchableTerms.push({ tokens: ch.titleTokens, canonical: c }); } }
function levenshtein(a, b) { const m = a.length, n = b.length; const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)); for (let i = 1; i <= m; i++)for (let j = 1; j <= n; j++)dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]); return dp[m][n]; }
function getQueryHint(msg) {
  if (!searchableTerms.length) return null;
  const q = tokenize(msg).filter(t => !STOP_WORDS.has(t)); if (!q.length) return null;
  let best = '', bestScore = -1;
  for (const { tokens, canonical } of searchableTerms) { if (!tokens.length) continue; let mc = 0; for (const qt of q) { for (const tt of tokens) { const th = qt.length <= 5 ? 1 : 2; if (qt === tt || levenshtein(qt, tt) <= th) { mc++; break; } } } const score = mc / tokens.length; if (score > 0.5 && score > bestScore) { bestScore = score; best = canonical; } }
  return best || null;
}
function scoreChunk(q, ch) { let ts = 0; for (const qt of q) { for (const tt of ch.titleTokens) { const th = qt.length <= 5 ? 1 : 2; if (qt === tt || levenshtein(qt, tt) <= th) { ts++; break; } } } let bs = 0; for (const qt of q) if (ch.bodyTokens.has(qt)) bs++; return ts * 3 + bs; }
function retrieve(query) {
  const q = tokenize(query).filter(t => !STOP_WORDS.has(t)); if (!q.length) return [];
  const scored = corpus.map(ch => ({ chunk: ch, score: scoreChunk(q, ch) })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return [];
  const picked = []; const taken = new Set(); let tc = 0, cc = 0;
  for (const { chunk } of scored) { if (picked.length >= MAX_CONTEXT_CHUNKS) break; if (taken.has(chunk)) continue; if (chunk.source === 'troubleshooting' && tc >= MAX_TROUBLESHOOTING_CHUNKS) continue; if (chunk.source === 'concept' && cc >= MAX_CONCEPT_CHUNKS) continue; picked.push(chunk); taken.add(chunk); if (chunk.source === 'troubleshooting') tc++; if (chunk.source === 'concept') cc++; }
  return picked;
}
function buildExpertInstruction(query) {
  const sel = retrieve(query);
  const join = cs => cs.map(c => c.text).join('\n\n').trim() || '(none relevant to this question)';
  return EXPERT_SYSTEM_PROMPT_BASE
    .replace('[INJECT JSON DATA HERE]', () => join(sel.filter(c => c.source === 'capability')))
    .replace('[INJECT TROUBLESHOOTING DATA HERE]', () => join(sel.filter(c => c.source === 'troubleshooting')))
    .replace('[INJECT CONCEPTUAL JSON HERE]', () => join(sel.filter(c => c.source === 'concept')))
    .replace('[INJECT GENERAL DOCS HERE]', () => join(sel.filter(c => c.source === 'general')));
}
function scrubResponse(rawText) {
  let text = rawText;
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/^[\s\S]*?<\/thought>/i, '');
  text = text.replace(/^[\s\S]*?\bsearch strategy\b[^\n]*\n+/i, '');
  text = text.replace(/^\s*\d+\.\s*Analyze User Input[\s\S]*?(?=\n\s*\n|\n\d+\.\s)/i, '');
  text = text.replace(/<\/?(thought|step_list|steps|answer|response|final)>/gi, '');
  text = text.replace(/```[a-z_]*\n?/gi, '').replace(/```/g, '');
  text = text.replace(/\\"/g, '"');
  text = text.replace(/\b(WF|UI)-[A-Z0-9-]+(\.md)?\b\s*[—–-]?\s*/gi, '');
  text = text.replace(/\b[\w/-]+\.(md|json|txt)\b/gi, '');
  text = text.replace(/workflows\//gi, '');
  text = text.replace(/See\s+\S+\.(md|json|txt)/gi, '');
  text = text.replace(/--- FILE:.*?---/gi, '');
  const apiEndpoints = [];
  text = text.replace(/\b(POST|GET|PUT|PATCH|DELETE)\s+(\/[a-z0-9][a-z0-9/_:{}.-]*)/gi, (m) => { apiEndpoints.push(m); return ` API${apiEndpoints.length - 1} `; });
  text = text.replace(/\b(?:navigate|go|head)\s+to\s+`?\/[a-z0-9][a-z0-9/_:.-]*`?\s*\.?/gi, '');
  text = text.replace(/`\/[a-z0-9][a-z0-9/_:.-]*`/gi, '');
  text = text.replace(/\/[a-z0-9][a-z0-9_.-]*\/[a-z0-9_.:?=&{}-]+/gi, '');
  text = text.replace(/\*\*\s*\*\*/g, '');
  text = text.replace(/`\s*`/g, '');
  text = text.replace(/\bAPI(\d+)\b/g, (_, i) => apiEndpoints[+i] ?? '');
  text = text.replace(/[ \t]{2,}/g, ' ');
  return text.trim();
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function ask(question, isAuthenticated) {
  let systemInstruction, userMessage;
  if (!isAuthenticated) { systemInstruction = SALES_SYSTEM_PROMPT; userMessage = question; }
  else { const hint = getQueryHint(question); const rq = hint ? `${question} ${hint}` : question; systemInstruction = buildExpertInstruction(rq); userMessage = hint ? `[Resolved term: "${hint}"]\n${question}` : question; }
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL, systemInstruction });
      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage(userMessage);
      return scrubResponse((await result.response).text());
    } catch (e) {
      const msg = e.message || '';
      if ((msg.includes('429') || msg.includes('503') || msg.includes('overloaded')) && attempt < 3) { await sleep(8000 * (attempt + 1)); continue; }
      return `__ERROR__ ${msg.slice(0, 300)}`;
    }
  }
}

const QUESTIONS = require('./' + (process.argv[2] || 'ai_eval_questions.json'));
const OUT_FILE = process.argv[3] || 'ai_eval_results.md';

(async () => {
  buildCorpus(); buildSearchIndex();
  console.error(`Corpus: ${corpus.length} chunks, ${searchableTerms.length} terms. Running ${QUESTIONS.length} questions...`);
  const out = [`# AI Chatbot Evaluation Results\n\nCorpus: ${corpus.length} chunks. Model: ${PRIMARY_MODEL}.\n`];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const { c, q, auth } = QUESTIONS[i];
    const mode = auth ? 'EXPERT(logged-in)' : 'SALES(pre-login)';
    process.stderr.write(`[${i + 1}/${QUESTIONS.length}] (${c}) ${q.slice(0, 60)}\n`);
    const ans = await ask(q, !!auth);
    out.push(`\n---\n\n## Q${i + 1} [${c}] (${mode})\n**Q:** ${q}\n\n**A:** ${ans}\n`);
    await sleep(2500);
  }
  fs.writeFileSync(path.join(process.cwd(), 'scripts', OUT_FILE), out.join('\n'), 'utf-8');
  console.error('DONE -> scripts/' + OUT_FILE);
})();
