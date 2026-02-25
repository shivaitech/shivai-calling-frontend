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
   * Generate template recommendations using AI based on user input
   */
  async generateTemplates(
    request: GenerateTemplateRequest,
  ): Promise<GeneratedTemplate[]> {
    try {
      // Build prompt from user data
      const prompt = this.buildPrompt(request);

      console.log(
        "📝 Generating templates with prompt:",
        prompt.substring(0, 100) + "...",
      );

      // Call the prompt generation API endpoint
      const response = await promptClient.post<PromptGenerationResponse>(
        PROMPT_GENERATION_API,
        {
          prompt,
          max_tokens: 12000, // Increased significantly for comprehensive system prompts
          temperature: 0.7,
        },
      );

      console.log("📥 API Response received, status:", response.status);
      console.log("📄 Response data keys:", Object.keys(response.data));

      // Extract the generated text from response
      const generatedText = this.extractGeneratedText(response.data);

      if (!generatedText) {
        console.error(
          "❌ No text generated from API - response:",
          response.data,
        );
        throw new Error("No text generated from API");
      }

      console.log("📋 Generated text length:", generatedText.length);
      console.log(
        "📋 Generated text preview:",
        generatedText.substring(0, 150),
      );

      // Parse the generated text into template objects
      let templates = this.parseGeneratedTemplates(generatedText);

      if (templates.length === 0) {
        console.error(
          "❌ Failed to parse templates. Raw text:",
          generatedText.substring(0, 300),
        );
        throw new Error(
          "Failed to parse templates from API response - JSON may be incomplete",
        );
      }

      // Ensure at least 2 templates by generating a complementary one if needed
      if (templates.length < 2) {
        console.warn(
          `⚠️ Only ${templates.length} template(s) generated, adding complementary template...`,
        );
        const complementaryTemplate = this.generateComplementaryTemplate(
          templates[0],
          request,
        );
        templates.push(complementaryTemplate);
        console.log("✅ Added complementary template:", complementaryTemplate.name);
      }

      console.log("✅ Generated templates:", templates.length, "templates");
      templates.forEach((t, i) => console.log(`  ${i + 1}. ${t.name}`));

      return templates;
    } catch (error) {
      console.error(
        "❌ Error generating templates:",
        error instanceof Error ? error.message : error,
      );
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
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

    // Simplified example to save tokens
    const exampleTemplates = `[
  {
    "name": "Professional Appointment Coordinator",
    "description": "Efficiently schedules and manages appointments with clear communication.",
    "icon": "📅",
    "features": ["Smart Scheduling", "Appointment Confirmation", "Rescheduling"],
    "systemPrompt": "## Identity & Purpose\\n\\nYou are [AI Employee Name], an appointment scheduling assistant for [Company Name]. Your purpose is to efficiently manage appointments.\\n\\n## Voice & Persona\\n\\n### Personality\\n- Sound friendly and organized\\n- Be patient and helpful\\n\\n### Speech Characteristics\\n- Use clear language\\n- Confirm details explicitly\\n\\n## Conversation Flow\\n\\n### Scheduling\\n1. Identify appointment type\\n2. Check availability\\n3. Confirm booking\\n\\n## Response Guidelines\\n- Ask one question at a time\\n- Confirm all details\\n\\n## Scenario Handling\\n\\n### New Customers\\n1. Collect information\\n2. Explain process\\n\\n### Rescheduling\\n1. Find existing appointment\\n2. Offer alternatives\\n\\n## Call Management\\n- If checking: 'One moment please.'",
    "firstMessage": "Thank you for calling [Company Name]. How may I help you today?",
    "industryFocus": "Healthcare, Services",
    "tone": "Friendly",
    "gender": "Female",
    "voice": "Professional",
    "personality": "Organized",
    "manualKnowledge": "Appointment types, policies, availability.",
    "keyTalkingPoints": "• Identify need • Offer options • Confirm details",
    "closingScript": "Your appointment is confirmed. Is there anything else?",
    "objections": [{"objection": "Times dont work", "response": "Let me find other options."}],
    "conversationExamples": [{"customerInput": "I need an appointment", "expectedResponse": "I can help. What type of appointment?"}],
    "intents": [{"name": "Schedule", "phrases": "book, schedule", "response": "I can help schedule that."}]
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
- systemPrompt: COMPREHENSIVE prompt with these mandatory sections:
  * Identity & Purpose - Use ACTUAL company name + the AI employee name "${employeeName}"
  * Voice & Persona - Personality and speech style
  * Conversation Flow - Steps with real service examples from the document
  * Response Guidelines - How to respond
  * Scenario Handling - 3-4 scenarios using REAL services/products from document
  * Company Knowledge - COPY actual facts, services, pricing directly from document
  * Call Management - How to handle various situations
- firstMessage: Opening greeting using the exact name "${employeeName}" and the ACTUAL company name
- industryFocus: Based on document content
- tone, gender, voice, personality: Appropriate values
- manualKnowledge: COPY relevant facts, services, and policies directly from document
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

Generate EXACTLY 2 DISTINCT AI Employee templates in JSON format with COMPREHENSIVE, PROFESSIONAL system prompts.

CRITICAL INSTRUCTIONS:
1. ALWAYS use the exact AI Employee Name "${stdEmployeeName}" in firstName, systemPrompt, and all scripts.
2. ALWAYS use the exact Company Name "${stdCompanyName}" everywhere — never use [Company Name] placeholder.
3. Both templates must be DIFFERENT in focus (e.g., Template 1: customer service, Template 2: sales/appointment-setting).
4. The systemPrompt must be COMPREHENSIVE, realistic and specific to the business process and industry.
5. Do NOT use generic placeholders anywhere — all content must be specific and realistic.

## System Prompt Structure (REQUIRED for each template):
1. **Identity & Purpose** - "You are ${stdEmployeeName}, working for ${stdCompanyName}..."
2. **Voice & Persona** - Personality traits and speech style
3. **Conversation Flow** - Step-by-step process specific to ${request.businessProcess}
4. **Response Guidelines** - How to respond, tone, length
5. **Scenario Handling** - 3-4 realistic scenarios for this industry/business process
6. **Company Knowledge** - Realistic industry knowledge for ${request.industry}
7. **Call Management** - How to handle holds, transfers, escalations

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
