import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Renders text content with search match highlights for the overlay div */
function renderHighlightedContent(
  content: string,
  query: string,
  matches: number[],
  currentIdx: number
): React.ReactNode {
  if (!query || matches.length === 0) {
    return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</span>;
  }
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  matches.forEach((pos, i) => {
    if (pos > lastIdx) {
      parts.push(<span key={`t${i}`}>{content.slice(lastIdx, pos)}</span>);
    }
    parts.push(
      <mark
        key={`m${i}`}
        style={{
          backgroundColor: i === currentIdx ? '#f97316' : '#fde047',
          color: 'transparent',
          borderRadius: '2px',
        }}
      >
        {content.slice(pos, pos + query.length)}
      </mark>
    );
    lastIdx = pos + query.length;
  });
  if (lastIdx < content.length) {
    parts.push(<span key="last">{content.slice(lastIdx)}</span>);
  }
  return <>{parts}</>;
}

/**
 * Cleans document text for markdown preview.
 *
 * Handles three distinct content sources:
 *   1. Already-valid GFM markdown  → passed through untouched
 *   2. Raw PDF-extracted tables     → reconstructed as proper GFM tables
 *   3. Pipe-noise lines             → silently dropped
 */
function processKbContent(raw: string): string {
  if (!raw) return '';

  // ── Step 0: Detect KB JSON format ─────────────────────────────────────────
  // The backend stores KB files as JSON:
  // { "doc_name": "...", "structure": [{ "title": "...", "text": "..." }, ...] }
  // Parse it and reconstruct as readable plain text before any other processing.
  try {
    const parsed = JSON.parse(raw.trim());
    if (parsed && Array.isArray(parsed.structure)) {
      const sections: string[] = [];

      // Optional: emit doc description as a preamble
      if (parsed.doc_description) {
        sections.push(`> ${parsed.doc_description}`);
        sections.push('');
      }

      for (const node of parsed.structure) {
        const nodeText: string = (node.text ?? '').trim();
        if (!nodeText) continue;
        if (node.title && node.title !== 'Prefaces') {
          sections.push(`## ${String(node.title).trim()}`);
          sections.push('');
        }
        sections.push(nodeText);
        sections.push('');
      }

      raw = sections.join('\n');
    }
  } catch {
    // Not JSON — continue with raw text as-is
  }

  // ── Step 1: Detect & repair "word-per-line" PDF extraction artifact ────────
  // Symptom: many lines that are purely whitespace (` `, `  `) acting as
  // word separators, with content words on individual lines.
  // e.g. "Trade\n \nFX\n \nServices\n \n–\n \nOfficial..."
  {
    const rawLines = raw.split('\n');
    const wsOnlyCount = rawLines.filter(l => l.length > 0 && l.trim() === '').length;
    if (wsOnlyCount > rawLines.length * 0.15) {
      const joined: string[] = [];
      let wordBuf: string[] = [];
      const flushBuf = () => {
        if (wordBuf.length > 0) {
          joined.push(wordBuf.join(' ').trim());
          wordBuf = [];
        }
      };
      for (const line of rawLines) {
        if (line.length === 0) {
          // True empty line → paragraph break
          flushBuf();
          joined.push('');
        } else if (line.trim() === '') {
          // Whitespace-only → invisible word separator, skip
        } else if (/^#{1,6}\s/.test(line.trim())) {
          // Heading line → flush current paragraph, emit heading as-is
          flushBuf();
          joined.push(line.trim());
          joined.push('');
        } else {
          wordBuf.push(line.trim());
        }
      }
      flushBuf();
      raw = joined.join('\n');
    }
  }

  const lines = raw.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let i = 0;

  while (i < lines.length) {
    const originalLine = lines[i];
    const trimmed = originalLine.trim();

    // ── Code fence tracking: never touch content inside ``` / ~~~ blocks ──────
    if (/^(```|~~~)/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      result.push(originalLine);
      i++;
      continue;
    }
    if (inCodeBlock) {
      result.push(originalLine);
      i++;
      continue;
    }

    // ── Blank line ────────────────────────────────────────────────────────────
    if (trimmed === '') {
      // Deduplicate: don't push two blank lines in a row
      if (result.length > 0 && result[result.length - 1] !== '') result.push('');
      i++;
      continue;
    }

    // ── Pure pipe-noise (3+ consecutive pipes or line is only pipes/spaces) ──
    // These are garbled PDF artifacts — drop them completely.
    if (/(\|\s*){3,}/.test(trimmed) || /^[\|\s]+$/.test(trimmed)) {
      i++;
      continue;
    }

    // ── Already-valid GFM table ───────────────────────────────────────────────
    // Identified by: current line has pipes AND the next non-blank line is a
    // GFM separator (only -, |, :, space).  Copy the whole block as-is.
    if (trimmed.startsWith('|')) {
      let nextNonBlank = '';
      for (let k = i + 1; k < lines.length; k++) {
        const t = lines[k].trim();
        if (t) { nextNonBlank = t; break; }
      }
      if (/^\|[\s\-:|]+\|$/.test(nextNonBlank)) {
        // Valid GFM table — copy every row until a blank line or non-pipe line
        while (i < lines.length && lines[i].trim() !== '') {
          result.push(lines[i]);
          i++;
        }
        result.push('');
        continue;
      }
    }

    // ── Raw/broken PDF table (2+ pipes, no GFM separator below) ─────────────
    // Collect consecutive pipe-heavy lines, skip separator-pattern lines,
    // then rebuild as a proper GFM table.
    const pipeCount = (trimmed.match(/\|/g) || []).length;
    if (pipeCount >= 2) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length) {
        const tl = lines[j].trim();
        if (!tl) break;
        // Skip rows that are purely separators (--- | --- style)
        if (/^[\|\s\-:]+$/.test(tl)) { j++; continue; }
        const tc = (tl.match(/\|/g) || []).length;
        if (tc >= 2) { tableLines.push(tl); j++; }
        else break;
      }

      const rows = tableLines
        .map(tl => tl.split('|').map(c => c.trim()).filter(c => c.length > 0))
        .filter(r => r.length > 0);

      if (rows.length > 0) {
        const maxCols = Math.max(...rows.map(r => r.length));
        if (maxCols >= 2) {
          const header = [...rows[0]];
          while (header.length < maxCols) header.push('');
          result.push('| ' + header.join(' | ') + ' |');
          result.push('| ' + Array(maxCols).fill('---').join(' | ') + ' |');
          for (let r = 1; r < rows.length; r++) {
            const row = [...rows[r]];
            while (row.length < maxCols) row.push('');
            result.push('| ' + row.join(' | ') + ' |');
          }
          result.push('');
          i = j;
          continue;
        }
      }
    }

    // ── Regular / markdown-syntax line ───────────────────────────────────────
    // Preserve the original line for all markdown markers (headings, lists,
    // blockquotes, ordered lists, thematic breaks, bold/italic, etc.).
    // Only strip stray lone-pipe artifacts from plain prose lines.
    const isMarkdownSyntax = /^(#{1,6}\s|[-*+]\s|>\s?|\d+\.\s|---$|\*\*\*$|___$)/.test(trimmed);
    if (isMarkdownSyntax) {
      result.push(originalLine); // keep original indentation & syntax intact
    } else {
      // Strip lone single-pipe artifacts (PDF extraction noise) from prose,
      // but do NOT trim leading spaces (preserves nested list indentation).
      result.push(originalLine.replace(/\s*\|\s*/g, ' ').trimEnd());
    }
    i++;
  }

  // Collapse runs of 3+ blank lines down to 2 (single paragraph boundary)
  return result.join('\n').replace(/\n{3,}/g, '\n\n');
}


/**
 * Returns a friendly display label for an existing KB file URL.
 * All existing KB URLs represent the single merged main knowledge base on the backend.
 * Display a clean, user-friendly label instead of the raw S3 filename.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDisplayFilename(_fileUrl: string, index: number): string {
  return index === 0 ? 'Main Knowledge Base' : `Main Knowledge Base ${index + 1}`;
}

/**
 * Detects the AI-generated agent name baked into a template's firstMessage.
 * Looks for common patterns like "I'm Cler", "This is Linda", etc.
 * Returns the detected name, or null if not found.
 */
function detectNameInTemplate(firstMessage?: string): string | null {
  if (!firstMessage) return null;
  // Match one or more capitalized words (handles multi-word names like "Gyan Setu")
  // Stops at lowercase words (e.g. "from", "at", "with") so we don't over-capture
  const nameGroup = '([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*)';
  const patterns = [
    new RegExp(`\\bI'(?:m|ve) ${nameGroup}\\b`),
    new RegExp(`\\bI am ${nameGroup}\\b`),
    new RegExp(`\\bThis is ${nameGroup}\\b`),
    new RegExp(`\\bMy name is ${nameGroup}\\b`, 'i'),
    new RegExp(`\\bYou(?:'re| are) speaking (?:with|to) ${nameGroup}\\b`, 'i'),
  ];
  for (const p of patterns) {
    const m = firstMessage.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * Converts user-edited markdown text back into the KB JSON node-tree format
 * that the AI backend expects.  Preserves doc_name and doc_description from
 * the original JSON; splits the body by ## headings to rebuild structure[].
 */
function reconstructKbJson(originalJson: any, editedText: string): string {
  const doc_name = originalJson.doc_name || '';
  const doc_description = originalJson.doc_description || '';

  // Strip the leading blockquote line ("> doc_description") if present
  const lines = editedText.split('\n');
  let startIdx = 0;
  if (lines[0]?.startsWith('> ')) {
    startIdx = 1;
    while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;
  }
  const body = lines.slice(startIdx).join('\n');

  // Split at every "## Heading" line
  // parts = [preface_text, heading1, text1, heading2, text2, ...]
  const parts = body.split(/^## (.+)$/m);
  const structure: any[] = [];
  let nodeCounter = 0;
  const makeId = () => String(nodeCounter++).padStart(4, '0');

  // Text before the first ## heading → Prefaces node
  if (parts[0].trim()) {
    structure.push({ title: 'Prefaces', node_id: makeId(), text: parts[0].trim() });
  }

  // Remaining pairs: [heading, text]
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim() || '';
    const text = parts[i + 1]?.trim() || '';
    if (title) structure.push({ title, node_id: makeId(), text });
  }

  return JSON.stringify({ doc_name, doc_description, structure }, null, 2);
}

import { useParams, useNavigate } from 'react-router-dom';
import appToast from '../../components/AppToast';
import { ArrowLeft, Save, X, Bot, Globe, Settings, Sparkles, Info, Upload, Link, Share2, FileText, File, Image, Plus, BookOpen, Volume2, Play, Square, Pencil, Check, Loader2, Eye, Code2, Search, ChevronUp, ChevronDown, Trash2, RefreshCw } from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { useAuth } from '../../contexts/AuthContext';
import { agentAPI } from '../../services/agentAPI';
import { aiTemplateService } from '../../services/aiTemplateService';
import GlassCard from '../../components/GlassCard';
import { formatAgentLanguages } from '../../lib/utils';
import SearchableSelect from '../../components/SearchableSelect';

// Voice style → short instruction for voice_config.voice_instruction
const VOICE_STYLE_SHORT_MAP: Record<string, string> = {
  friendly:      'Speak clearly and warmly with a friendly, approachable tone',
  professional:  'Speak clearly and professionally with a business-like, formal tone',
  casual:        'Speak casually and conversationally with a relaxed, natural tone',
  authoritative: 'Speak with confidence and authority in a commanding, decisive tone',
  empathetic:    'Speak with empathy and understanding in a supportive, compassionate tone',
  enthusiastic:  'Speak energetically and enthusiastically with an upbeat, positive tone',
};

// Voice style → detailed text used inside the ## Voice Instructions section of the system prompt
const VOICE_STYLE_SP_MAP: Record<string, string> = {
  friendly:      'Speak in a warm, welcoming tone that makes callers feel comfortable and valued. Use conversational language, positive affirmations, and show genuine interest in helping. Maintain an upbeat but not overwhelming energy level.',
  professional:  'Maintain a formal, business-like tone throughout all interactions. Speak clearly and confidently with proper grammar. Avoid slang or overly casual expressions. Project expertise and reliability while remaining approachable.',
  casual:        'Speak in a relaxed, laid-back manner as if talking to a friend. Use everyday language and contractions freely. Keep the conversation light and natural while still being helpful and informative.',
  authoritative: 'Speak with confidence and clarity. Project expertise with direct, clear statements. Use a measured, deliberate pace and avoid filler words. Lead conversations decisively while remaining respectful and solution-focused.',
  empathetic:    'Lead with empathy and emotional awareness. Acknowledge feelings and concerns before offering solutions. Use active listening phrases and validate the caller\'s experience. Speak in a calm, reassuring tone.',
  enthusiastic:  'Bring high energy and genuine excitement to every interaction. Use expressive, positive language and let your enthusiasm be contagious. Celebrate wins with the caller and maintain an optimistic, can-do attitude throughout.',
};

/**
 * Removes duplicate "Voice Instructions" sections from a system prompt,
 * keeping only the first occurrence (header + body).
 */
function deduplicateVoiceInstructionSections(prompt: string): string {
  if (!prompt) return prompt;
  const headerRe = /^#{0,3}\s*voice instructions\s*:?\s*$/i;
  const lines = prompt.split('\n');
  const headerPositions = lines
    .map((l, i) => (headerRe.test(l.trim()) ? i : -1))
    .filter(i => i !== -1);
  if (headerPositions.length <= 1) return prompt;

  // Remove all but the first header+body in reverse order to keep indices stable
  const result = [...lines];
  for (let h = headerPositions.length - 1; h >= 1; h--) {
    const start = headerPositions[h];
    let end = start + 1;
    while (end < result.length) {
      if (
        result[end].trim() === '' &&
        end + 1 < result.length &&
        result[end + 1].trim() !== '' &&
        /^[A-Z#]/.test(result[end + 1].trim())
      ) { end++; break; }
      end++;
    }
    result.splice(start, end - start);
  }
  return result.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Replaces the Voice Instructions section in a system prompt with newContent.
 *  Uses content-match first (fast, duplicate-free for all subsequent calls),
 *  then falls back to line-by-line header detection for the very first call.
 */
function updateVoiceInstructionsSection(prompt: string, newContent: string): string {
  if (!prompt) return prompt;

  // ── Strategy 1: content-match replacement ──────────────────────────────────
  // Replace ALL occurrences of any known voice content, then deduplicate headers.
  for (const known of Object.values(VOICE_STYLE_SP_MAP)) {
    if (prompt.includes(known)) {
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const replaced = prompt.replace(new RegExp(escape(known), 'g'), newContent);
      return deduplicateVoiceInstructionSections(replaced);
    }
  }

  // ── Strategy 2: header-based line replacement (first call / AI-generated) ──
  // Find the Voice Instructions header line, then replace until the next section.
  // #{0,3} matches headers with 0-3 leading # chars (plain text or markdown ##/###).
  const lines = prompt.split('\n');
  const hIdx = lines.findIndex(l => /^#{0,3}\s*voice instructions\s*$/i.test(l.trim()));
  if (hIdx !== -1) {
    // Walk forward: section ends when we hit a blank line followed immediately
    // by a non-blank line starting with an uppercase letter or '#'.
    let eIdx = hIdx + 1;
    while (eIdx < lines.length - 1) {
      if (
        lines[eIdx].trim() === '' &&
        lines[eIdx + 1].trim() !== '' &&
        /^[A-Z#]/.test(lines[eIdx + 1].trim())
      ) break;
      eIdx++;
    }
    return [
      ...lines.slice(0, hIdx + 1),
      '',
      newContent,
      '',
      ...lines.slice(eIdx + 1),
    ].join('\n');
  }

  // ── Strategy 3: inject after Identity section ───────────────────────────────
  const iIdx = lines.findIndex(l => /^#{0,3}\s*identity\s*$/i.test(l.trim()));
  if (iIdx !== -1) {
    let eIdx = iIdx + 1;
    while (eIdx < lines.length - 1) {
      if (
        lines[eIdx].trim() === '' &&
        lines[eIdx + 1].trim() !== '' &&
        /^[A-Z#]/.test(lines[eIdx + 1].trim())
      ) break;
      eIdx++;
    }
    return [
      ...lines.slice(0, eIdx),
      '',
      'Voice Instructions',
      newContent,
      '',
      ...lines.slice(eIdx),
    ].join('\n');
  }

  // ── Fallback: prepend ───────────────────────────────────────────────────────
  // Guard: if any Voice Instructions header already exists in an unrecognised
  // format, don't create a second one — just return the prompt unchanged.
  if (lines.some(l => /voice instructions/i.test(l.trim()))) {
    return prompt;
  }
  return `Voice Instructions\n${newContent}\n\n${prompt}`;
}

/**
 * Reverse-maps a stored voice_instruction string back to its VOICE_STYLE_SP_MAP key.
 * Falls back to 'friendly' if no match is found.
 */
function detectVoiceStyleFromInstruction(instruction: string | undefined): string {
  if (!instruction) return 'friendly';
  const needle = instruction.trim().toLowerCase();
  for (const [key, value] of Object.entries(VOICE_STYLE_SP_MAP)) {
    if (needle === value.toLowerCase() || needle.startsWith(value.toLowerCase().slice(0, 30))) {
      return key;
    }
  }
  return 'friendly';
}

const EditAgent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAgent, setCurrentAgent, refreshAgents } = useAgent();
  const { user } = useAuth();
  const MULTILINGUAL_ALLOWED_EMAILS = ['demo@callshivai.com', 'atharkatheri@gmail.com'];
  const canUseMultilingual = MULTILINGUAL_ALLOWED_EMAILS.includes((user?.email || '').toLowerCase());

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    gender: "female",
    businessProcess: "",
    industry: "",
    subIndustry: "",
    persona: "Empathetic",
    languages: ["en-US"] as string[],
    voice: "Achernar",
    voiceSpeed: 1.0,
    voiceStyle: "friendly",
    customInstructions: "",
    guardrailsLevel: "Medium",
    responseStyle: "Balanced",
    maxResponseLength: "Medium (150 words)",
    contextWindow: "Standard (8K tokens)",
    temperature: 0.7,
    countries: [] as string[],
    realtimeVoice: "alloy",
  });

  const [templateData, setTemplateData] = useState<any>(null);
  const [isRegeneratingTemplate, setIsRegeneratingTemplate] = useState(false);
  const [isSpGenerating, setIsSpGenerating] = useState(false);
  const [templateRegenNeeded, setTemplateRegenNeeded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  // Stores the baseline key fields as loaded from API — used to detect meaningful changes
  const baselineTemplateFieldsRef = useRef<{ businessProcess: string; industry: string; subIndustry: string; voiceStyle: string } | null>(null);
  // Tracks the original company name loaded from the API to detect user changes
  const originalCompanyNameRef = useRef<string>('');
  const originalAgentNameRef = useRef<string>('');

  // Tab state (like Training page)
  const [activeTab, setActiveTab] = useState<string>('identity');
  
  // Tab configuration
  const editTabs = [
    { id: 'identity', label: 'Identity', icon: Bot },
    { id: 'voice', label: 'Voice', icon: Volume2 },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'settings', label: 'Template Setting', icon: Settings },
  ];

  // Knowledge Base State
  const [websiteUrls, setWebsiteUrls] = useState<string[]>(['']);
  const [socialMediaUrls, setSocialMediaUrls] = useState<string[]>(['']);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Ref to detect user-initiated voice style changes (not API-load)
  const voiceStyleDirtyRef = useRef(false);
  // Tracks the last agent name applied to customInstructions (supports multiple renames)
  const prevNameRef = useRef<string>('');

  // Mark dirty whenever form data or template data changes (after initial load).
  // isLoadedRef is armed by a separate useEffect on isLoadingAgent so it only
  // becomes true AFTER the loaded-data render has already flushed — preventing
  // the false "Unsaved Changes" on first load.
  const isLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    setIsDirty(true);
  }, [formData, templateData]);

  // Detect when key template-driving fields drift from their loaded baseline
  useEffect(() => {
    if (!templateData || !baselineTemplateFieldsRef.current) return;
    const baseline = baselineTemplateFieldsRef.current;
    const changed =
      formData.businessProcess !== baseline.businessProcess ||
      formData.industry !== baseline.industry ||
      formData.subIndustry !== baseline.subIndustry ||
      formData.voiceStyle !== baseline.voiceStyle ||
      (originalCompanyNameRef.current !== '' && formData.companyName !== originalCompanyNameRef.current) ||
      (originalAgentNameRef.current !== '' && formData.name !== originalAgentNameRef.current);
    setTemplateRegenNeeded(changed);
  }, [formData.businessProcess, formData.industry, formData.subIndustry, formData.voiceStyle, formData.companyName, formData.name, templateData]);

  // When the user explicitly changes Voice Style, patch the Voice Instructions
  // section of the system prompt with the new static content.
  useEffect(() => {
    if (!voiceStyleDirtyRef.current) return;
    voiceStyleDirtyRef.current = false;
    const style = formData.voiceStyle;
    const newContent = VOICE_STYLE_SP_MAP[style] || VOICE_STYLE_SP_MAP['friendly'];
    setFormData((prev) => {
      const updated = updateVoiceInstructionsSection(prev.customInstructions, newContent);
      return updated !== prev.customInstructions ? { ...prev, customInstructions: updated } : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.voiceStyle]);

  // Existing KB file inline text editing
  const [existingKbFiles, setExistingKbFiles] = useState<string[]>([]);
  const [editingKbIndex, setEditingKbIndex] = useState<number | null>(null);
  const [kbFileContents, setKbFileContents] = useState<Record<number, string>>({});
  const [kbPreviewMode, setKbPreviewMode] = useState<Record<number, 'edit' | 'preview'>>({});
  const [loadingKbIndex, setLoadingKbIndex] = useState<number | null>(null);
  const [savingKbIndex, setSavingKbIndex] = useState<number | null>(null);
  const [confirmDeleteKbIndex, setConfirmDeleteKbIndex] = useState<number | null>(null);
  const [showKbInfo, setShowKbInfo] = useState(false);
  // Caches the original parsed JSON for each KB file so edits can be saved in node-tree format
  const [kbOriginalJson, setKbOriginalJson] = useState<Record<number, any>>({});

  // Search-in-editor state
  const [kbSearchQuery, setKbSearchQuery] = useState<Record<number, string>>({});
  const [kbSearchMatches, setKbSearchMatches] = useState<Record<number, number[]>>({});
  const [kbSearchMatchIdx, setKbSearchMatchIdx] = useState<Record<number, number>>({});
  const kbTextareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const kbSearchInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const kbOverlayRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [isLoadingAgent, setIsLoadingAgent] = useState(true);

  // Arm the dirty-tracker only after the loading spinner goes away.
  // Placed here (after isLoadingAgent declaration) to avoid use-before-declaration.
  // One-tick delay so all state-update effects from the load have already run
  // before we start watching for user changes.
  useEffect(() => {
    if (isLoadingAgent) return;
    const t = setTimeout(() => { isLoadedRef.current = true; }, 0);
    return () => clearTimeout(t);
  }, [isLoadingAgent]);

  // Helper functions to map API values to form values
  const mapBusinessProcess = (apiValue: string | undefined) => {
    if (!apiValue) return '';
    const mapping: Record<string, string> = {
      'sales_marketing': 'sales-marketing',
      'customer_support': 'customer-support',
      'appointment_setting': 'appointment-setting',
      'lead_qualification': 'lead-qualification',
      'product_explanation': 'product-explanation',
      'order_processing': 'order-processing',
      'technical_support': 'technical-support',
      'billing_inquiries': 'billing-inquiries',
      'feedback_collection': 'feedback-collection',
      'onboarding': 'onboarding',
    };
    return mapping[apiValue] || apiValue.replace(/_/g, '-') || '';
  };

  const mapPersonality = (apiValue: string | undefined) => {
    if (!apiValue) return 'Empathetic';
    const mapping: Record<string, string> = {
      'friendly': 'Friendly',
      'formal': 'Formal',
      'empathetic': 'Empathetic',
      'persuasive': 'Persuasive (Sales)',
      'persuasive_sales': 'Persuasive (Sales)',
      'reassuring': 'Reassuring (Support)',
      'reassuring_support': 'Reassuring (Support)',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Empathetic';
  };

  const mapResponseStyle = (apiValue: string | undefined) => {
    if (!apiValue) return 'Balanced';
    const mapping: Record<string, string> = {
      'concise': 'Concise',
      'balanced': 'Balanced',
      'detailed': 'Detailed',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Balanced';
  };

  const mapMaxResponseLength = (apiValue: string | undefined) => {
    if (!apiValue) return 'Medium (150 words)';
    const mapping: Record<string, string> = {
      'short': 'Short (50 words)',
      'medium': 'Medium (150 words)',
      'long': 'Long (300 words)',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Medium (150 words)';
  };

  const mapContextWindow = (apiValue: string | undefined) => {
    if (!apiValue) return 'Standard (8K tokens)';
    const mapping: Record<string, string> = {
      'small': 'Small (4K tokens)',
      'small_4k_tokens': 'Small (4K tokens)',
      'standard': 'Standard (8K tokens)',
      'standard_8k_tokens': 'Standard (8K tokens)',
      'large': 'Large (16K tokens)',
      'large_16k_tokens': 'Large (16K tokens)',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Standard (8K tokens)';
  };

  const mapGuardrailsLevel = (apiValue: string | undefined) => {
    if (!apiValue) return 'Medium';
    const mapping: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Medium';
  };

  const mapIndustry = (apiValue: string | undefined) => {
    if (!apiValue) return '';
    // Industry values should match, but handle underscore to hyphen conversion
    return apiValue.replace(/_/g, '-') || '';
  };

  const mapSubIndustry = (apiValue: string | undefined) => {
    if (!apiValue) return '';
    return apiValue.replace(/_/g, '-') || '';
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!id) return;
      
      setIsLoadingAgent(true);
      try {
        // Fetch full agent config from agent-configs API
        const { agent: agentData } = await agentAPI.getAgentConfig(id);
        
        console.log("agentData", agentData);
        
        // Set current agent in context
        const agentForContext = {
          id: agentData.id,
          name: agentData.name,
          status: agentData.status,
          persona: agentData.personality || "Empathetic",
          language: agentData.language || "en-US",
          voice: agentData.voice || "alloy",
          createdAt: new Date(agentData.createdAt),
          stats: agentData.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        };
        setCurrentAgent(agentForContext);
        
        // Prefill form with all API data (mapping API values to form values)
        const loadedCompanyName = (agentData as any).company_name || "";
        originalCompanyNameRef.current = loadedCompanyName;
        originalAgentNameRef.current = agentData.name || "";
        setFormData({
          name: agentData.name || "",
          companyName: loadedCompanyName,
          gender: agentData.gender || "female",
          businessProcess: mapBusinessProcess(agentData.business_process),
          industry: mapIndustry(agentData.industry),
          subIndustry: mapSubIndustry(agentData.sub_industry),
          persona: mapPersonality(agentData.personality),
          languages: Array.isArray((agentData as any).language) ? (agentData as any).language : ((agentData as any).language ? [(agentData as any).language] : ["en-US"]),
          voice: agentData.voice || "Achernar",
          voiceSpeed: (agentData as any).voice_speed !== undefined ? (agentData as any).voice_speed : 1.0,
          voiceStyle: (agentData as any).voice_style ||
            detectVoiceStyleFromInstruction((agentData as any).voice_config?.voice_instruction),
          // Use custom_instructions from API response (deduplicate Voice Instructions in case of legacy doubled data)
          customInstructions: deduplicateVoiceInstructionSections(agentData.custom_instructions || ""),
          guardrailsLevel: mapGuardrailsLevel(agentData.guardrails_level),
          responseStyle: mapResponseStyle(agentData.response_style),
          maxResponseLength: mapMaxResponseLength(agentData.max_response_length),
          contextWindow: mapContextWindow(agentData.context_window),
          temperature: agentData.temperature !== undefined ? agentData.temperature : 0.7,
          countries: Array.isArray((agentData as any).countries) ? (agentData as any).countries : [],
          realtimeVoice: (agentData as any).multilingual_voice || "alloy",
        });

        // Load template data if available.
        // Normalize: if the AI chose a different name (e.g. "Cler") than the
        // actual agent name (e.g. "Claya"), replace it in all template fields
        // immediately so real-time name updates work correctly from the start.
        if (agentData.template) {
          const tmpl = agentData.template;
          const agentName = agentData.name || '';
          const nameInTemplate = detectNameInTemplate(tmpl.firstMessage);
          if (nameInTemplate && nameInTemplate.toLowerCase() !== agentName.toLowerCase()) {
            const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const norm = (text: string | undefined | null): string => {
              if (!text) return text || '';
              return text.replace(new RegExp(`\\b${escape(nameInTemplate)}\\b`, 'gi'), agentName);
            };
            setTemplateData({
              ...tmpl,
              firstMessage: norm(tmpl.firstMessage),
              closingScript: norm(tmpl.closingScript),
              systemPrompt: norm(tmpl.systemPrompt),
              openingScript: norm(tmpl.openingScript),
              keyTalkingPoints: norm(tmpl.keyTalkingPoints),
              description: norm(tmpl.description),
              ...(tmpl.objections?.length > 0 && {
                objections: tmpl.objections.map((o: any) => ({
                  objection: norm(o.objection),
                  response: norm(o.response),
                })),
              }),
              ...(tmpl.conversationExamples?.length > 0 && {
                conversationExamples: tmpl.conversationExamples.map((ex: any) => ({
                  customerInput: norm(ex.customerInput),
                  expectedResponse: norm(ex.expectedResponse),
                })),
              }),
            });
          } else {
            setTemplateData(tmpl);
          }
        }

        // Store the original agent name for tracking changes
        // prevNameRef must be set AFTER template normalisation above so it
        // reflects the name now baked into all template fields (the agent name).
        prevNameRef.current = agentData.name || "";

        // Store baseline fields for regen-dirty detection
        baselineTemplateFieldsRef.current = {
          businessProcess: mapBusinessProcess(agentData.business_process),
          industry: mapIndustry(agentData.industry),
          subIndustry: mapSubIndustry(agentData.sub_industry),
          voiceStyle: (agentData as any).voice_style ||
            detectVoiceStyleFromInstruction((agentData as any).voice_config?.voice_instruction),
        };

        // Mark as loaded so subsequent formData/templateData changes set isDirty
        // (the flag is actually armed via a useEffect on isLoadingAgent below)

        // Load existing knowledge base file URLs
        const kbFiles = (agentData as any).knowledge_base_file_urls;
        if (Array.isArray(kbFiles) && kbFiles.length > 0) {
          setExistingKbFiles(kbFiles);
        }

        // Load existing website URLs
        const existingWebsiteUrls = (agentData as any).website_urls;
        if (Array.isArray(existingWebsiteUrls) && existingWebsiteUrls.length > 0) {
          setWebsiteUrls(existingWebsiteUrls);
        }

        // Load existing social media URLs
        const existingSocialUrls = (agentData as any).social_media_urls;
        if (Array.isArray(existingSocialUrls) && existingSocialUrls.length > 0) {
          setSocialMediaUrls(existingSocialUrls);
        }
      } catch (error) {
        console.error("Error fetching agent:", error);
        appToast.error("Failed to load agent data");
        navigate('/agents');
      } finally {
        setIsLoadingAgent(false);
      }
    };

    fetchAgentData();
  }, [id, setCurrentAgent, navigate]);

  // Update ALL template fields + system prompt whenever the agent name field changes.
  // Depends ONLY on formData.name so it fires exactly once per keystroke-commit,
  // with no re-fire caused by the setTemplateData / setFormData calls below.
  useEffect(() => {
    const newName = formData.name;
    if (!newName) return;

    // prevNameRef.current tracks the last name applied to ALL content fields.
    // It is initialised at API load time and updated here on every rename.
    const oldName = prevNameRef.current;
    if (!oldName || oldName === newName) return;

    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceInText = (text: string | undefined | null): string => {
      if (!text) return text || '';
      // Word-boundary match first (handles single-word names like "Cler" or "Linda")
      const r1 = text.replace(new RegExp(`\\b${escape(oldName)}\\b`, 'gi'), newName);
      if (r1 !== text) return r1;
      // Fallback: substring match (handles names embedded without word boundaries)
      return text.replace(new RegExp(escape(oldName), 'gi'), newName);
    };

    console.log(`🔄 Name change: "${oldName}" → "${newName}"`);

    // Update system prompt (customInstructions) via functional setter
    setFormData((prev) => ({
      ...prev,
      customInstructions: replaceInText(prev.customInstructions),
    }));

    // Update every templateData field via functional setter — no stale closure,
    // no re-triggering of this effect because templateData is NOT in the dep array.
    setTemplateData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        description: replaceInText(prev.description),
        systemPrompt: replaceInText(prev.systemPrompt),
        firstMessage: replaceInText(prev.firstMessage),
        openingScript: replaceInText(prev.openingScript),
        keyTalkingPoints: replaceInText(prev.keyTalkingPoints),
        closingScript: replaceInText(prev.closingScript),
        ...(prev.objections?.length > 0 && {
          objections: prev.objections.map((obj: any) => ({
            objection: replaceInText(obj.objection),
            response: replaceInText(obj.response),
          })),
        }),
        ...(prev.conversationExamples?.length > 0 && {
          conversationExamples: prev.conversationExamples.map((ex: any) => ({
            customerInput: replaceInText(ex.customerInput),
            expectedResponse: replaceInText(ex.expectedResponse),
          })),
        }),
      };
    });

    // Advance the tracked name so chained renames (A→B→C) work correctly
    prevNameRef.current = newName;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name]);

  const businessProcesses = [
    { value: "customer-support", label: "Customer Support", group: "Support" },
    { value: "sales-marketing", label: "Sales & Marketing", group: "Sales" },
    { value: "appointment-setting", label: "Appointment Setting", group: "Sales" },
    { value: "lead-qualification", label: "Lead Qualification", group: "Sales" },
    { value: "product-explanation", label: "Product Explanation", group: "Support" },
    { value: "order-processing", label: "Order Processing", group: "Operations" },
    { value: "technical-support", label: "Technical Support", group: "Support" },
    { value: "billing-inquiries", label: "Billing Inquiries", group: "Support" },
    { value: "feedback-collection", label: "Feedback Collection", group: "Operations" },
    { value: "onboarding", label: "Customer Onboarding", group: "Operations" },
  ];

  const industries = [
    { value: "real-estate", label: "Real Estate" },
    { value: "healthcare", label: "Healthcare" },
    { value: "dental", label: "Dental" },
    { value: "fitness", label: "Fitness & Wellness" },
    { value: "education", label: "Education" },
    { value: "finance", label: "Finance & Banking" },
    { value: "insurance", label: "Insurance" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "retail", label: "Retail" },
    { value: "technology", label: "Technology" },
    { value: "saas", label: "SaaS" },
    { value: "legal", label: "Legal Services" },
    { value: "consulting", label: "Consulting" },
    { value: "accounting", label: "Accounting" },
    { value: "hospitality", label: "Hospitality" },
    { value: "restaurants", label: "Restaurants" },
    { value: "automotive", label: "Automotive" },
    { value: "construction", label: "Construction" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "travel", label: "Travel & Tourism" },
    { value: "beauty", label: "Beauty & Salon" },
    { value: "home-services", label: "Home Services" },
    { value: "nonprofit", label: "Non-Profit" },
    { value: "government", label: "Government" },
    { value: "entertainment", label: "Entertainment" },
    { value: "other", label: "Other" },
  ];

  const subIndustries: Record<string, { value: string; label: string }[]> = {
    "real-estate": [
      { value: "residential", label: "Residential Sales" },
      { value: "commercial", label: "Commercial Real Estate" },
      { value: "property-management", label: "Property Management" },
      { value: "luxury-real-estate", label: "Luxury Real Estate" },
      { value: "vacation-rentals", label: "Vacation Rentals" },
      { value: "real-estate-investment", label: "Real Estate Investment" },
      { value: "land-sales", label: "Land & Lot Sales" },
      { value: "real-estate-appraisal", label: "Real Estate Appraisal" },
    ],
    "healthcare": [
      { value: "hospitals", label: "Hospitals" },
      { value: "clinics", label: "General Clinics" },
      { value: "mental-health", label: "Mental Health Services" },
      { value: "home-healthcare", label: "Home Healthcare" },
      { value: "urgent-care", label: "Urgent Care Centers" },
      { value: "specialized-clinics", label: "Specialized Clinics" },
      { value: "diagnostic-centers", label: "Diagnostic Centers" },
      { value: "rehabilitation", label: "Rehabilitation Centers" },
      { value: "telemedicine", label: "Telemedicine" },
      { value: "nursing-homes", label: "Nursing Homes" },
      { value: "medical-devices", label: "Medical Devices" },
      { value: "pharmaceuticals", label: "Pharmaceuticals" },
    ],
    "dental": [
      { value: "general-dentistry", label: "General Dentistry" },
      { value: "orthodontics", label: "Orthodontics" },
      { value: "cosmetic-dentistry", label: "Cosmetic Dentistry" },
      { value: "pediatric-dentistry", label: "Pediatric Dentistry" },
      { value: "periodontics", label: "Periodontics" },
      { value: "endodontics", label: "Endodontics" },
      { value: "oral-surgery", label: "Oral Surgery" },
      { value: "dental-implants", label: "Dental Implants" },
    ],
    "fitness": [
      { value: "gyms", label: "Gyms & Fitness Centers" },
      { value: "yoga-studios", label: "Yoga Studios" },
      { value: "personal-training", label: "Personal Training" },
      { value: "crossfit", label: "CrossFit Gyms" },
      { value: "pilates", label: "Pilates Studios" },
      { value: "martial-arts", label: "Martial Arts & Boxing" },
      { value: "dance-studios", label: "Dance Studios" },
      { value: "sports-facilities", label: "Sports Facilities" },
      { value: "wellness-centers", label: "Wellness Centers" },
      { value: "wellness-spas", label: "Wellness Spas" },
    ],
    "education": [
      { value: "k12", label: "K-12 Schools" },
      { value: "higher-education", label: "Higher Education" },
      { value: "online-learning", label: "Online Learning Platforms" },
      { value: "tutoring", label: "Tutoring Services" },
      { value: "vocational-training", label: "Vocational Training" },
      { value: "vocational", label: "Vocational Training" },
      { value: "language-schools", label: "Language Schools" },
      { value: "test-prep", label: "Test Preparation" },
      { value: "preschool", label: "Preschool & Daycare" },
    ],
    "finance": [
      { value: "banking", label: "Banking Services" },
      { value: "investment", label: "Investment Services" },
      { value: "wealth-management", label: "Wealth Management" },
      { value: "lending", label: "Lending & Mortgages" },
      { value: "mortgage-lending", label: "Mortgage Lending" },
      { value: "financial-planning", label: "Financial Planning" },
      { value: "tax-services", label: "Tax Services" },
      { value: "fintech", label: "Fintech" },
      { value: "credit-unions", label: "Credit Unions" },
    ],
    "insurance": [
      { value: "health-insurance", label: "Health Insurance" },
      { value: "life-insurance", label: "Life Insurance" },
      { value: "auto-insurance", label: "Auto Insurance" },
      { value: "property-insurance", label: "Property Insurance" },
      { value: "business-insurance", label: "Business Insurance" },
      { value: "travel-insurance", label: "Travel Insurance" },
      { value: "disability-insurance", label: "Disability Insurance" },
    ],
    "ecommerce": [
      { value: "fashion", label: "Fashion & Apparel" },
      { value: "electronics", label: "Electronics" },
      { value: "food-beverage", label: "Food & Beverage" },
      { value: "home-decor", label: "Home Decor" },
      { value: "home-garden", label: "Home & Garden" },
      { value: "beauty-products", label: "Beauty Products" },
      { value: "sporting-goods", label: "Sporting Goods" },
      { value: "toys-games", label: "Toys & Games" },
      { value: "books-media", label: "Books & Media" },
      { value: "pet-supplies", label: "Pet Supplies" },
      { value: "marketplace", label: "Marketplace" },
    ],
    "retail": [
      { value: "grocery", label: "Grocery Stores" },
      { value: "fashion-retail", label: "Fashion Retail" },
      { value: "electronics-retail", label: "Electronics Retail" },
      { value: "home-improvement", label: "Home Improvement" },
      { value: "department-stores", label: "Department Stores" },
      { value: "specialty-retail", label: "Specialty Retail" },
      { value: "convenience-stores", label: "Convenience Stores" },
      { value: "furniture-stores", label: "Furniture Stores" },
      { value: "pharmacy", label: "Pharmacy" },
    ],
    "technology": [
      { value: "software-development", label: "Software Development" },
      { value: "it-services", label: "IT Services & Consulting" },
      { value: "cybersecurity", label: "Cybersecurity" },
      { value: "cloud-services", label: "Cloud Services" },
      { value: "data-analytics", label: "Data Analytics" },
      { value: "ai-ml", label: "AI & Machine Learning" },
      { value: "mobile-development", label: "Mobile App Development" },
      { value: "web-development", label: "Web Development" },
    ],
    "saas": [
      { value: "crm", label: "CRM Software" },
      { value: "erp", label: "ERP Software" },
      { value: "marketing-automation", label: "Marketing Automation" },
      { value: "project-management", label: "Project Management" },
      { value: "hr-software", label: "HR & Payroll Software" },
      { value: "accounting-software", label: "Accounting Software" },
      { value: "collaboration-tools", label: "Collaboration Tools" },
      { value: "analytics-platforms", label: "Analytics Platforms" },
    ],
    "legal": [
      { value: "corporate-law", label: "Corporate Law" },
      { value: "family-law", label: "Family Law" },
      { value: "immigration-law", label: "Immigration Law" },
      { value: "criminal-law", label: "Criminal Defense" },
      { value: "real-estate-law", label: "Real Estate Law" },
      { value: "estate-planning", label: "Estate Planning" },
      { value: "personal-injury", label: "Personal Injury" },
      { value: "intellectual-property", label: "Intellectual Property" },
    ],
    "consulting": [
      { value: "management-consulting", label: "Management Consulting" },
      { value: "strategy-consulting", label: "Strategy Consulting" },
      { value: "it-consulting", label: "IT Consulting" },
      { value: "hr-consulting", label: "HR Consulting" },
    ],
    "accounting": [
      { value: "tax-services", label: "Tax Services" },
      { value: "audit", label: "Audit" },
      { value: "bookkeeping", label: "Bookkeeping" },
      { value: "payroll", label: "Payroll Services" },
    ],
    "hospitality": [
      { value: "hotels", label: "Hotels & Motels" },
      { value: "resorts", label: "Resorts & Spas" },
      { value: "event-venues", label: "Event Venues" },
      { value: "bed-breakfast", label: "Bed & Breakfast" },
      { value: "vacation-rentals", label: "Vacation Rentals" },
      { value: "hostels", label: "Hostels" },
      { value: "conference-centers", label: "Conference Centers" },
    ],
    "restaurants": [
      { value: "fine-dining", label: "Fine Dining" },
      { value: "casual-dining", label: "Casual Dining" },
      { value: "fast-food", label: "Fast Food & QSR" },
      { value: "cafes", label: "Cafes & Coffee Shops" },
      { value: "food-trucks", label: "Food Trucks" },
      { value: "bakeries", label: "Bakeries & Pastry Shops" },
      { value: "catering", label: "Catering Services" },
      { value: "bars-pubs", label: "Bars & Pubs" },
      { value: "buffets", label: "Buffets" },
    ],
    "automotive": [
      { value: "dealerships", label: "Car Dealerships" },
      { value: "auto-repair", label: "Auto Repair & Maintenance" },
      { value: "car-rental", label: "Car Rental Services" },
      { value: "auto-parts", label: "Auto Parts & Accessories" },
      { value: "car-wash", label: "Car Wash & Detailing" },
      { value: "body-shops", label: "Body Shops & Collision Repair" },
      { value: "tire-services", label: "Tire Services" },
      { value: "oil-change", label: "Oil Change & Lube" },
      { value: "auto-glass", label: "Auto Glass Repair" },
      { value: "towing", label: "Towing Services" },
    ],
    "construction": [
      { value: "residential-construction", label: "Residential Construction" },
      { value: "commercial-construction", label: "Commercial Construction" },
      { value: "renovation", label: "Renovation" },
      { value: "specialty-trades", label: "Specialty Trades" },
    ],
    "manufacturing": [
      { value: "industrial", label: "Industrial Manufacturing" },
      { value: "consumer-goods", label: "Consumer Goods" },
      { value: "food-manufacturing", label: "Food Manufacturing" },
      { value: "electronics-manufacturing", label: "Electronics Manufacturing" },
    ],
    "travel": [
      { value: "travel-agencies", label: "Travel Agencies" },
      { value: "airlines", label: "Airlines" },
      { value: "tour-operators", label: "Tour Operators" },
      { value: "cruise-lines", label: "Cruise Lines" },
    ],
    "beauty": [
      { value: "hair-salons", label: "Hair Salons" },
      { value: "nail-salons", label: "Nail Salons" },
      { value: "med-spas", label: "Medical Spas" },
      { value: "barbershops", label: "Barbershops" },
      { value: "day-spas", label: "Day Spas" },
      { value: "cosmetics", label: "Cosmetics & Makeup" },
      { value: "tattoo-piercing", label: "Tattoo & Piercing" },
      { value: "waxing", label: "Waxing & Threading" },
      { value: "aesthetic-clinics", label: "Aesthetic Clinics" },
    ],
    "home-services": [
      { value: "plumbing", label: "Plumbing Services" },
      { value: "electrical", label: "Electrical Services" },
      { value: "hvac", label: "HVAC Services" },
      { value: "cleaning", label: "Cleaning Services" },
      { value: "landscaping", label: "Landscaping & Lawn Care" },
      { value: "pest-control", label: "Pest Control" },
      { value: "roofing", label: "Roofing Services" },
      { value: "painting", label: "Painting Services" },
      { value: "moving", label: "Moving Services" },
      { value: "handyman", label: "Handyman Services" },
      { value: "carpet-cleaning", label: "Carpet Cleaning" },
      { value: "window-cleaning", label: "Window Cleaning" },
    ],
    "nonprofit": [
      { value: "charity", label: "Charity" },
      { value: "foundations", label: "Foundations" },
      { value: "religious", label: "Religious Organizations" },
      { value: "advocacy", label: "Advocacy Groups" },
    ],
    "government": [
      { value: "federal", label: "Federal" },
      { value: "state", label: "State" },
      { value: "local", label: "Local" },
      { value: "public-services", label: "Public Services" },
    ],
    "entertainment": [
      { value: "media", label: "Media & Broadcasting" },
      { value: "gaming", label: "Gaming" },
      { value: "events", label: "Events & Concerts" },
      { value: "sports", label: "Sports" },
    ],
    "other": [
      { value: "general", label: "General Business" },
      { value: "custom", label: "Custom Industry" },
      { value: "non-profit", label: "Non-Profit Organization" },
      { value: "government", label: "Government Services" },
    ],
  };

  const genders = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
  ];

  // Voice Options by Gender
  // Multilingual voice support
  const multilingualVoices: Record<string, string[]> = {
    female: ["Aoede", "Kore", "Leda", "Zephyr"],
    male: ["Puck", "Charon", "Fenrir", "Orus"],
  };
  const englishOnlyLanguages = ["en-US", "en-GB", "en-IN", "en-AU", "en-CA"];
  const isMultilingualMode = formData.languages.includes("multilingual");
  const isMultilingualLanguage = formData.languages.some((l) => !englishOnlyLanguages.includes(l) && l !== "multilingual");

  const ALL_LANGUAGES: { value: string; label: string; flag: string; countryCodes: string[] }[] = [
    { value: "en-US",  label: "English (US)",       flag: "🇺🇸", countryCodes: ["US"] },
    { value: "en-GB",  label: "English (UK)",        flag: "🇬🇧", countryCodes: ["GB"] },
    { value: "en-AU",  label: "English (Australia)", flag: "🇦🇺", countryCodes: ["AU"] },
    { value: "en-CA",  label: "English (Canada)",    flag: "🇨🇦", countryCodes: ["CA"] },
    { value: "en-IN",  label: "English (India)",     flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "es",     label: "Spanish",             flag: "🇪🇸", countryCodes: ["ES", "MX", "AR", "CO"] },
    { value: "fr",     label: "French",              flag: "🇫🇷", countryCodes: ["FR", "CA", "BE"] },
    { value: "de",     label: "German",              flag: "🇩🇪", countryCodes: ["DE", "AT", "CH"] },
    { value: "it",     label: "Italian",             flag: "🇮🇹", countryCodes: ["IT"] },
    { value: "pt",     label: "Portuguese",          flag: "🇵🇹", countryCodes: ["PT", "BR"] },
    { value: "nl",     label: "Dutch",               flag: "🇳🇱", countryCodes: ["NL", "BE"] },
    { value: "pl",     label: "Polish",              flag: "🇵🇱", countryCodes: ["PL"] },
    { value: "ru",     label: "Russian",             flag: "🇷🇺", countryCodes: ["RU"] },
    { value: "uk",     label: "Ukrainian",           flag: "🇺🇦", countryCodes: ["UA"] },
    { value: "ja",     label: "Japanese",            flag: "🇯🇵", countryCodes: ["JP"] },
    { value: "ko",     label: "Korean",              flag: "🇰🇷", countryCodes: ["KR"] },
    { value: "zh",     label: "Chinese",             flag: "🇨🇳", countryCodes: ["CN", "TW"] },
    { value: "ar",     label: "Arabic",              flag: "🇸🇦", countryCodes: ["SA", "AE", "EG"] },
    { value: "hi",     label: "Hindi",               flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "ta",     label: "Tamil",               flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "te",     label: "Telugu",              flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "mr",     label: "Marathi",             flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "bn",     label: "Bengali",             flag: "🇮🇳", countryCodes: ["IN", "BD"] },
    { value: "gu",     label: "Gujarati",            flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "kn",     label: "Kannada",             flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "ml",     label: "Malayalam",           flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "pa",     label: "Punjabi",             flag: "🇮🇳", countryCodes: ["IN"] },
    { value: "tr",     label: "Turkish",             flag: "🇹🇷", countryCodes: ["TR"] },
    { value: "he",     label: "Hebrew",              flag: "🇮🇱", countryCodes: ["IL"] },
    { value: "sv",     label: "Swedish",             flag: "🇸🇪", countryCodes: ["SE"] },
    { value: "nb",     label: "Norwegian",           flag: "🇳🇴", countryCodes: ["NO"] },
    { value: "da",     label: "Danish",              flag: "🇩🇰", countryCodes: ["DK"] },
    { value: "fi",     label: "Finnish",             flag: "🇫🇮", countryCodes: ["FI"] },
    { value: "el",     label: "Greek",               flag: "🇬🇷", countryCodes: ["GR"] },
    { value: "cs",     label: "Czech",               flag: "🇨🇿", countryCodes: ["CZ"] },
    { value: "hu",     label: "Hungarian",           flag: "🇭🇺", countryCodes: ["HU"] },
    { value: "ro",     label: "Romanian",            flag: "🇷🇴", countryCodes: ["RO"] },
    { value: "bg",     label: "Bulgarian",           flag: "🇧🇬", countryCodes: ["BG"] },
    { value: "hr",     label: "Croatian",            flag: "🇭🇷", countryCodes: ["HR"] },
    { value: "sr",     label: "Serbian",             flag: "🇷🇸", countryCodes: ["RS"] },
    { value: "sk",     label: "Slovak",              flag: "🇸🇰", countryCodes: ["SK"] },
    { value: "sl",     label: "Slovenian",           flag: "🇸🇮", countryCodes: ["SI"] },
    { value: "et",     label: "Estonian",            flag: "🇪🇪", countryCodes: ["EE"] },
    { value: "lv",     label: "Latvian",             flag: "🇱🇻", countryCodes: ["LV"] },
    { value: "lt",     label: "Lithuanian",          flag: "🇱🇹", countryCodes: ["LT"] },
    { value: "th",     label: "Thai",               flag: "🇹🇭", countryCodes: ["TH"] },
    { value: "vi",     label: "Vietnamese",          flag: "🇻🇳", countryCodes: ["VN"] },
    { value: "id",     label: "Indonesian",          flag: "🇮🇩", countryCodes: ["ID"] },
  ];

  const realtimeTTSVoices: Record<string, { value: string; label: string }[]> = {
    female: [
      { value: "alloy",   label: "Alloy" },
      { value: "coral",   label: "Coral" },
      { value: "sage",    label: "Sage" },
      { value: "shimmer", label: "Shimmer" },
    ],
    male: [
      { value: "ash",    label: "Ash" },
      { value: "ballad", label: "Ballad" },
      { value: "echo",   label: "Echo" },
      { value: "verse",  label: "Verse" },
    ],
  };

  const ALL_COUNTRIES = [
    { code: "IN",  name: "India",                 flag: "🇮🇳" },
    { code: "US",  name: "United States",          flag: "🇺🇸" },
    { code: "GB",  name: "United Kingdom",         flag: "🇬🇧" },
    { code: "AU",  name: "Australia",              flag: "🇦🇺" },
    { code: "CA",  name: "Canada",                 flag: "🇨🇦" },
    { code: "AE",  name: "United Arab Emirates",   flag: "🇦🇪" },
    { code: "SA",  name: "Saudi Arabia",           flag: "🇸🇦" },
    { code: "ES",  name: "Spain",                  flag: "🇪🇸" },
    { code: "MX",  name: "Mexico",                 flag: "🇲🇽" },
    { code: "AR",  name: "Argentina",              flag: "🇦🇷" },
    { code: "CO",  name: "Colombia",               flag: "🇨🇴" },
    { code: "FR",  name: "France",                 flag: "🇫🇷" },
    { code: "BE",  name: "Belgium",                flag: "🇧🇪" },
    { code: "DE",  name: "Germany",                flag: "🇩🇪" },
    { code: "AT",  name: "Austria",                flag: "🇦🇹" },
    { code: "CH",  name: "Switzerland",            flag: "🇨🇭" },
    { code: "IT",  name: "Italy",                  flag: "🇮🇹" },
    { code: "PT",  name: "Portugal",               flag: "🇵🇹" },
    { code: "BR",  name: "Brazil",                 flag: "🇧🇷" },
    { code: "NL",  name: "Netherlands",            flag: "🇳🇱" },
    { code: "PL",  name: "Poland",                 flag: "🇵🇱" },
    { code: "RU",  name: "Russia",                 flag: "🇷🇺" },
    { code: "UA",  name: "Ukraine",                flag: "🇺🇦" },
    { code: "JP",  name: "Japan",                  flag: "🇯🇵" },
    { code: "KR",  name: "South Korea",            flag: "🇰🇷" },
    { code: "CN",  name: "China",                  flag: "🇨🇳" },
    { code: "TW",  name: "Taiwan",                 flag: "🇹🇼" },
    { code: "EG",  name: "Egypt",                  flag: "🇪🇬" },
    { code: "PK",  name: "Pakistan",               flag: "🇵🇰" },
    { code: "BD",  name: "Bangladesh",             flag: "🇧🇩" },
    { code: "TR",  name: "Turkey",                 flag: "🇹🇷" },
    { code: "IL",  name: "Israel",                 flag: "🇮🇱" },
    { code: "SE",  name: "Sweden",                 flag: "🇸🇪" },
    { code: "NO",  name: "Norway",                 flag: "🇳🇴" },
    { code: "DK",  name: "Denmark",                flag: "🇩🇰" },
    { code: "FI",  name: "Finland",                flag: "🇫🇮" },
    { code: "GR",  name: "Greece",                 flag: "🇬🇷" },
    { code: "CZ",  name: "Czech Republic",         flag: "🇨🇿" },
    { code: "HU",  name: "Hungary",                flag: "🇭🇺" },
    { code: "RO",  name: "Romania",                flag: "🇷🇴" },
    { code: "BG",  name: "Bulgaria",               flag: "🇧🇬" },
    { code: "HR",  name: "Croatia",                flag: "🇭🇷" },
    { code: "RS",  name: "Serbia",                 flag: "🇷🇸" },
    { code: "SK",  name: "Slovakia",               flag: "🇸🇰" },
    { code: "SI",  name: "Slovenia",               flag: "🇸🇮" },
    { code: "EE",  name: "Estonia",                flag: "🇪🇪" },
    { code: "LV",  name: "Latvia",                 flag: "🇱🇻" },
    { code: "LT",  name: "Lithuania",              flag: "🇱🇹" },
    { code: "TH",  name: "Thailand",               flag: "🇹🇭" },
    { code: "VN",  name: "Vietnam",                flag: "🇻🇳" },
    { code: "ID",  name: "Indonesia",              flag: "🇮🇩" },
    { code: "MY",  name: "Malaysia",               flag: "🇲🇾" },
    { code: "PH",  name: "Philippines",            flag: "🇵🇭" },
  ];

  const getFilteredVoiceOptions = (gender: string) => {
    const opts = voiceOptions[gender] || voiceOptions.female;
    if (isMultilingualLanguage) {
      return opts.filter((v) => (multilingualVoices[gender] || []).includes(v.value));
    }
    return opts;
  };

  const voiceOptions: Record<string, { value: string; label: string }[]> = {
    female: [
      { value: "Achernar", label: "Achernar" },
      { value: "Aoede", label: "Aoede" },
      { value: "Autonoe", label: "Autonoe" },
      { value: "Callirrhoe", label: "Callirrhoe" },
      { value: "Despina", label: "Despina" },
      { value: "Erinome", label: "Erinome" },
      { value: "Gacrux", label: "Gacrux" },
      { value: "Kore", label: "Kore" },
      { value: "Laomedeia", label: "Laomedeia" },
      { value: "Leda", label: "Leda" },
      { value: "Pulcherrima", label: "Pulcherrima" },
      { value: "Sulafat", label: "Sulafat" },
      { value: "Vindemiatrix", label: "Vindemiatrix" },
      { value: "Zephyr", label: "Zephyr" },
    ],
    male: [
      { value: "Achird", label: "Achird" },
      { value: "Algenib", label: "Algenib" },
      { value: "Algieba", label: "Algieba" },
      { value: "Alnilam", label: "Alnilam" },
      { value: "Charon", label: "Charon" },
      { value: "Enceladus", label: "Enceladus" },
      { value: "Fenrir", label: "Fenrir" },
      { value: "Iapetus", label: "Iapetus" },
      { value: "Orus", label: "Orus" },
      { value: "Puck", label: "Puck" },
      { value: "Rasalgethi", label: "Rasalgethi" },
      { value: "Sadachbia", label: "Sadachbia" },
      { value: "Sadaltager", label: "Sadaltager" },
      { value: "Schedar", label: "Schedar" },
      { value: "Umbriel", label: "Umbriel" },
      { value: "Zubenelgenubi", label: "Zubenelgenubi" },
    ],
  };

  // Voice preview state
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isLoadingVoicePreview, setIsLoadingVoicePreview] = useState(false);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Country dropdown state
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Language dropdown state
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const previewGeminiVoice = async (voiceName: string) => {
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
      voicePreviewAudioRef.current = null;
    }
    setIsTestingVoice(true);
    setIsLoadingVoicePreview(true);
    try {
      const sampleText = `Hello! I'm ${formData.name || 'your AI assistant'}. How can I help you today?`;
      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens)?.accessToken : null;
      const response = await fetch('https://nodejs.service.callshivai.com/api/v1/voice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ voiceName, text: sampleText }),
      });
      if (!response.ok) throw new Error(`Voice preview failed: ${response.status}`);
      const json = await response.json();
      const audioData = json.data;
      let audioUrl: string;
      let isDataUrl = false;
      if (audioData?.audioDataUrl) {
        audioUrl = audioData.audioDataUrl;
        isDataUrl = true;
      } else if (audioData?.audioBase64) {
        const byteChars = atob(audioData.audioBase64);
        const byteNums = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
        const byteArray = new Uint8Array(byteNums);
        audioUrl = URL.createObjectURL(new Blob([byteArray], { type: 'audio/mp3' }));
      } else {
        throw new Error('No audio data in response');
      }
      const audio = new Audio(audioUrl);
      voicePreviewAudioRef.current = audio;
      audio.oncanplay = () => setIsLoadingVoicePreview(false);
      audio.onended = () => {
        setIsTestingVoice(false);
        setIsLoadingVoicePreview(false);
        if (!isDataUrl) URL.revokeObjectURL(audioUrl);
        voicePreviewAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsTestingVoice(false);
        setIsLoadingVoicePreview(false);
        voicePreviewAudioRef.current = null;
      };
      await audio.play();
      setIsLoadingVoicePreview(false);
    } catch (error) {
      setIsTestingVoice(false);
      setIsLoadingVoicePreview(false);
      appToast.error('Voice preview unavailable. Please try again later.');
    }
  };

  const stopVoicePreview = () => {
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
      voicePreviewAudioRef.current = null;
    }
    setIsTestingVoice(false);
    setIsLoadingVoicePreview(false);
  };

  const maxResponseOptions = [
    { value: "Short (50 words)", label: "Short (50 words)" },
    { value: "Medium (150 words)", label: "Medium (150 words)" },
    { value: "Long (300 words)", label: "Long (300 words)" },
  ];

  // Knowledge Base Handlers
  const handleKnowledgeBaseUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploadingFiles(true);
    try {
      setUploadedFiles((prev) => [...prev, ...files]);

      // Upload files to the API
      const response = await agentAPI.uploadKnowledgeBase(files);
      console.log("📤 Knowledge base upload response:", response);

      // Extract URLs from response.data.files array
      const urls = response.data?.files?.map((file: any) => file.url) || [];
      if (urls.length > 0) {
        setUploadedFileUrls((prev) => [...prev, ...urls]);
        console.log("✅ Knowledge base files uploaded:", urls);
        appToast.success(`${files.length} file(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error("❌ Error uploading knowledge base files:", error);
      appToast.error("Failed to upload files. Please try again.");
      setUploadedFiles((prev) =>
        prev.filter((f) => !files.some((newFile) => newFile.name === f.name))
      );
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleRemoveKnowledgeBaseFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFileUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Existing KB file inline text editing handlers ---
  const handleToggleEditKbFile = async (index: number, fileUrl: string) => {
    // Toggle off
    if (editingKbIndex === index) {
      setEditingKbIndex(null);
      return;
    }
    setEditingKbIndex(index);
    // Always load fresh content + presigned URL via API
    if (kbFileContents[index] === undefined) {
      if (!id) return;
      setLoadingKbIndex(index);
      try {
        // Step 1: GET presigned-url → receive presignedUrl (PUT) + fileUrl (read)
        const filename = fileUrl.split('/').pop() || 'knowledge.txt';
        const result = await agentAPI.getPresignedUrl(id, filename);
        const { fileUrl: freshFileUrl } = result.data;

        // Step 2: Fetch document text from fileUrl
        const res = await fetch(freshFileUrl);
        if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
        const text = await res.text();
        // Cache original JSON structure so edits can be saved back in node-tree format
        try {
          const parsed = JSON.parse(text.trim());
          if (parsed && Array.isArray(parsed.structure)) {
            setKbOriginalJson((prev) => ({ ...prev, [index]: parsed }));
          }
        } catch { /* not JSON — save as plain text */ }
        // Process content (JSON → readable text, word-per-line repair, etc.)
        setKbFileContents((prev) => ({ ...prev, [index]: processKbContent(text) }));
      } catch {
        appToast.error('Failed to load file content');
        setKbFileContents((prev) => ({ ...prev, [index]: '' }));
      } finally {
        setLoadingKbIndex(null);
      }
    }
  };

  const handleSaveKbFile = async (index: number, fileUrl: string) => {
    if (!id) return;
    const content = kbFileContents[index] ?? '';
    setSavingKbIndex(index);
    try {
      // Re-fetch presigned URL in case the cached one expired (valid only 15 min)
      const filename = fileUrl.split('/').pop() || 'knowledge.txt';
      const result = await agentAPI.getPresignedUrl(id, filename);
      const presignedUrl = result.data.presignedUrl;

      // If original was KB JSON format, reconstruct node-tree so AI can process it
      const originalJson = kbOriginalJson[index];
      const payload = originalJson ? reconstructKbJson(originalJson, content) : content;
      const contentType = originalJson ? 'application/json' : 'text/plain';

      console.group('📤 KB Save — payload verification');
      console.log('contentType:', contentType);
      console.log('originalJson cached?', !!originalJson);
      if (originalJson) {
        try {
          const parsed = JSON.parse(payload);
          console.log('doc_name:', parsed.doc_name);
          console.log('doc_description:', parsed.doc_description);
          console.log('structure nodes:', parsed.structure?.length);
          console.table(parsed.structure?.map((n: any) => ({
            node_id: n.node_id,
            title: n.title,
            textSnippet: (n.text || '').slice(0, 80).replace(/\n/g, '↵'),
          })));
        } catch {
          console.warn('Could not parse reconstructed payload as JSON');
        }
      } else {
        console.log('payload (plain text, first 300 chars):', payload.slice(0, 300));
      }
      console.groupEnd();

      // Step 3: PUT content directly to S3 using presigned URL
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: payload,
        headers: { 'Content-Type': contentType },
      });
      if (!putRes.ok) throw new Error(`S3 PUT failed: ${putRes.status}`);
      appToast.success('Knowledge base file updated successfully!');
      // Keep kbFileContents[index] as-is — the edited text IS the up-to-date display content.
      // Update kbOriginalJson so further saves reconstruct correctly from the new structure.
      if (originalJson) {
        try {
          const reparsed = JSON.parse(payload);
          setKbOriginalJson((prev) => ({ ...prev, [index]: reparsed }));
        } catch { /* ignore */ }
      }
      // Switch back to preview so the user can immediately see the updated content
      setKbPreviewMode((prev) => ({ ...prev, [index]: 'preview' }));
      setEditingKbIndex(null);
    } catch (err) {
      console.error('Save KB file error:', err);
      appToast.error('Failed to save file content. Please try again.');
    } finally {
      setSavingKbIndex(null);
    }
  };

  // --- KB search helpers ---
  // Measures the exact pixel Y-offset of a character position inside a textarea
  // using a hidden mirror div that replicates the textarea's layout.
  const getMatchScrollTop = useCallback((ta: HTMLTextAreaElement, matchStart: number): number => {
    const mirror = document.createElement('div');
    const computed = window.getComputedStyle(ta);
    // Copy every layout-relevant style from the textarea
    const props: Array<keyof CSSStyleDeclaration> = [
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
      'wordSpacing', 'textIndent', 'whiteSpace', 'wordWrap', 'wordBreak',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'boxSizing',
    ];
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.overflow = 'auto';
    mirror.style.width = ta.offsetWidth + 'px';
    mirror.style.height = ta.offsetHeight + 'px';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordBreak = 'break-word';
    props.forEach((p) => {
      (mirror.style as any)[p] = computed[p];
    });
    document.body.appendChild(mirror);

    // Text before the match in a span, then a zero-width marker span
    const before = document.createElement('span');
    before.textContent = ta.value.slice(0, matchStart);
    const marker = document.createElement('span');
    marker.textContent = ta.value.slice(matchStart, matchStart + 1) || ' ';
    mirror.appendChild(before);
    mirror.appendChild(marker);

    // The marker's offsetTop inside the mirror equals the match's pixel position
    const matchTop = marker.offsetTop;
    const matchHeight = marker.offsetHeight;
    document.body.removeChild(mirror);

    // Center the match in the textarea viewport
    return Math.max(0, matchTop - ta.clientHeight / 2 + matchHeight / 2);
  }, []);

  // Scrolls textarea to the match, syncs overlay, returns focus to search input
  const applyKbSelection = useCallback((fileIdx: number, matchStart: number, queryLen: number) => {
    const ta = kbTextareaRefs.current[fileIdx];
    if (!ta) return;

    // Manually compute and set the exact scrollTop needed
    const targetScrollTop = getMatchScrollTop(ta, matchStart);
    ta.scrollTop = targetScrollTop;

    // Select the match text (focus with preventScroll so PAGE doesn't jump)
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(matchStart, matchStart + queryLen);

    // Sync overlay
    const overlay = kbOverlayRefs.current[fileIdx];
    if (overlay) overlay.scrollTop = targetScrollTop;

    // Return focus to search input without scrolling the page
    requestAnimationFrame(() => {
      kbSearchInputRefs.current[fileIdx]?.focus({ preventScroll: true });
    });
  }, [getMatchScrollTop]);

  const handleKbSearch = useCallback((fileIdx: number, query: string, content: string) => {
    setKbSearchQuery((prev) => ({ ...prev, [fileIdx]: query }));
    if (!query.trim()) {
      setKbSearchMatches((prev) => ({ ...prev, [fileIdx]: [] }));
      setKbSearchMatchIdx((prev) => ({ ...prev, [fileIdx]: 0 }));
      return;
    }
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const positions: number[] = [];
    let pos = lowerContent.indexOf(lowerQuery);
    while (pos !== -1) {
      positions.push(pos);
      pos = lowerContent.indexOf(lowerQuery, pos + 1);
    }
    setKbSearchMatches((prev) => ({ ...prev, [fileIdx]: positions }));
    // Start at -1 so first Enter/nav goes to match 0
    setKbSearchMatchIdx((prev) => ({ ...prev, [fileIdx]: -1 }));
    // Do NOT auto-jump or steal focus while user is still typing
  }, []);

  const handleKbSearchNav = useCallback((fileIdx: number, dir: 1 | -1) => {
    const matches = kbSearchMatches[fileIdx] ?? [];
    if (matches.length === 0) return;
    const current = kbSearchMatchIdx[fileIdx] ?? -1;
    // If not yet jumped (-1), first nav always goes to 0 (forward) or last (backward)
    const next = current === -1
      ? (dir === 1 ? 0 : matches.length - 1)
      : (current + dir + matches.length) % matches.length;
    setKbSearchMatchIdx((prev) => ({ ...prev, [fileIdx]: next }));
    applyKbSelection(fileIdx, matches[next], (kbSearchQuery[fileIdx] ?? '').length);
    // Return focus to the search input so further nav keys keep working
    setTimeout(() => kbSearchInputRefs.current[fileIdx]?.focus(), 0);
  }, [kbSearchMatches, kbSearchMatchIdx, kbSearchQuery, applyKbSelection]);

  const handleDeleteKbFile = (index: number) => {
    setExistingKbFiles((prev) => prev.filter((_, i) => i !== index));
    // Clean up any related state for this index
    setKbFileContents((prev) => { const n = { ...prev }; delete n[index]; return n; });
    setKbPreviewMode((prev) => { const n = { ...prev }; delete n[index]; return n; });
    setKbOriginalJson((prev) => { const n = { ...prev }; delete n[index]; return n; });
    if (editingKbIndex === index) setEditingKbIndex(null);
    setConfirmDeleteKbIndex(null);
    appToast.success('File removed from knowledge base.');
  };

  const handleAddWebsiteUrl = () => {    setWebsiteUrls((prev) => [...prev, ""]);
  };

  const handleRemoveWebsiteUrl = (index: number) => {
    setWebsiteUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWebsiteUrlChange = (index: number, value: string) => {
    setWebsiteUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };

  const handleAddSocialMediaUrl = () => {
    setSocialMediaUrls((prev) => [...prev, ""]);
  };

  const handleRemoveSocialMediaUrl = (index: number) => {
    setSocialMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSocialMediaUrlChange = (index: number, value: string) => {
    setSocialMediaUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || formData.name.trim() === "") {
      appToast.error("Agent name is required. Please enter a name for your agent.");
      return;
    }

    if (!formData.businessProcess || formData.businessProcess.trim() === "") {
      appToast.error("Business process is required. Please select a business process.");
      return;
    }

    if (!formData.industry || formData.industry.trim() === "") {
      appToast.error("Industry is required. Please select an industry.");
      return;
    }

    if (currentAgent) {
      const loadingToast = appToast.loading("Updating agent...");
      try {
        // Reverse mapping functions - form values to API values
        const personalityToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Friendly': 'friendly',
            'Formal': 'formal',
            'Empathetic': 'empathetic',
            'Persuasive (Sales)': 'persuasive',
            'Reassuring (Support)': 'reassuring',
          };
          return mapping[value] || value?.toLowerCase()?.split(' ')[0] || 'friendly';
        };

        const maxResponseToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Short (50 words)': 'short',
            'Medium (150 words)': 'medium',
            'Long (300 words)': 'long',
          };
          return mapping[value] || 'medium';
        };

        const contextWindowToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Small (4K tokens)': 'small_4k_tokens',
            'Standard (8K tokens)': 'standard_8k_tokens',
            'Large (16K tokens)': 'large_16k_tokens',
          };
          return mapping[value] || 'standard_8k_tokens';
        };

        const guardrailsToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Low': 'low',
            'Medium': 'medium',
            'High': 'high',
          };
          return mapping[value] || 'medium';
        };

        const responseStyleToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Concise': 'concise',
            'Balanced': 'balanced',
            'Detailed': 'detailed',
          };
          return mapping[value] || 'balanced';
        };

        const updateData = {
          name: formData.name,
          company_name: formData.companyName,
          personality: personalityToApi(formData.persona),
          language: formData.languages?.length ? formData.languages : ["en-US"],
          voice: formData.voice,
          voice_speed: formData.voiceSpeed,
          voice_style: formData.voiceStyle,
          voice_instruction: VOICE_STYLE_SP_MAP[formData.voiceStyle] || VOICE_STYLE_SP_MAP['friendly'],
          gender: formData.gender,
          countries: formData.countries?.length ? formData.countries : undefined,
          multilingual_voice: isMultilingualMode ? formData.realtimeVoice : undefined,
          business_process: formData.businessProcess.replace(/-/g, '_'),
          industry: formData.industry.replace(/-/g, '_'),
          sub_industry: formData.subIndustry ? formData.subIndustry.replace(/-/g, '_') : undefined,
          // Send only custom_instructions (System Prompt / Custom Instructions)
          custom_instructions: formData.customInstructions,
          guardrails_level: guardrailsToApi(formData.guardrailsLevel),
          response_style: responseStyleToApi(formData.responseStyle),
          max_response_length: maxResponseToApi(formData.maxResponseLength),
          context_window: contextWindowToApi(formData.contextWindow),
          temperature: formData.temperature,
          website_urls: websiteUrls.filter((url) => url.trim()),
          social_media_urls: socialMediaUrls.filter((url) => url.trim()),
          knowledge_base_file_urls: [...new Set([...existingKbFiles, ...uploadedFileUrls])],
          // Include template data if it exists (firstMessage, keyTalkingPoints, closingScript, etc.)
          ...(templateData && {
            template: {
              name: templateData.name,
              description: templateData.description,
              icon: templateData.icon,
              features: templateData.features || [],
              systemPrompt: templateData.systemPrompt,
              firstMessage: templateData.firstMessage,
              openingScript: templateData.openingScript,
              keyTalkingPoints: templateData.keyTalkingPoints,
              closingScript: templateData.closingScript,
              objections: templateData.objections,
              conversationExamples: templateData.conversationExamples,
            },
          }),
        };

        console.log('Sending update data:', updateData);
        
        await agentAPI.updateAgent(currentAgent.id, updateData);
        appToast.dismiss(loadingToast);
        appToast.success("Agent updated successfully!");
        setIsDirty(false);
        // Refresh the agents list in context so view page shows updated data immediately
        await refreshAgents();
        // Navigate back to view page and signal a refresh
        navigate(`/agents/${currentAgent.id}`, { state: { refreshed: true } });
      } catch (error) {
        appToast.dismiss(loadingToast);
        appToast.error("Failed to update agent. Please try again.");
        console.error("Update agent error:", error);
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  /**
   * Fully regenerates the template (system prompt + all template fields) using the
   * current form values. Called when the user changes business process, industry,
   * sub-industry, or voice style — fields that fundamentally reshape the content.
   */
  const handleRegenerateTemplate = async () => {
    setIsRegeneratingTemplate(true);
    setIsSpGenerating(true);
    const regenToast = appToast.loading('Regenerating template with AI…');
    try {
      const companyName = formData.companyName || currentAgent?.name || 'the Company';

      const agentName = formData.name || prevNameRef.current || 'Assistant';

      const request = {
        companyName,
        businessProcess: formData.businessProcess,
        industry: formData.industry,
        subIndustry: formData.subIndustry || undefined,
        voiceStyle: formData.voiceStyle,
        additionalContext: `The AI employee will be named: ${agentName}`,
      };

      console.log('🔄 Regenerating template with request:', request);

      let freshTemplates = await aiTemplateService.generateTemplates(
        request,
        // When system prompt comes back from background call (call 2), patch customInstructions
        (templates) => {
          // Always clear SP loading when this callback fires — this is the signal that call 2 is done
          setIsSpGenerating(false);
          const sysPrompt = templates[0]?.systemPrompt;
          if (sysPrompt && sysPrompt.trim().length > 100) {
            // Inject the correct voice style into the regenerated system prompt
            const voiceContent = VOICE_STYLE_SP_MAP[formData.voiceStyle] || VOICE_STYLE_SP_MAP['friendly'];
            const withVoice = updateVoiceInstructionsSection(sysPrompt, voiceContent) || sysPrompt;
            setFormData((prev) => ({ ...prev, customInstructions: withVoice }));
          }
        },
      );

      const fresh = freshTemplates[0];
      if (!fresh) throw new Error('No template returned from AI');

      // Normalise: replace whatever AI name the model chose with the user-provided name.
      // The agent name must ONLY come from formData.name — never from the KB.
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const forceAgentName = (text: string | undefined): string => {
        if (!text) return text || '';
        // Match one or more consecutive capitalised words so multi-word names like
        // "Gyan Setuu" are captured atomically — prevents "I'm Gyan" → "I'm Gyan Setuu Setuu".
        const nameGroup = '([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*)';
        return text
          .replace(new RegExp(`\\bI'm ${nameGroup}\\b`, 'g'), `I'm ${agentName}`)
          .replace(new RegExp(`\\bI am ${nameGroup}\\b`, 'g'), `I am ${agentName}`)
          .replace(new RegExp(`\\bThis is ${nameGroup}\\b`, 'g'), `This is ${agentName}`)
          .replace(new RegExp(`\\bYou are ${nameGroup}\\b`, 'g'), `You are ${agentName}`)
          // Also replace whatever name was previously tracked
          .replace(new RegExp(`\\b${escape(prevNameRef.current)}\\b`, 'gi'), agentName);
      };

      // Update templateData with all freshly generated fields
      setTemplateData((prev: any) => ({
        ...(prev || {}),
        ...fresh,
        firstMessage: forceAgentName(fresh.firstMessage) || prev?.firstMessage,
        closingScript: forceAgentName(fresh.closingScript) || prev?.closingScript,
        systemPrompt: forceAgentName(fresh.systemPrompt),
      }));

      // Advance prevNameRef so subsequent renames propagate correctly
      prevNameRef.current = agentName;

      // If system prompt was already in the first batch (some APIs return it synchronously), apply it now.
      // NOTE: We do NOT clear isSpGenerating here — we always wait for the background call 2 callback.
      if (fresh.systemPrompt && fresh.systemPrompt.trim().length > 100) {
        const voiceContent = VOICE_STYLE_SP_MAP[formData.voiceStyle] || VOICE_STYLE_SP_MAP['friendly'];
        const withVoice = updateVoiceInstructionsSection(fresh.systemPrompt, voiceContent) || fresh.systemPrompt;
        setFormData((prev) => ({ ...prev, customInstructions: withVoice }));
        // isSpGenerating stays true — background call 2 will still run and clear it
      }

      // Reset baseline so the dirty banner goes away
      baselineTemplateFieldsRef.current = {
        businessProcess: formData.businessProcess,
        industry: formData.industry,
        subIndustry: formData.subIndustry,
        voiceStyle: formData.voiceStyle,
      };
      setTemplateRegenNeeded(false);
      // Update company name and agent name baselines so the amber warning banners are dismissed
      originalCompanyNameRef.current = formData.companyName;
      originalAgentNameRef.current = formData.name;

      appToast.dismiss(regenToast);
      appToast.success('Template regenerated! Review the changes and save when ready.');
    } catch (err) {
      console.error('Regenerate template error:', err);
      appToast.dismiss(regenToast);
      appToast.error('Failed to regenerate template. Please try again.');
      setIsSpGenerating(false); // clear SP loading on error since background callback won't fire
    } finally {
      setIsRegeneratingTemplate(false);
      // NOTE: isSpGenerating is NOT cleared here — the background SP callback clears it.
      // It is only cleared early in catch (error) or when SP arrives synchronously.
    }
  };

  if (isLoadingAgent || !currentAgent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Loading agent...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-visible">
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
              <button
                onClick={handleCancel}
                className="common-button-bg2 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 touch-manipulation"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-lg sm:rounded-xl">
                  <Bot className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-black dark:text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
                      <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white leading-tight truncate min-w-0">
                        {formData.name || currentAgent.name}
                      </h1>
                      {isDirty ? (
                        <span className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 whitespace-nowrap">
                          Unsaved
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 whitespace-nowrap">
                          Editing
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-3 gap-y-0.5 text-[11px] sm:text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium capitalize">{formData.gender}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="max-w-[80px] sm:max-w-none truncate capitalize">{formData.voice}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[90px] sm:max-w-none text-[11px] sm:text-sm">
                          {formatAgentLanguages((currentAgent as any).language)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
              <button
                onClick={handleCancel}
                className="common-button-bg2 flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl touch-manipulation min-h-[36px] sm:min-h-[40px]"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Cancel</span>
              </button>

              <button
                onClick={handleSave}
                className="common-button-bg flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl touch-manipulation min-h-[36px] sm:min-h-[40px]"
              >
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  Save
                </span>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs - Training Page Style */}
      <GlassCard>
        <div className="">
          <div className="flex space-x-0.5 sm:space-x-1 common-bg-icons rounded-xl px-1.5 sm:px-4 py-1.5 sm:py-3 overflow-x-auto">
            {editTabs?.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "common-button-bg2 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition ease-in-out"
                }`}
              >
                {tab.id === 'settings' && (isRegeneratingTemplate || isSpGenerating) ? (
                  <svg className="w-3 sm:w-4 h-3 sm:h-4 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <tab.icon className="w-3 sm:w-4 h-3 sm:h-4" />
                )}
                <span className="text-[11px] sm:text-sm">{tab.label === 'Template Setting' ? <><span className="hidden sm:inline">Template Setting</span><span className="sm:hidden">Template</span></> : tab.label}</span>
                {tab.id === 'settings' && (isRegeneratingTemplate || isSpGenerating) && (
                  <span className="ml-0.5 text-[10px] font-medium text-violet-500 dark:text-violet-400">
                    {isRegeneratingTemplate ? 'Generating…' : 'SP…'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Regenerate template banner — shown whenever key fields drift from their loaded baseline */}
      {templateRegenNeeded && templateData && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 rounded-xl">
          <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-[11px] sm:text-xs text-violet-800 dark:text-violet-300 leading-snug">
              <strong>Settings changed.</strong>{' '}
              <span className="hidden sm:inline">Regenerate the template so the system prompt, first message, scripts and examples all match your new configuration — no duplication.</span>
              <span className="sm:hidden">Regenerate the template to match your new configuration.</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleRegenerateTemplate}
              disabled={isRegeneratingTemplate}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-[11px] sm:text-xs font-medium rounded-lg transition-colors"
            >
              {isRegeneratingTemplate ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
              {isRegeneratingTemplate ? 'Regenerating…' : 'Regenerate'}
            </button>
            <button
              onClick={() => setTemplateRegenNeeded(false)}
              className="p-1 text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 flex-shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          {/* Identity Tab Content */}
          {activeTab === 'identity' && (
            <GlassCard>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    Identity & Persona
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                  Define your agent's basic identity and personality
                </p>

                <div className="space-y-4 sm:space-y-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                      placeholder="e.g., Acme Corp"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm sm:text-base transition-all duration-200"
                    />
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5">
                      The company this agent represents
                    </p>
                  </div>

                  {/* Agent Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Agent Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Sarah - Customer Support"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm sm:text-base transition-all duration-200"
                    />
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5">
                      This name will be visible to your customers
                    </p>
                  </div>

                  {/* Business Process and Industry */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                        Business Process <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={businessProcesses}
                        value={formData.businessProcess}
                        onChange={(value) =>
                          setFormData({ ...formData, businessProcess: value })
                        }
                        placeholder="Select process..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                        Industry <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={industries}
                        value={formData.industry}
                        onChange={(value) =>
                          setFormData({ ...formData, industry: value, subIndustry: "" })
                        }
                        placeholder="Select industry..."
                      />
                    </div>
                  </div>

                  {/* Sub Industry */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Sub Industry
                    </label>
                    <SearchableSelect
                      options={formData.industry ? (subIndustries[formData.industry] || []) : []}
                      value={formData.subIndustry}
                      onChange={(value) =>
                        setFormData({ ...formData, subIndustry: value })
                      }
                      placeholder={formData.industry ? "Select sub-industry..." : "Select an industry first"}
                      disabled={!formData.industry}
                    />
                    {!formData.industry && (
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5">
                        Please select an industry first to see available sub-industries
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Knowledge Tab Content */}
          {activeTab === 'knowledge' && (
            <GlassCard>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    Knowledge Base
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Upload documents or add URLs to train your AI with company-specific knowledge
                </p>

                <div className="space-y-4 sm:space-y-5">
                  {/* Existing Knowledge Base Files (editable inline) */}
                  {existingKbFiles.length > 0 && (
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Main Knowledge Base
                        <button
                          type="button"
                          onClick={() => setShowKbInfo((v) => !v)}
                          title="How KB updates work"
                          className={`ml-auto p-1 rounded-full transition-colors ${
                            showKbInfo
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                              : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400'
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </label>

                      {/* Collapsible info notice about KB append behaviour */}
                      {showKbInfo && (
                        <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                            <p className="font-semibold">How Knowledge Base updates work</p>
                            <p>When you upload additional documents, the backend <span className="font-medium">appends</span> the new content to your existing knowledge base file — it does <span className="font-medium">not</span> replace it.</p>
                            <p>To fully replace the knowledge base, <span className="font-medium">delete the existing file below</span> before uploading your new documents.</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {existingKbFiles.slice(0, 1).map((fileUrl, index) => {
                          const filename = getDisplayFilename(fileUrl, index);
                          const isEditing = editingKbIndex === index;
                          const isLoading = loadingKbIndex === index;
                          const isSaving = savingKbIndex === index;
                          return (
                            <div key={index} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                              {/* File row */}
                              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-800">
                                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                <span className="flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate" title={fileUrl}>
                                  {filename}
                                </span>
                                {/* Edit Text button */}
                                <button
                                  onClick={() => handleToggleEditKbFile(index, fileUrl)}
                                  disabled={isLoading || isSaving}
                                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    isEditing
                                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                      : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/50'
                                  } disabled:opacity-50`}
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Pencil className="w-3.5 h-3.5" />
                                  )}
                                  <span className="hidden sm:inline">{isEditing ? 'Close Editor' : 'Edit Text'}</span>
                                  <span className="sm:hidden">{isEditing ? 'Close' : 'Edit'}</span>
                                </button>

                                {/* Delete button with confirm */}
                                {confirmDeleteKbIndex === index ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Remove?</span>
                                    <button
                                      onClick={() => handleDeleteKbFile(index)}
                                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteKbIndex(null)}
                                      className="px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteKbIndex(index)}
                                    disabled={isLoading || isSaving}
                                    title="Remove file"
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Inline text editor */}
                              {isEditing && (
                                <div className="border-t border-slate-200 dark:border-slate-700">
                                  {isLoading ? (
                                    <div className="flex items-center justify-center gap-2 p-6 text-slate-500 dark:text-slate-400 text-sm">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Loading file content...
                                    </div>
                                  ) : (
                                    <div className="p-3 space-y-2">
                                      {/* Guideline notice */}
                                      <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                                        <span className="mt-0.5 flex-shrink-0">⚠️</span>
                                        <span>
                                          <strong>Minor edits only.</strong> For major changes, upload a new file instead — editing here replaces the entire document.
                                        </span>
                                      </div>
                                      {/* Edit / Preview tab toggle */}
                                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
                                        <button
                                          onClick={() => setKbPreviewMode((prev) => ({ ...prev, [index]: 'edit' }))}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                            (kbPreviewMode[index] ?? 'edit') === 'edit'
                                              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                          }`}
                                        >
                                          <Code2 className="w-3.5 h-3.5" />
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => setKbPreviewMode((prev) => ({ ...prev, [index]: 'preview' }))}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                            kbPreviewMode[index] === 'preview'
                                              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                          }`}
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          Preview
                                        </button>
                                      </div>

                                      {/* Editor area */}
                                      {(kbPreviewMode[index] ?? 'edit') === 'edit' ? (
                                        <div className="space-y-1.5">
                                          {/* Search bar */}
                                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <input
                                              ref={(el) => { kbSearchInputRefs.current[index] = el; }}
                                              type="text"
                                              placeholder="Search in text... (Enter to jump)"
                                              value={kbSearchQuery[index] ?? ''}
                                              onChange={(e) => handleKbSearch(index, e.target.value, kbFileContents[index] ?? '')}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  handleKbSearchNav(index, e.shiftKey ? -1 : 1);
                                                } else if (e.key === 'Escape') {
                                                  handleKbSearch(index, '', kbFileContents[index] ?? '');
                                                }
                                              }}
                                              className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none min-w-0"
                                            />
                                            {/* Match count */}
                                            {(kbSearchQuery[index] ?? '') && (
                                              <span className={`text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded ${
                                                (kbSearchMatches[index] ?? []).length === 0
                                                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                                  : 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                                              }`}>
                                                {(kbSearchMatches[index] ?? []).length === 0
                                                  ? 'No results'
                                                  : (kbSearchMatchIdx[index] ?? -1) < 0
                                                    ? `${(kbSearchMatches[index] ?? []).length} match${(kbSearchMatches[index] ?? []).length === 1 ? '' : 'es'}`
                                                    : `${(kbSearchMatchIdx[index] ?? 0) + 1} / ${(kbSearchMatches[index] ?? []).length}`}
                                              </span>
                                            )}
                                            {/* Prev / Next */}
                                            <button
                                              onClick={() => handleKbSearchNav(index, -1)}
                                              disabled={!(kbSearchMatches[index] ?? []).length}
                                              title="Previous match (Shift+Enter)"
                                              className="p-0.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
                                            >
                                              <ChevronUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleKbSearchNav(index, 1)}
                                              disabled={!(kbSearchMatches[index] ?? []).length}
                                              title="Next match (Enter)"
                                              className="p-0.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
                                            >
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                            {/* Clear search */}
                                            {(kbSearchQuery[index] ?? '') && (
                                              <button
                                                onClick={() => handleKbSearch(index, '', kbFileContents[index] ?? '')}
                                                title="Clear search (Esc)"
                                                className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>

                                          {/* Textarea with highlight overlay */}
                                          <div className="relative rounded-lg">
                                            {/* Overlay — sits behind textarea, shows coloured highlights */}
                                            <div
                                              ref={(el) => { kbOverlayRefs.current[index] = el; }}
                                              aria-hidden="true"
                                              className="absolute inset-0 overflow-hidden pointer-events-none z-0 px-3 py-2.5 text-xs sm:text-sm font-mono leading-relaxed bg-white dark:bg-slate-900 rounded-lg text-transparent"
                                              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                            >
                                              {renderHighlightedContent(
                                                kbFileContents[index] ?? '',
                                                kbSearchQuery[index] ?? '',
                                                kbSearchMatches[index] ?? [],
                                                kbSearchMatchIdx[index] ?? -1
                                              )}
                                            </div>
                                            {/* Transparent textarea on top */}
                                            <textarea
                                              ref={(el) => { kbTextareaRefs.current[index] = el; }}
                                              value={kbFileContents[index] ?? ''}
                                              onScroll={(e) => {
                                                const overlay = kbOverlayRefs.current[index];
                                                if (overlay) overlay.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
                                              }}
                                              onChange={(e) => {
                                                const newVal = e.target.value;
                                                setKbFileContents((prev) => ({ ...prev, [index]: newVal }));
                                                if (kbSearchQuery[index]) handleKbSearch(index, kbSearchQuery[index], newVal);
                                              }}
                                              onKeyDown={(e) => {
                                                if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                                                  e.preventDefault();
                                                  kbSearchInputRefs.current[index]?.focus({ preventScroll: true });
                                                }
                                              }}
                                              rows={14}
                                              placeholder="Enter knowledge base text content here..."
                                              className="relative z-10 w-full px-3 py-2.5 bg-transparent border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all resize-y min-h-[220px] caret-slate-800 dark:caret-white"
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-full min-h-[220px] max-h-[420px] overflow-y-auto px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg">
                                          <div className="prose prose-sm dark:prose-invert max-w-none
                                            prose-headings:font-semibold prose-headings:text-slate-800 dark:prose-headings:text-white
                                            prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                                            prose-table:w-full prose-table:text-xs prose-table:border-collapse
                                            prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-600
                                            prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-700
                                            prose-tr:even:bg-slate-50 dark:prose-tr:even:bg-slate-800/40
                                            prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5
                                            prose-li:text-slate-700 dark:prose-li:text-slate-300
                                            prose-strong:text-slate-800 dark:prose-strong:text-white
                                            prose-code:text-cyan-600 dark:prose-code:text-cyan-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded
                                          ">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {processKbContent(kbFileContents[index] ?? '')}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                          onClick={() => setEditingKbIndex(null)}
                                          disabled={isSaving}
                                          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleSaveKbFile(index, fileUrl)}
                                          disabled={isSaving}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                          {isSaving ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                                          ) : (
                                            <><Check className="w-3.5 h-3.5" /> Save Changes</>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* File Upload Section */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </label>

                    {/* Drop Zone */}
                    <div
                      className={`border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-800/50 ${isUploadingFiles ? 'opacity-50 pointer-events-none' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!isUploadingFiles) {
                          e.currentTarget.classList.add("border-blue-400", "bg-blue-50/50");
                        }
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("border-blue-400", "bg-blue-50/50");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-blue-400", "bg-blue-50/50");
                        if (!isUploadingFiles) {
                          const files = Array.from(e.dataTransfer.files);
                          handleKnowledgeBaseUpload(files);
                        }
                      }}
                    >
                      <input
                        id="edit-knowledge-file-input"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/gif,image/webp"
                        className="hidden"
                        disabled={isUploadingFiles}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          handleKnowledgeBaseUpload(files);
                          e.target.value = "";
                        }}
                      />
                      {/* Use label for native file input trigger — works reliably on Android */}
                      <label
                        htmlFor={isUploadingFiles ? undefined : "edit-knowledge-file-input"}
                        className="block p-4 sm:p-6 cursor-pointer"
                      >
                      <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                        {isUploadingFiles ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              Uploading files...
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                              <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                              <Image className="w-6 h-6 sm:w-8 sm:h-8" />
                              <File className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              <span className="text-blue-500 font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                              PDF, DOC, TXT, CSV, Excel, Images (max 10MB each)
                            </p>
                          </>
                        )}
                      </div>
                      </label>
                    </div>

                    {/* Hint below upload */}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Info className="w-3 h-3 flex-shrink-0" />
                      New files will be merged into the Main Knowledge Base. To fully replace it, delete the Main Knowledge Base file above first.
                    </p>

                    {/* All existing KB URLs — read-only reference list */}
                    {existingKbFiles.length > 0 && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            Knowledge Base URLs ({existingKbFiles.length})
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-40 overflow-y-auto">
                          {existingKbFiles.map((url, i) => {
                            const filename = url.split('/').pop()?.split('?')[0] || url;
                            return (
                              <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-4 flex-shrink-0">{i + 1}.</span>
                                <span className="flex-1 text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono" title={url}>
                                  {filename}
                                </span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View file"
                                  className="flex-shrink-0 p-1 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-1.5 sm:space-y-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                          >
                            {file.type.includes("image") ? (
                              <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                            ) : file.type.includes("pdf") ? (
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                            ) : (
                              <File className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                            )}
                            <span className="flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate">
                              {file.name}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            {uploadedFileUrls[index] && (
                              <span className="text-[10px] sm:text-xs text-green-500">✓</span>
                            )}
                            <button
                              onClick={() => handleRemoveKnowledgeBaseFile(index)}
                              disabled={isUploadingFiles}
                              className="p-0.5 sm:p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Website URLs Section */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Website URLs
                    </label>
                    {websiteUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleWebsiteUrlChange(index, e.target.value)}
                          placeholder="https://yourcompany.com"
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        />
                        {websiteUrls.length > 1 && (
                          <button
                            onClick={() => handleRemoveWebsiteUrl(index)}
                            className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddWebsiteUrl}
                      className="w-full py-2 sm:py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Add another URL
                    </button>
                  </div>

                  {/* Social Media URLs Section */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Social Media Links
                    </label>
                    {socialMediaUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleSocialMediaUrlChange(index, e.target.value)}
                          placeholder="https://facebook.com/yourpage or https://x.com/yourhandle"
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        />
                        {socialMediaUrls.length > 1 && (
                          <button
                            onClick={() => handleRemoveSocialMediaUrl(index)}
                            className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddSocialMediaUrl}
                      className="w-full py-2 sm:py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Add social media link
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <GlassCard>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    Template Settings
                  </h2>
                </div>

                <div className="space-y-4 sm:space-y-6">
               
{/* 
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Max Response Length
                    </label>
                    <SearchableSelect
                      options={maxResponseOptions}
                      value={formData.maxResponseLength}
                      onChange={(value) =>
                        setFormData({ ...formData, maxResponseLength: value })
                      }
                      placeholder="Select max response length..."
                    />
                  </div> */}

                  {/* Temperature Slider */}
                  {/* <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        Creativity Level
                      </label>
                      <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                        {formData.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>More Focused</span>
                      <span>More Creative</span>
                    </div>
                  </div> */}

              

                  {/* Template Editor Section */}
                  {/* System Prompt / Custom Instructions */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      System Prompt / Custom Instructions
                    </label>
                    <div className="relative">
                      <textarea
                        value={formData.customInstructions}
                        onChange={(e) => {
                          const trimmedValue = e.target.value.slice(0, 10000);
                          setFormData({
                            ...formData,
                            customInstructions: trimmedValue,
                          });
                        }}
                        placeholder="Define the agent's core behavior and role..."
                        rows={16}
                        disabled={isRegeneratingTemplate}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-y min-h-[200px] disabled:opacity-50"
                      />
                      {isRegeneratingTemplate || isSpGenerating ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-slate-50/80 dark:bg-slate-700/80 backdrop-blur-[2px]">
                          <svg className="h-6 w-6 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                            {isRegeneratingTemplate ? 'Generating Template…' : 'Generating System Prompt…'}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <span className={`text-xs font-medium ${
                        formData.customInstructions.length > 9000
                          ? 'text-orange-600 dark:text-orange-400'
                          : formData.customInstructions.length > 9500
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {formData.customInstructions.length}/10000
                      </span>
                    </div>
                  </div>

                  {templateData && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">

                      {/* First Message */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          First Message
                        </label>
                        <textarea
                          value={templateData.firstMessage || ''}
                          onChange={(e) =>
                            setTemplateData({
                              ...templateData,
                              firstMessage: e.target.value,
                            })
                          }
                          placeholder="Initial greeting message..."
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                   

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Key Talking Points
                        </label>
                        <textarea
                          value={templateData.keyTalkingPoints || ''}
                          onChange={(e) =>
                            setTemplateData({
                              ...templateData,
                              keyTalkingPoints: e.target.value,
                            })
                          }
                          placeholder="Important topics to cover..."
                          rows={4}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Closing Script */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Closing Script
                        </label>
                        <textarea
                          value={templateData.closingScript || ''}
                          onChange={(e) =>
                            setTemplateData({
                              ...templateData,
                              closingScript: e.target.value,
                            })
                          }
                          placeholder="How to end conversations professionally..."
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Objections */}
                      {templateData.objections && templateData.objections.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Objection Handling ({templateData.objections.length})
                          </label>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {templateData.objections.map((obj: any, index: number) => (
                              <div
                                key={index}
                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg"
                              >
                                <input
                                  value={obj.objection}
                                  onChange={(e) => {
                                    const updated = [...templateData.objections];
                                    updated[index].objection = e.target.value;
                                    setTemplateData({
                                      ...templateData,
                                      objections: updated,
                                    });
                                  }}
                                  placeholder="Objection..."
                                  className="w-full px-2 py-1.5 mb-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs"
                                />
                                <textarea
                                  value={obj.response}
                                  onChange={(e) => {
                                    const updated = [...templateData.objections];
                                    updated[index].response = e.target.value;
                                    setTemplateData({
                                      ...templateData,
                                      objections: updated,
                                    });
                                  }}
                                  placeholder="Response..."
                                  rows={2}
                                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conversation Examples */}
                      {templateData.conversationExamples && templateData.conversationExamples.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Conversation Examples ({templateData.conversationExamples.length})
                          </label>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {templateData.conversationExamples.map((example: any, index: number) => (
                              <div
                                key={index}
                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg"
                              >
                                <input
                                  value={example.customerInput}
                                  onChange={(e) => {
                                    const updated = [...templateData.conversationExamples];
                                    updated[index].customerInput = e.target.value;
                                    setTemplateData({
                                      ...templateData,
                                      conversationExamples: updated,
                                    });
                                  }}
                                  placeholder="Customer says..."
                                  className="w-full px-2 py-1.5 mb-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs"
                                />
                                <textarea
                                  value={example.expectedResponse}
                                  onChange={(e) => {
                                    const updated = [...templateData.conversationExamples];
                                    updated[index].expectedResponse = e.target.value;
                                    setTemplateData({
                                      ...templateData,
                                      conversationExamples: updated,
                                    });
                                  }}
                                  placeholder="Agent responds..."
                                  rows={2}
                                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Voice Tab Content */}
          {activeTab === 'voice' && (
            <GlassCard>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    Voice & Language
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Configure language and voice settings
                </p>

                <div className="space-y-4">
                  {/* Gender */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {genders.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            const newGender = option.value;
                            const needsMultilingual = isMultilingualLanguage;
                            const newVoice = needsMultilingual
                              ? multilingualVoices[newGender]?.[0] || (newGender === 'female' ? 'Aoede' : 'Puck')
                              : (newGender === 'female' ? 'Achernar' : 'Achird');
                            setFormData({ ...formData, gender: newGender, voice: newVoice });
                          }}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center ${
                            formData.gender === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multilingual Mode */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        Multilingual Mode
                      </label>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">
                        ⭐ Enterprise
                      </span>
                    </div>
                    {!canUseMultilingual && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                        Contact support to enable Multilingual Mode for your account.
                      </p>
                    )}
                    <div className={`rounded-xl border-2 transition-all overflow-hidden ${
                      !canUseMultilingual ? "opacity-50 cursor-not-allowed" : isMultilingualMode ? "border-purple-500" : "border-slate-200 dark:border-slate-700"
                    }`}>
                      <button
                        type="button"
                        disabled={!canUseMultilingual}
                        onClick={() => {
                          if (!canUseMultilingual) return;
                          const isOn = isMultilingualMode;
                          setFormData((prev) => {
                            const newLangs = isOn
                              ? prev.languages.filter((l) => l !== "multilingual")
                              : [...prev.languages, "multilingual"];
                            if (!isOn) {
                              // Enabling multilingual: make sure realtimeVoice is a valid
                              // option for the current gender so the visible pre-selection
                              // matches what actually gets saved in multilingual_voice.
                              const validVoices = realtimeTTSVoices[prev.gender] || realtimeTTSVoices.female;
                              const isCurrentValid = validVoices.some((v) => v.value === prev.realtimeVoice);
                              return {
                                ...prev,
                                languages: newLangs,
                                realtimeVoice: isCurrentValid ? prev.realtimeVoice : validVoices[0].value,
                              };
                            }
                            return { ...prev, languages: newLangs };
                          });
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                          isMultilingualMode
                            ? "bg-purple-50 dark:bg-purple-900/20"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0">🌐</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${
                            isMultilingualMode ? "text-purple-700 dark:text-purple-300" : "text-slate-700 dark:text-slate-200"
                          }`}>Enable Multilingual</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Auto-detect &amp; respond in any language</div>
                        </div>
                        <div className={`w-10 h-5 rounded-full flex-shrink-0 transition-colors relative ${
                          isMultilingualMode ? "bg-purple-500" : "bg-slate-300 dark:bg-slate-600"
                        }`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            isMultilingualMode ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                        </div>
                      </button>
                      {isMultilingualMode && (
                        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900">
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">Voice</span>
                          <select
                            value={formData.realtimeVoice}
                            onChange={(e) => setFormData({ ...formData, realtimeVoice: e.target.value })}
                            className="flex-1 py-1 bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none"
                          >
                            {(realtimeTTSVoices[formData.gender] || realtimeTTSVoices.female).map((v) => (
                              <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Target Countries */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Target Countries
                      <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                    </label>
                    <div className="relative" ref={countryDropdownRef}>
                      {countryDropdownOpen && (
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => { setCountryDropdownOpen(false); setCountrySearch(""); }}
                          aria-hidden="true"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => { setCountryDropdownOpen((p) => !p); setCountrySearch(""); }}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-left text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all flex items-center justify-between gap-2 min-h-[46px]"
                      >
                        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                          {formData.countries.length === 0 ? (
                            <span className="text-slate-400 dark:text-slate-500 text-sm">Select countries...</span>
                          ) : (
                            <>
                              {formData.countries.slice(0, 4).map((code) => {
                                const c = ALL_COUNTRIES.find((x) => x.code === code);
                                return (
                                  <span key={code} className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-full px-2 py-0.5">
                                    <span>{c?.flag}</span>
                                    <span className="truncate max-w-[70px]">{c?.name}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData((prev) => ({ ...prev, countries: prev.countries.filter((x) => x !== code) }));
                                      }}
                                      className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100 leading-none"
                                    >×</button>
                                  </span>
                                );
                              })}
                              {formData.countries.length > 4 && (
                                <span className="inline-flex items-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full px-2 py-0.5">
                                  +{formData.countries.length - 4} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {countryDropdownOpen ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCountryDropdownOpen(false); setCountrySearch(""); }}
                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-500 dark:text-slate-300 transition-colors"
                          >✕</button>
                        ) : (
                          <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        )}
                      </button>
                      {countryDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                            <input
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                            />
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            {ALL_COUNTRIES.filter((c) => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase())).map((country) => {
                              const isSelected = formData.countries.includes(country.code);
                              return (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      countries: isSelected
                                        ? prev.countries.filter((x) => x !== country.code)
                                        : [...prev.countries, country.code],
                                    }));
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                                    isSelected
                                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                  }`}
                                >
                                  <span>{country.flag}</span>
                                  <span className="flex-1 text-left">{country.name}</span>
                                  {isSelected && <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Languages Multi-Select */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Languages
                    </label>
                    <div className="relative" ref={langDropdownRef}>
                      {langDropdownOpen && (
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => { setLangDropdownOpen(false); setLangSearch(""); }}
                          aria-hidden="true"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => { setLangDropdownOpen((p) => !p); setLangSearch(""); }}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-left text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all flex items-center justify-between gap-2 min-h-[46px]"
                      >
                        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                          {formData.languages.filter((l) => l !== "multilingual").length === 0 ? (
                            <span className="text-slate-400 dark:text-slate-500 text-sm">Select languages...</span>
                          ) : (
                            <>
                              {formData.languages.filter((l) => l !== "multilingual").slice(0, 3).map((langVal) => {
                                const langObj = ALL_LANGUAGES.find((l) => l.value === langVal);
                                return (
                                  <span key={langVal} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-0.5">
                                    <span>{langObj?.flag}</span>
                                    <span className="truncate max-w-[80px]">{langObj?.label.split(" (")[0]}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData((prev) => ({
                                          ...prev,
                                          languages: prev.languages.filter((x) => x !== langVal),
                                        }));
                                      }}
                                      className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100 leading-none"
                                    >×</button>
                                  </span>
                                );
                              })}
                              {formData.languages.filter((l) => l !== "multilingual").length > 3 && (
                                <span className="inline-flex items-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full px-2 py-0.5">
                                  +{formData.languages.filter((l) => l !== "multilingual").length - 3} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {langDropdownOpen ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setLangDropdownOpen(false); setLangSearch(""); }}
                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-500 dark:text-slate-300 transition-colors"
                          >✕</button>
                        ) : (
                          <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        )}
                      </button>
                      {langDropdownOpen && (() => {
                        const selectedCountries = formData.countries;
                        const filteredLangs = selectedCountries.length === 0
                          ? ALL_LANGUAGES
                          : ALL_LANGUAGES.filter((l) => l.countryCodes.some((cc) => selectedCountries.includes(cc)));
                        const searchedLangs = !langSearch
                          ? filteredLangs
                          : filteredLangs.filter((l) => l.label.toLowerCase().includes(langSearch.toLowerCase()));
                        return (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                              <input
                                type="text"
                                placeholder="Search languages..."
                                value={langSearch}
                                onChange={(e) => setLangSearch(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                              />
                            </div>
                            <div className="overflow-y-auto max-h-52">
                              {searchedLangs.map((lang) => {
                                const isSelected = formData.languages.includes(lang.value);
                                return (
                                  <button
                                    key={lang.value}
                                    type="button"
                                    onClick={() => {
                                      const hasNonEnglish = !englishOnlyLanguages.includes(lang.value);
                                      setFormData((prev) => {
                                        const newLangs = isSelected
                                          ? prev.languages.filter((x) => x !== lang.value)
                                          : [...prev.languages, lang.value];
                                        let newVoice = prev.voice;
                                        if (hasNonEnglish && !isSelected && !(multilingualVoices[prev.gender] || []).includes(prev.voice)) {
                                          newVoice = multilingualVoices[prev.gender]?.[0] || prev.voice;
                                        }
                                        return { ...prev, languages: newLangs, voice: newVoice };
                                      });
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                                      isSelected
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    }`}
                                  >
                                    <span>{lang.flag}</span>
                                    <span className="flex-1 text-left">{lang.label}</span>
                                    {isSelected && <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                            {formData.languages.filter((l) => l !== "multilingual").length > 0 && (
                              <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <span className="text-xs text-slate-500">{formData.languages.filter((l) => l !== "multilingual").length} selected</span>
                                <button
                                  type="button"
                                  onClick={() => setFormData((prev) => ({ ...prev, languages: prev.languages.filter((l) => l === "multilingual") }))}
                                  className="text-xs text-red-500 hover:text-red-600"
                                >Clear all</button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Voice Type */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Voice Type
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.voice}
                        onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                      >
                        {getFilteredVoiceOptions(formData.gender).map((voice) => (
                          <option key={voice.value} value={voice.value}>{voice.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isLoadingVoicePreview}
                        onClick={() => {
                          if (isTestingVoice) {
                            stopVoicePreview();
                          } else {
                            previewGeminiVoice(formData.voice);
                          }
                        }}
                        className={`px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                          isLoadingVoicePreview
                            ? 'bg-slate-400 dark:bg-slate-600 text-white cursor-not-allowed'
                            : isTestingVoice
                            ? 'bg-red-500 hover:bg-red-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                            : 'common-button-bg hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                      >
                        {isLoadingVoicePreview ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span className="hidden sm:inline">Loading</span>
                          </>
                        ) : isTestingVoice ? (
                          <>
                            <Square className="w-4 h-4" />
                            <span className="hidden sm:inline">Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span className="hidden sm:inline">Test</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Choose a voice that matches your brand personality
                    </p>
                  </div>

                  {/* Voice Style */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Voice Style
                    </label>
                    <select
                      value={formData.voiceStyle}
                      onChange={(e) => {
                        voiceStyleDirtyRef.current = true;
                        setFormData({ ...formData, voiceStyle: e.target.value });
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                    >
                      <option value="friendly">Friendly - Warm &amp; approachable</option>
                      <option value="professional">Professional - Business-like &amp; formal</option>
                      <option value="casual">Casual - Relaxed &amp; conversational</option>
                      <option value="authoritative">Authoritative - Confident &amp; commanding</option>
                      <option value="empathetic">Empathetic - Understanding &amp; supportive</option>
                      <option value="enthusiastic">Enthusiastic - Energetic &amp; upbeat</option>
                    </select>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Set the personality tone for your AI assistant
                    </p>
                  </div>

                  {/* Voice Speed */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        Voice Speed
                      </label>
                      <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                        {formData.voiceSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={formData.voiceSpeed}
                      onChange={(e) =>
                        setFormData({ ...formData, voiceSpeed: parseFloat(e.target.value) })
                      }
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, #2563eb ${((formData.voiceSpeed - 0.5) / (2.0 - 0.5)) * 100}%, #e2e8f0 ${((formData.voiceSpeed - 0.5) / (2.0 - 0.5)) * 100}%)`,
                      }}
                    />
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                      <span>Slower (0.5x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Faster (2.0x)</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar - Tips Card */}
        <div className="space-y-4 sm:space-y-6">
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Tips for Better Performance
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Use clear, concise custom instructions for best results
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Test different personality types to match your brand voice
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Lower creativity for factual responses, higher for creative tasks
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default EditAgent;
