import axios from "axios";

const PROMPT_GENERATION_API =
  import.meta.env.VITE_API_BASE_URL + "/generate-prompt/generate";

// Create a dedicated axios instance for prompt generation API
const promptClient = axios.create({
  timeout: 90000, // 90 seconds for comprehensive template generation
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
promptClient.interceptors.request.use((config) => {
  const tokens = localStorage.getItem("auth_tokens");
  if (tokens) {
    try {
      const { accessToken } = JSON.parse(tokens);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.warn("Failed to parse auth tokens:", error);
    }
  }
  return config;
});

// Response interceptor to handle errors
promptClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_tokens");
      window.location.href = "/landing";
    }
    return Promise.reject(error);
  },
);

export interface GeneratedTemplate {
  // Basic Info
  name: string;
  description: string;
  icon: string;
  features: string[];

  // Agent Settings
  systemPrompt?: string;
  firstMessage?: string;
  industryFocus?: string;
  language?: string;
  tone?: string;
  gender?: string; // "male" or "female" - API compatible
  voice?: string; // One of: alloy, echo, fable, onyx, nova, shimmer, sage - API compatible
  personality?: string;
  temperature?: number; // 0-1 scale - API compatible
  guardrailsLevel?: string; // "low", "medium", "high" - API compatible

  // Knowledge & Training
  manualKnowledge?: string;
  websiteUrls?: string[];

  // Call Scripts
  keyTalkingPoints?: string;
  closingScript?: string;

  // Training Data
  objections?: Array<{ objection: string; response: string }>;
  conversationExamples?: Array<{
    customerInput: string;
    expectedResponse: string;
  }>;
  intents?: Array<{ name: string; phrases: string; response: string }>;
}

export interface GenerateTemplateRequest {
  companyName: string;
  businessProcess: string;
  industry: string;
  subIndustry?: string;
  websiteUrls?: string[];
  additionalContext?: string;
  extractedContent?: string; // Extracted text from uploaded files (PDFs, docs, etc.)
  voiceStyle?: string; // e.g. friendly, professional, casual, authoritative, empathetic, enthusiastic
}

interface PromptGenerationData {
  generation?: {
    finish_reason: string;
    model: string;
    response: string;
  };
  response?: string;
}

interface PromptGenerationResponse {
  success: boolean;
  data: PromptGenerationData;
  message?: string;
  statusCode?: number;
}

class AITemplateService {
  /**
   * Generate template recommendations using AI based on user input.
   * Returns metadata templates immediately after the first API call completes.
   * System prompts are generated in the background — onSystemPromptsReady is
   * called with an updated snapshot each time a system prompt finishes.
   */
  async generateTemplates(
    request: GenerateTemplateRequest,
    onSystemPromptsReady?: (templates: GeneratedTemplate[]) => void,
  ): Promise<GeneratedTemplate[]> {
    // ── Step 1: Metadata call (fast, JSON only) ─────────────────────────────
    const prompt = this.buildPrompt(request);
    console.log("📝 Generating templates, prompt preview:", prompt.substring(0, 100) + "...");

    const response = await promptClient.post<PromptGenerationResponse>(
      PROMPT_GENERATION_API,
      { prompt, max_tokens: 4000, temperature: 0.7 },
    );

    const generatedText = this.extractGeneratedText(response.data);
    if (!generatedText) throw new Error("No text generated from API");

    let templates = this.parseGeneratedTemplates(generatedText);
    if (templates.length === 0) throw new Error("Failed to parse templates from API response");

    if (templates.length > 2) templates = templates.slice(0, 2);
    if (templates.length < 2) {
      templates.push(this.generateComplementaryTemplate(templates[0], request));
    }

    console.log("✅ Metadata ready:", templates.map((t) => t.name));

    // ── Step 2: Fire system prompt generation in the background ─────────────
    const employeeNameMatch = request.additionalContext?.match(/The AI employee will be named:\s*(.+)/i);
    const employeeName = employeeNameMatch
      ? employeeNameMatch[1].trim()
      : request.companyName ? `${request.companyName} Assistant` : "[AI Employee Name]";
    const companyName = request.companyName || "[Company Name]";

    if (onSystemPromptsReady) {
      const bgTemplates = templates.map((t) => ({ ...t }));
      Promise.allSettled(
        bgTemplates.map((template, i) =>
          this.generateSystemPromptForTemplate(
            template.name,
            template.description,
            companyName,
            employeeName,
            request.industry,
            request.businessProcess,
            template.manualKnowledge,
            request.subIndustry,
            request.voiceStyle,
          ).then((sysPrompt) => {
            if (sysPrompt.trim().length > 100) {
              bgTemplates[i] = { ...bgTemplates[i], systemPrompt: sysPrompt };
              console.log(`✅ [BG] System prompt ready — template ${i + 1}`);
              onSystemPromptsReady([...bgTemplates]);
            }
          })
        )
      ).catch((e) => console.warn("⚠️ [BG] System prompt background error:", e));
    }
    // ────────────────────────────────────────────────────────────────────────

    // Return metadata immediately — loading is done, UI can proceed
    return templates;
  }

  /**
   * Build a detailed prompt for the AI model based on user inputs
   */
  private buildPrompt(request: GenerateTemplateRequest): string {
    const urlContent = request.websiteUrls?.length
      ? `\nWebsite URLs for context: ${request.websiteUrls.join(", ")}`
      : "";

    const subIndustryContent = request.subIndustry
      ? `\nSub-industry: ${request.subIndustry}`
      : "";

    // High-quality example demonstrating voice-AI optimized system prompt format
    const exampleTemplates = `[
  {
    "name": "Limousine Reservations Specialist",
    "description": "Handles new ride bookings, airport transportation, hourly chauffeur services, and existing reservation management with a professional and natural phone conversation style.",
    "icon": "🚗",
    "features": ["New Ride Reservations", "Airport Pickup Coordination", "Booking Modifications", "Vehicle Recommendation"],
    "systemPrompt": "Identity\\nYou are Linda, a professional reservations and customer service specialist working for Blackrock Limo, a luxury chauffeur and limousine service based in Fremont, California serving the San Francisco Bay Area.\\n\\nYour job is to help callers with:\\n• New ride reservations\\n• Airport transportation bookings\\n• Hourly chauffeur services\\n• Event transportation\\n• Managing or modifying existing bookings\\n• Answering general service questions\\n\\nYou behave like a highly experienced reservations employee who understands limousine operations, scheduling, and customer service. Your goal is to book rides accurately, assist customers efficiently, and ensure every caller feels helped and respected.\\n\\nVoice & Human Conversation Style\\nSound natural, conversational, and human. Speak the way a calm and helpful customer service professional would speak on the phone.\\n\\nUse natural phrases such as:\\n- \\"Sure, I can help with that.\\"\\n- \\"Let me get a few details from you.\\"\\n- \\"Just to confirm…\\"\\n- \\"Give me one moment while I check that.\\"\\n- \\"Perfect, I've got that.\\"\\n\\nDo not speak in long paragraphs. Use short, natural sentences. Avoid sounding robotic or scripted. Maintain a friendly and confident tone throughout the call.\\n\\nCore Responsibilities\\n1. New Reservations\\nCollect step by step: customer name, phone number, pickup date, pickup time, pickup location, drop-off destination, number of passengers, luggage amount, vehicle preference.\\nAlways confirm the details clearly before finalizing.\\n\\n2. Managing Existing Reservations\\nLocate booking using: customer name, phone number, or reservation number.\\nAssist with: changing pickup time, updating locations, adding stops, changing vehicle type, cancelling.\\nAlways confirm updated details with the caller.\\n\\n3. Answering Service Questions\\nAnswer questions about airport pickups, vehicle types, pricing estimates, availability, and service areas.\\nIf exact pricing or availability cannot be confirmed, explain that final confirmation will be provided by dispatch.\\n\\nNatural Call Flow\\n1. Friendly greeting\\n2. Understand what the caller needs\\n3. Ask for required booking details one at a time\\n4. Confirm the information\\n5. Provide next steps or confirmation\\n\\nExample greeting: \\"Thank you for calling Blackrock Limo, this is Linda. How can I help you today?\\"\\n\\nHuman Conversation Behavior\\nListen carefully. Customers often speak casually or give incomplete information — ask simple follow-up questions.\\n\\nExample:\\nCaller: \\"I need a ride to SFO tomorrow.\\"\\nResponse: \\"Sure, what time would you like to be picked up?\\"\\n\\nDo not interrupt. Do not rush the caller. Guide the conversation smoothly.\\n\\nAirport Booking Awareness\\nFor airport pickups collect: airport name, airline, flight number, arrival time, passenger count, luggage amount.\\nExplain that flights are monitored and pickup times adjust if flights are delayed.\\n\\nVehicle Recommendation Logic\\n1–3 passengers → Luxury Sedan\\n3–6 passengers → SUV\\n6–10 passengers → Stretch Limousine\\n10–14 passengers → Executive Van\\nConsider luggage before recommending.\\n\\nWhen to Escalate\\nTransfer or escalate if: customer requests a custom quote, large group or multiple vehicles required, complaint or dispute, payment or billing issue, unusual request.\\nUse: \\"Let me connect you with our dispatch team so they can assist you further.\\"",
    "firstMessage": "Thank you for calling Blackrock Limo, this is Linda. How can I help you today?",
    "industryFocus": "Automotive, Hospitality, Transportation",
    "tone": "Professional & Conversational",
    "gender": "Female",
    "voice": "nova",
    "personality": "Confident, Friendly, Experienced",
    "manualKnowledge": "Blackrock Limo is a luxury chauffeur and limousine service based in Fremont, California. Serves the San Francisco Bay Area. Vehicles: Luxury Sedan (1–3 pax), SUV (3–6 pax), Stretch Limousine (6–10 pax), Executive Van (10–14 pax). Services: airport pickups, corporate transfers, event transportation, hourly chauffeur. Flights are monitored — pickup adjusts for delays.",
    "keyTalkingPoints": "• Collect full booking details step by step\n• Recommend vehicle based on passenger count and luggage\n• Monitor flights for airport pickups\n• Confirm all details before finalizing\n• Escalate custom quotes to dispatch",
    "closingScript": "Your reservation is confirmed. Is there anything else I can help you with? Thank you for choosing Blackrock Limo.",
    "objections": [
      {"objection": "How much does it cost?", "response": "Pricing depends on the trip details. Let me get your route and I can give you a better estimate, or our dispatch team can provide a final quote."},
      {"objection": "Can you guarantee the driver will be on time?", "response": "Absolutely. Our drivers arrive early and for airport pickups we monitor your flight in real time so the timing always adjusts if needed."}
    ],
    "conversationExamples": [
      {"customerInput": "I need a ride to SFO tomorrow morning.", "expectedResponse": "Sure, what time would you like to be picked up, and where are we picking you up from?"},
      {"customerInput": "I want to change my pickup time.", "expectedResponse": "Of course. Can I get your name or reservation number so I can pull up your booking?"}
    ],
    "intents": [
      {"name": "New Reservation", "phrases": "book a ride, need a car, schedule a pickup, reservation", "response": "I can help you book that. Let me get a few details."},
      {"name": "Modify Booking", "phrases": "change my booking, update pickup, reschedule", "response": "Sure, let me pull up your reservation. Can I get your name or booking number?"},
      {"name": "Airport Pickup", "phrases": "airport, SFO, OAK, SJC, flight", "response": "For airport pickups I'll need your airline and flight number so we can monitor your arrival."}
    ]
  }
]`;

    // Build the prompt - if we have knowledge base content, structure it differently
    if (request.extractedContent && request.extractedContent.trim().length > 100) {
      // KNOWLEDGE BASE FIRST APPROACH
      const kbContent = request.extractedContent.substring(0, 12000);
      
      // Extract AI employee name from additionalContext
      const employeeNameMatch = request.additionalContext?.match(/The AI employee will be named:\s*(.+)/i);
      const employeeName = employeeNameMatch ? employeeNameMatch[1].trim() : (request.companyName ? `${request.companyName} Assistant` : '[AI Employee Name]');
      const companyFallback = request.companyName || '[Company Name]';

      return `You are an AI that creates AI Employee templates by EXTRACTING information from company documents.

═══════════════════════════════════════════════════════════════════
STEP 1: ANALYZE THIS COMPANY DOCUMENT (PRIMARY SOURCE)
═══════════════════════════════════════════════════════════════════
${kbContent}
═══════════════════════════════════════════════════════════════════

STEP 2: EXTRACT THESE KEY FACTS FROM THE DOCUMENT ABOVE:
- What is the EXACT company/organization name mentioned? If NOT found, use: ${companyFallback}
- What industry/business type is this?
- What services/products do they offer (with exact names and pricing if available)?
- Any policies, procedures, or FAQs?
- Contact information, hours, locations?

🔴 MANDATORY IDENTITY RULES (NON-NEGOTIABLE):
1. AI Employee Name: "${employeeName}" — Use this EXACT name in every systemPrompt and firstMessage. Never use a placeholder like [AI Employee Name].
2. Company Name: Extract from document above. If not found, use "${companyFallback}". Never use a placeholder like [Company Name].
3. All services, products, and pricing MUST come from the document — never use generic or made-up content.

FALLBACK VALUES (only if truly not in document):
- Business Process: ${request.businessProcess}
- Industry: ${request.industry}${subIndustryContent}${urlContent}
${request.additionalContext ? `- Additional Context: ${request.additionalContext}` : ''}

STEP 3: GENERATE EXACTLY 2 DISTINCT TEMPLATES

Both templates MUST:
- Use the EXACT AI employee name "${employeeName}" (not a placeholder)
- Use the ACTUAL company name extracted from the document
- Be based on REAL services/products from the document
- Have different focuses (e.g., Template 1: primary customer service, Template 2: sales/lead-gen or specialized support)
- Include comprehensive system prompts with REAL company-specific knowledge

Each template MUST have ALL of these fields:
- name: Unique professional name for the AI Employee role
- description: 2-3 sentences using ACTUAL company info from document
- icon: Appropriate emoji
- features: 3-4 features based on ACTUAL company services
- systemPrompt: SHORT 2-3 sentence role summary only (e.g. "You are Linda, a reservations specialist for Blackrock Limo. You help callers book rides, manage existing reservations, and answer service questions."). The full detailed prompt is generated separately — do NOT write a long system prompt here.
- firstMessage: Opening greeting using the exact name "${employeeName}" and the ACTUAL company name
- industryFocus: Based on document content
- tone, gender, voice, personality: Appropriate values
- manualKnowledge: COPY relevant facts, services, and policies directly from document (be thorough)
- keyTalkingPoints: Based on actual company services
- closingScript: Professional closing with actual company name
- objections: 2-3 objections based on actual services/policies from document
- conversationExamples: 2-3 examples using REAL services/products
- intents: 2-3 intents relevant to actual company offerings

Return ONLY a valid JSON array with EXACTLY 2 template objects. No markdown, no explanation.

Example format: ${exampleTemplates}`;
    }
    
    // Extract AI employee name from additionalContext for standard prompt
    const stdEmployeeNameMatch = request.additionalContext?.match(/The AI employee will be named:\s*(.+)/i);
    const stdEmployeeName = stdEmployeeNameMatch ? stdEmployeeNameMatch[1].trim() : (request.companyName ? `${request.companyName} Assistant` : '[AI Employee Name]');
    const stdCompanyName = request.companyName || '[Company Name]';

    // Standard prompt without knowledge base
    const prompt = `You are an AI assistant that creates professional AI Employee templates for businesses.

🔴 MANDATORY IDENTITY (USE EXACTLY AS GIVEN — NO PLACEHOLDERS):
- AI Employee Name: "${stdEmployeeName}" — Always use this exact name. Never use [AI Employee Name].
- Company Name: "${stdCompanyName}" — Always use this exact name. Never use [Company Name].

Business Information:
- Company Name: ${stdCompanyName}
- Business Process: ${request.businessProcess}
- Industry: ${request.industry}${subIndustryContent}${urlContent}
${request.additionalContext ? `- Additional Context: ${request.additionalContext}` : ''}

Generate EXACTLY 2 DISTINCT AI Employee templates in JSON format.

CRITICAL INSTRUCTIONS:
1. ALWAYS use the exact AI Employee Name "${stdEmployeeName}" in firstMessage and all scripts.
2. ALWAYS use the exact Company Name "${stdCompanyName}" everywhere — never use [Company Name] placeholder.
3. Both templates must be DIFFERENT in focus (e.g., Template 1: customer service, Template 2: sales/appointment-setting).
4. For systemPrompt: write a SHORT 2-3 sentence role summary ONLY (e.g. "You are ${stdEmployeeName}, a customer service specialist for ${stdCompanyName}. You handle customer inquiries, resolve issues, and book appointments."). The full detailed system prompt is generated in a separate step — do NOT write a long system prompt here.
5. Do NOT use generic placeholders anywhere — all content must be specific and realistic.

For each template provide these JSON fields:
- name, description, icon, features (array)
- systemPrompt (comprehensive, NO placeholders)
- firstMessage (use exact name "${stdEmployeeName}" and company "${stdCompanyName}")
- industryFocus, tone, gender, voice, personality
- manualKnowledge (realistic industry knowledge content)
- keyTalkingPoints, closingScript
- objections (array of {objection, response})
- conversationExamples (array of {customerInput, expectedResponse})
- intents (array of {name, phrases, response})

Return ONLY a valid JSON array with EXACTLY 2 objects. No markdown, no explanation.

Example format: ${exampleTemplates}`;

    return prompt;
  }

  /**
   * Generate a detailed, voice-AI-optimized system prompt for a given template via a separate API call.
   * Called individually per template after initial metadata generation.
   */
  /**
   * Maps a voice style value to detailed voice instruction guidelines.
   */
  private getVoiceStyleInstructions(voiceStyle?: string): string {
    const styleMap: Record<string, string> = {
      friendly:
        "Speak in a warm, welcoming, and approachable manner. Use casual but professional language. Express genuine care for the caller. Open with energy and positivity. Use phrases like \"Great to hear from you!\", \"Happy to help!\", \"Of course!\". Smile through your voice — let enthusiasm be naturally audible.",
      professional:
        "Maintain a formal, business-like tone at all times. Use precise, concise language. Avoid slang, filler words, and overly casual phrases. Project confidence and authority. Use phrases like \"Certainly\", \"Absolutely\", \"Allow me to assist you with that\". Keep responses structured and to the point.",
      casual:
        "Speak in a relaxed, laid-back, conversational style. Contractions are welcome — say \"I'll\" not \"I will\". Keep it light and easy. Avoid corporate-sounding phrases. Use everyday language. Treat the caller like a friend you're helping out. Phrases like \"No worries!\", \"Sure thing!\", \"Let me check that out for you\" fit perfectly.",
      authoritative:
        "Speak with confidence and clarity. Use assertive, direct statements. Avoid hedging words like \"maybe\", \"possibly\", \"I think\". Project expertise and decisiveness. Callers should feel they are speaking to an expert who knows exactly what they're talking about. Use phrases like \"Here's what we'll do\", \"The right approach is\", \"I can confirm that\".",
      empathetic:
        "Lead with empathy and emotional awareness. Always acknowledge the caller's feelings before diving into solutions. Validate concerns with phrases like \"I completely understand\", \"I'm sorry you experienced that\", \"That must be frustrating — let me help\".. Keep your voice calm, soft, and reassuring throughout. Never rush the caller. Create a safe space where they feel heard.",
      enthusiastic:
        "Bring high energy and genuine excitement to every call. Be upbeat, positive, and motivating. Use positive reinforcement often — \"That's a great choice!\", \"Absolutely!\", \"You're going to love this!\". Keep the energy up without being overwhelming. Make the caller feel excited about the interaction and the outcome.",
    };
    const style = (voiceStyle || "friendly").toLowerCase();
    return styleMap[style] || styleMap["friendly"];
  }

  async generateSystemPromptForTemplate(
    templateName: string,
    description: string,
    companyName: string,
    employeeName: string,
    industry: string,
    businessProcess: string,
    manualKnowledge?: string,
    subIndustry?: string,
    _voiceStyle?: string, // reserved — Voice Instructions are injected externally
  ): Promise<string> {
    const subLine = subIndustry ? `\nSub-industry: ${subIndustry}` : "";
    const kbSection = manualKnowledge?.trim()
      ? `\n\nCompany-specific knowledge to incorporate:\n${manualKnowledge.substring(0, 3000)}`
      : "";

    const prompt = `You are an expert AI voice agent prompt engineer. Generate a comprehensive, production-quality system prompt for a voice-based AI employee.

Agent Details:
- AI Employee Name: "${employeeName}" (use this exact name, never a placeholder)
- Company: "${companyName}" (use this exact name, never a placeholder)
- Role: ${templateName}
- Description: ${description}
- Industry: ${industry}${subLine}
- Business Process: ${businessProcess}${kbSection}

Requirements:
1. Sound like the agent was written by a senior conversation designer — not a template filler
2. Write for VOICE, not text. Short spoken sentences. Natural phone conversation flow.
3. Use real, specific examples of caller interactions (not generic placeholders)
4. Include natural phrases like "Sure, I can help with that", "Let me get a few details", "Just to confirm…"
5. Never use robotic language or long paragraphs
6. The agent should sound experienced, confident, and human

⛔ IMPORTANT: Do NOT include a "Voice Instructions" section. This section is managed externally and will be injected automatically — any Voice Instructions content you write will be discarded and replaced.

Write the system prompt using EXACTLY these sections in this order:

Identity
[Who the agent is, what they do, who they work for, and their primary goal]

Voice & Human Conversation Style
[How they sound on the phone — natural, conversational phrases to use, what to avoid]

Core Responsibilities
[Numbered list of the main things they handle, with step-by-step data collection where relevant]

Natural Call Flow
[Typical structure of a call from greeting to wrap-up, with an example greeting line]

Human Conversation Behavior
[How to handle casual/incomplete information from callers, with a real caller/response example]

Scenario Handling
[3–4 specific, realistic scenarios with step-by-step handling for each]

Company Knowledge
[Key facts, services, policies, and any info the agent should know — be specific to the business]

When to Escalate
[Exact conditions for escalation and natural transition phrase to use]

Communication Rules
[Dos and don'ts for how to communicate on every call]

Return ONLY the system prompt text. No JSON, no markdown code blocks, no explanation.`;

    const response = await promptClient.post<PromptGenerationResponse>(
      PROMPT_GENERATION_API,
      {
        prompt,
        max_tokens: 4000,
        temperature: 0.65,
      },
    );

    return this.extractGeneratedText(response.data) || "";
  }

  /**
   * Extract generated text from various response formats with logging
   */
  private extractGeneratedText(responseData: PromptGenerationResponse): string {
    console.log("🔎 Extracting text from response, data structure:", {
      hasData: !!responseData.data,
      hasGeneration: !!responseData.data?.generation,
      hasResponse: !!responseData.data?.response,
      hasDataResponse: !!responseData.data?.generation?.response,
    });

    // Handle nested response structure from the API
    if (responseData.data) {
      // Check if data has generation.response (primary format)
      if (responseData.data.generation?.response) {
        console.log("✅ Found response in data.generation.response");
        return responseData.data.generation.response;
      }
      // Check if data has response directly
      if (responseData.data.response) {
        console.log("✅ Found response in data.response");
        return responseData.data.response;
      }
      // Check if data itself is a string (fallback)
      if (typeof responseData.data === "string") {
        console.log("✅ Found response as string in data");
        return responseData.data;
      }
    }

    // Last resort - log the actual structure for debugging
    console.warn(
      "⚠️ Could not extract text using standard paths. Response structure:",
      JSON.stringify(responseData).substring(0, 500),
    );
    return "";
  }

  /**
   * Parse the AI-generated text into template objects with aggressive error recovery
   */
  private parseGeneratedTemplates(text: string): GeneratedTemplate[] {
    try {
      // Remove markdown code block wrapper if present (```json ... ```)
      let cleanText = text
        .replace(/^```json\s*\n?/, "") // Remove opening ```json
        .replace(/^```\s*\n?/, "") // Remove opening ```
        .replace(/\n?```\s*$/, ""); // Remove closing ```

      console.log("🔍 Parsing template response, length:", cleanText.length);
      console.log("📄 First 300 chars:", cleanText.substring(0, 300));

      // Strategy 1: Try to extract complete JSON array
      let jsonMatch = cleanText.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        console.warn(
          "⚠️ No complete JSON array found, attempting aggressive recovery...",
        );

        // Find the start of the JSON array
        const arrayStart = cleanText.indexOf("[");
        if (arrayStart === -1) {
          console.error("❌ No JSON array start '[' found");
          return [];
        }

        // Extract from array start onward
        cleanText = cleanText.substring(arrayStart);
        console.log(
          "📍 Found array start at position, total length:",
          cleanText.length,
        );

        // Strategy 2: Intelligently close incomplete structures
        cleanText = this.repairIncompleteJSON(cleanText);
        console.log("🔧 Repaired JSON, new length:", cleanText.length);
      }

      // Parse the JSON
      let templates;
      try {
        const textToParse = jsonMatch ? jsonMatch[0] : cleanText;
        console.log(
          "📤 Attempting to parse JSON of length:",
          textToParse.length,
        );
        templates = JSON.parse(textToParse);
      } catch (parseError) {
        console.error(
          "❌ JSON parse error:",
          parseError instanceof Error ? parseError.message : parseError,
        );
        console.log(
          "📄 Failed to parse text (last 300 chars):",
          cleanText.substring(cleanText.length - 300),
        );

        // Last resort: Try to parse what we can
        console.log("🆘 Attempting fallback parsing...");
        return this.fallbackParsing(cleanText);
      }

      // Validate it's an array
      if (!Array.isArray(templates)) {
        console.warn("⚠️ Parsed data is not an array, wrapping it");
        templates = [templates];
      }

      console.log("✅ Successfully parsed", templates.length, "templates");
      templates.forEach((t, i) =>
        console.log(`  ${i + 1}. ${t?.name || "Unknown"}`),
      );

      return templates.map((template: any) => ({
        // Basic Info
        name: template.name || "Unnamed Template",
        description: template.description || "",
        icon: template.icon || "🤖",
        features: Array.isArray(template.features)
          ? template.features
          : ["AI-powered assistance"],

        // Agent Settings
        systemPrompt: template.systemPrompt || "",
        firstMessage:
          template.firstMessage || "Hello! I am [AI Employee Name] from [Company Name], here to assist you. How can I help you today?",
        industryFocus: template.industryFocus || "",
        tone: template.tone || "Professional",
        gender: template.gender || "Not Specified",
        voice: template.voice || "Professional",
        personality: template.personality || "Helpful",

        // Knowledge & Training
        manualKnowledge: template.manualKnowledge || "",
        websiteUrls: Array.isArray(template.websiteUrls)
          ? template.websiteUrls
          : [],

        // Call Scripts
        keyTalkingPoints:
          template.keyTalkingPoints ||
          "• Quality service is our priority\n• We're here to help",
        closingScript:
          template.closingScript ||
          "Thank you for contacting us. Have a great day!",

        // Training Data
        objections: Array.isArray(template.objections)
          ? template.objections
          : [],
        conversationExamples: Array.isArray(template.conversationExamples)
          ? template.conversationExamples
          : [],
        intents: Array.isArray(template.intents) ? template.intents : [],
      }));
    } catch (error) {
      console.error("Error parsing generated templates:", error);
      return [];
    }
  }

  /**
   * Repair incomplete JSON by intelligently closing open structures
   */
  private repairIncompleteJSON(text: string): string {
    let repaired = text;
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let lastOpenBrace = -1;
    let lastOpenBracket = -1;

    // Track nesting and find open structures
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      // Toggle string state
      if (char === '"' && !escapeNext) {
        inString = !inString;
      }

      if (!inString) {
        if (char === "{") {
          braceCount++;
          lastOpenBrace = i;
        } else if (char === "}") {
          braceCount--;
        } else if (char === "[") {
          bracketCount++;
          lastOpenBracket = i;
        } else if (char === "]") {
          bracketCount--;
        }
      }
    }

    console.log(
      `📊 Brace count: ${braceCount}, Bracket count: ${bracketCount}`,
    );
    console.log(
      `📍 Last open brace at: ${lastOpenBrace}, bracket at: ${lastOpenBracket}`,
    );

    // If we're in the middle of a string value, truncate to last complete object/array
    if (inString && lastOpenBrace > lastOpenBracket) {
      // We're likely in the middle of a string value
      // Find the last complete property before the incomplete string
      const lastCommaInObject = text.lastIndexOf(",", lastOpenBrace);
      if (lastCommaInObject > -1) {
        // Truncate after the last comma and close the object
        repaired = text.substring(0, lastCommaInObject);
        braceCount = 1; // One unclosed brace for the object
        bracketCount = 1; // One unclosed bracket for the array
      }
    }

    // Close any incomplete strings by removing the last unclosed quote
    const openQuotes = (repaired.match(/"/g) || []).length;
    if (openQuotes % 2 === 1) {
      console.log("🔤 Found unclosed string, removing trailing quote");
      // Remove the last quote if it's unclosed
      const lastQuoteIndex = repaired.lastIndexOf('"');
      if (lastQuoteIndex > -1) {
        repaired = repaired.substring(0, lastQuoteIndex);
      }
    }

    // Recalculate counts after truncation
    braceCount = 0;
    bracketCount = 0;
    inString = false;
    escapeNext = false;

    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
      }

      if (!inString) {
        if (char === "{") braceCount++;
        else if (char === "}") braceCount--;
        else if (char === "[") bracketCount++;
        else if (char === "]") bracketCount--;
      }
    }

    console.log(
      `🔧 After repair - Brace count: ${braceCount}, Bracket count: ${bracketCount}`,
    );

    // Close all open braces and brackets
    while (braceCount > 0) {
      repaired += "}";
      braceCount--;
    }
    while (bracketCount > 1) {
      repaired += "]";
      bracketCount--;
    }

    console.log(`✨ Repair complete, final length: ${repaired.length}`);
    return repaired;
  }

  
  private fallbackParsing(text: string): GeneratedTemplate[] {
    console.log("🆘 Starting fallback parsing...");
    const templates: GeneratedTemplate[] = [];

    // More aggressive: find objects between { and the next complete object or end
    const braceLevel = this.findObjectBoundaries(text);

    braceLevel.forEach((boundary, index) => {
      try {
        const objectText = text.substring(boundary.start, boundary.end);
        console.log(`📦 Attempting to parse object ${index + 1}`);

        // Try direct JSON parse first
        try {
          const obj = JSON.parse(objectText);
          templates.push(this.normalizeTemplate(obj));
          console.log(
            `✅ Successfully parsed object ${index + 1}: ${obj.name}`,
          );
          return;
        } catch (e) {
          // Try to repair this specific object
          const repaired = this.repairIncompleteJSON(objectText);
          try {
            const obj = JSON.parse(repaired);
            templates.push(this.normalizeTemplate(obj));
            console.log(
              `✅ Successfully parsed (repaired) object ${index + 1}: ${obj.name}`,
            );
          } catch (e2) {
            console.warn(`⚠️ Could not parse object ${index + 1}, skipping`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing object ${index + 1}:`, error);
      }
    });

    // If no templates were recovered, try regex-based extraction
    if (templates.length === 0) {
      console.log("🔍 Attempting regex-based template extraction...");
      const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/);
      const descMatch = text.match(/"description"\s*:\s*"([^"]+)"/);
      
      if (nameMatch) {
        console.log(`📝 Found template name: ${nameMatch[1]}`);
        templates.push({
          name: nameMatch[1],
          description: descMatch ? descMatch[1] : "AI-powered assistant",
          icon: "🤖",
          features: ["AI Assistance", "Customer Support"],
          systemPrompt: "",
          firstMessage: "Hello! I am [AI Employee Name] from [Company Name], here to assist you. How can I help you today?",
          industryFocus: "",
          tone: "Professional",
          gender: "Not Specified",
          voice: "Professional",
          personality: "Helpful",
          manualKnowledge: "",
          websiteUrls: [],
          keyTalkingPoints: "• Quality service\n• Customer satisfaction",
          closingScript: "Thank you for your time!",
          objections: [],
          conversationExamples: [],
          intents: [],
        });
        console.log("✅ Created minimal template from regex extraction");
      }
    }

    console.log(`🎯 Fallback parsing recovered ${templates.length} templates`);
    return templates;
  }

  /**
   * Find object boundaries in text by tracking braces
   */
  private findObjectBoundaries(
    text: string,
  ): Array<{ start: number; end: number }> {
    const boundaries: Array<{ start: number; end: number }> = [];
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let objectStart = -1;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") {
        if (depth === 0) {
          objectStart = i;
        }
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0 && objectStart !== -1) {
          boundaries.push({ start: objectStart, end: i + 1 });
          objectStart = -1;
        }
      }
    }

    return boundaries;
  }

  /**
   * Generate a complementary template when only one template is generated
   * This ensures the user always has at least 2 options to choose from
   */
  private generateComplementaryTemplate(
    existingTemplate: GeneratedTemplate,
    request: GenerateTemplateRequest,
  ): GeneratedTemplate {
    // Extract the exact AI employee name and company name from form data / additionalContext
    const employeeNameMatch = request.additionalContext?.match(/The AI employee will be named:\s*(.+)/i);
    const employeeName = employeeNameMatch
      ? employeeNameMatch[1].trim()
      : (request.companyName ? `${request.companyName} Assistant` : 'Your AI Assistant');
    const companyName = request.companyName || 'our company';

    // Use knowledge base content if available for realistic, data-driven content
    const kbSnippet = request.extractedContent
      ? request.extractedContent.substring(0, 2000)
      : '';

    const kbKnowledgeSection = kbSnippet
      ? `\n\n## Company Knowledge (from provided documents)\n${kbSnippet}`
      : '';

    const manualKnowledge = existingTemplate.manualKnowledge ||
      (kbSnippet ? kbSnippet : `${companyName} offers professional services tailored to ${request.industry} needs.`);

    // Determine what is complementary to the existing template
    const isExistingSales =
      existingTemplate.name?.toLowerCase().includes('sales') ||
      request.businessProcess?.toLowerCase().includes('sales');
    const isExistingSupport =
      existingTemplate.name?.toLowerCase().includes('support') ||
      request.businessProcess?.toLowerCase().includes('support');
    const isExistingFriendly =
      existingTemplate.personality?.toLowerCase().includes('friendly') ||
      existingTemplate.tone?.toLowerCase().includes('friendly');

    let roleFocus: string;
    let complementaryIcon: string;
    let complementaryFeatures: string[];
    let complementaryPersonality: string;
    let complementaryTone: string;

    if (isExistingSales) {
      roleFocus = 'Customer Care Specialist';
      complementaryIcon = '🎧';
      complementaryFeatures = ['Customer Support', 'Issue Resolution', 'FAQ Handling', 'Follow-up Care'];
      complementaryPersonality = 'Empathetic and Patient';
      complementaryTone = 'Warm and Supportive';
    } else if (isExistingSupport) {
      roleFocus = 'Sales & Appointment Advisor';
      complementaryIcon = '💼';
      complementaryFeatures = ['Lead Engagement', 'Appointment Booking', 'Value Communication', 'Follow-up'];
      complementaryPersonality = 'Confident and Persuasive';
      complementaryTone = 'Professional and Engaging';
    } else if (isExistingFriendly) {
      roleFocus = 'Professional Consultant';
      complementaryIcon = '👔';
      complementaryFeatures = ['Expert Guidance', 'Detailed Information', 'Process Assistance', 'Escalation Handling'];
      complementaryPersonality = 'Analytical and Direct';
      complementaryTone = 'Formal and Professional';
    } else {
      roleFocus = 'Friendly Assistant';
      complementaryIcon = '😊';
      complementaryFeatures = ['Friendly Assistance', 'Personalized Help', 'Quick Responses', 'Supportive Guidance'];
      complementaryPersonality = 'Friendly and Approachable';
      complementaryTone = 'Warm and Conversational';
    }

    const complementaryName = `${employeeName} — ${roleFocus}`;
    const complementaryDescription = `${employeeName} is a dedicated ${roleFocus.toLowerCase()} for ${companyName}, specializing in ${request.industry} with a ${complementaryTone.toLowerCase()} approach. Fully trained on ${companyName}'s services and policies to deliver accurate, helpful responses.`;

    const complementarySystemPrompt =
      `## Identity & Purpose\n\nYou are ${employeeName}, a ${roleFocus.toLowerCase()} for ${companyName}. ` +
      `Your role is to assist customers professionally and efficiently in the context of ${request.businessProcess} within the ${request.industry} industry.\n\n` +
      `## Voice & Persona\n\n### Personality\n- ${complementaryPersonality}\n- Knowledgeable about ${companyName}\'s services\n- Clear and accurate\n\n` +
      `### Speech Characteristics\n- ${complementaryTone} tone\n- Listen actively before responding\n- Confirm key information\n\n` +
      `## Conversation Flow\n\n1. Greet the caller warmly as ${employeeName} from ${companyName}\n2. Identify their need or question\n3. Provide accurate information from company knowledge\n4. Address any objections or concerns\n5. Confirm next steps and close professionally\n\n` +
      `## Response Guidelines\n- Always identify yourself as ${employeeName}\n- Be concise and accurate\n- Never guess — use company knowledge\n- Escalate when needed\n\n` +
      `## Scenario Handling\n\n### General Inquiry\n1. Listen to the customer's question\n2. Reference company knowledge to answer accurately\n3. Offer additional help if needed\n\n### Complaint or Issue\n1. Acknowledge the issue empathetically\n2. Apologize for the inconvenience\n3. Provide a resolution or escalate\n\n### Request for Services\n1. Clarify what the customer needs\n2. Explain relevant services from company knowledge\n3. Guide them to next steps\n` +
      kbKnowledgeSection +
      `\n\n## Call Management\n- If on hold: \'One moment, please.\'\n- For transfers: \'I will connect you with the right team.\'\n- Always end professionally: \'Thank you for contacting ${companyName}.\'`;

    return {
      name: complementaryName,
      description: complementaryDescription,
      icon: complementaryIcon,
      features: complementaryFeatures,
      systemPrompt: complementarySystemPrompt,
      firstMessage: `Hello! I'm ${employeeName} from ${companyName}. How can I assist you today?`,
      industryFocus: request.industry || '',
      tone: complementaryTone,
      gender: existingTemplate.gender === 'Female' ? 'Male' : 'Female',
      voice: isExistingFriendly ? 'Professional' : 'Friendly',
      personality: complementaryPersonality,
      manualKnowledge,
      websiteUrls: request.websiteUrls || [],
      keyTalkingPoints: existingTemplate.keyTalkingPoints ||
        `• ${companyName} is committed to excellent service\n• Accurate information from company knowledge\n• Professional and timely assistance`,
      closingScript: `Thank you for contacting ${companyName}. Is there anything else I can help you with today?`,
      objections: existingTemplate.objections || [],
      conversationExamples: existingTemplate.conversationExamples || [],
      intents: existingTemplate.intents || [],
    };
  }

  /**
   * Normalize a template object with defaults
   */
  private normalizeTemplate(template: any): GeneratedTemplate {
    return {
      name: template.name || "Unnamed Template",
      description: template.description || "",
      icon: template.icon || "🤖",
      features: Array.isArray(template.features)
        ? template.features
        : ["AI-powered assistance"],
      systemPrompt: template.systemPrompt || "",
      firstMessage:
        template.firstMessage || "Hello! I am [AI Employee Name] from [Company Name], here to assist you. How can I help you today?",
      industryFocus: template.industryFocus || "",
      tone: template.tone || "Professional",
      gender: template.gender || "Not Specified",
      voice: template.voice || "Professional",
      personality: template.personality || "Helpful",
      manualKnowledge: template.manualKnowledge || "",
      websiteUrls: Array.isArray(template.websiteUrls)
        ? template.websiteUrls
        : [],
      keyTalkingPoints: template.keyTalkingPoints || "• Quality service",
      closingScript: template.closingScript || "Thank you for your time!",
      objections: Array.isArray(template.objections) ? template.objections : [],
      conversationExamples: Array.isArray(template.conversationExamples)
        ? template.conversationExamples
        : [],
      intents: Array.isArray(template.intents) ? template.intents : [],
    };
  }

  /**
   * Enhance an existing template with AI-generated content
   */
  async enhanceTemplate(
    templateName: string,
    context: GenerateTemplateRequest,
  ): Promise<GeneratedTemplate> {
    try {
      const prompt = `You are an AI assistant that enhances AI Employee templates. Given the following template name and business context, provide an enhanced version with optimized system prompt and features.

Template Name: ${templateName}
Company: ${context.companyName}
Business Process: ${context.businessProcess}
Industry: ${context.industry}

Return a JSON object with: name, description, icon, features (array), systemPrompt, industryFocus, and tone.`;

      const response = await promptClient.post<PromptGenerationResponse>(
        PROMPT_GENERATION_API,
        {
          prompt,
          max_tokens: 1500,
          temperature: 0.7,
        },
      );

      const generatedText = this.extractGeneratedText(response.data);
      const templates = this.parseGeneratedTemplates(generatedText);

      return (
        templates[0] || {
          name: templateName,
          description: "",
          icon: "🤖",
          features: [],
        }
      );
    } catch (error) {
      console.error("Error enhancing template:", error);
      throw error;
    }
  }
}

export const aiTemplateService = new AITemplateService();
