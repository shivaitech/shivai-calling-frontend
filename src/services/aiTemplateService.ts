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
  openingScript?: string;
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

    // Simplified example to save tokens - the comprehensive structure is described above
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
    "openingScript": "Thank you for calling. How may I help?",
    "keyTalkingPoints": "• Identify need • Offer options • Confirm details",
    "closingScript": "Your appointment is confirmed. Is there anything else?",
    "objections": [{"objection": "Times dont work", "response": "Let me find other options."}],
    "conversationExamples": [{"customerInput": "I need an appointment", "expectedResponse": "I can help. What type of appointment?"}],
    "intents": [{"name": "Schedule", "phrases": "book, schedule", "response": "I can help schedule that."}]
  }
]`;

    const prompt = `You are an AI assistant that creates professional AI Employee templates for businesses. Based on the following business information, generate AT LEAST 2 (preferably 3-5) DIFFERENT AI Employee template recommendations in JSON format with COMPREHENSIVE, PROFESSIONAL system prompts.

Company Name: ${request.companyName}
Business Process: ${request.businessProcess}
Industry: ${request.industry}${subIndustryContent}${urlContent}
${request.additionalContext ? `Additional Context: ${request.additionalContext}` : ""}

CRITICAL: Generate a minimum of 2 templates. Each template should be distinct and offer a different approach or perspective for the AI Employee.

IMPORTANT: The systemPrompt field must be COMPREHENSIVE and follow this professional structure:

## System Prompt Structure (REQUIRED):
The systemPrompt should include ALL of these sections with detailed content:

1. **Identity & Purpose** - Who the AI is and their primary goal
2. **Voice & Persona** - Personality traits and speech characteristics
3. **Conversation Flow** - Step-by-step conversation process with specific phrases to use
4. **Response Guidelines** - Rules for how to respond (concise, confirm details, etc.)
5. **Scenario Handling** - Detailed handling for 3-4 common scenarios with specific steps
6. **Knowledge Base** - Key information the AI should know
7. **Call Management** - How to handle delays, technical issues, multiple requests

For each template, provide:
1. A professional name for the AI Employee (MUST BE UNIQUE)
2. A concise description (2-3 sentences)
3. An appropriate emoji icon
4. 3-4 key features
5. A COMPREHENSIVE systemPrompt (following the structure above - this is the MOST IMPORTANT field)
6. First message/greeting for starting conversations
7. Industry focus
8. Recommended tone/personality
9. Suggested gender (Male, Female, Neutral, or Not Specified)
10. Recommended voice type
11. Personality traits
12. Manual knowledge base content
13. Opening script
14. Key talking points
15. Closing script
16. 2-3 common objections with responses
17. 2-3 example conversation exchanges
18. 2-3 intent examples

Return ONLY a valid JSON array with AT LEAST 2 objects containing all above fields. No markdown, no explanation, just valid JSON array.

Example format: ${exampleTemplates}`;

    return prompt;
  }

  /**
   * Extract generated text from various response formats with logging
   */ /**
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
        openingScript:
          template.openingScript ||
          "Hi there! Thanks for reaching out. How can I help?",
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
          openingScript: "Thank you for contacting us. How can I help?",
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
    // Determine complementary personality and approach
    const isExistingFriendly = existingTemplate.personality?.toLowerCase().includes("friendly") ||
      existingTemplate.personality?.toLowerCase().includes("empathetic") ||
      existingTemplate.tone?.toLowerCase().includes("friendly");
    
    const isExistingSales = existingTemplate.name?.toLowerCase().includes("sales") ||
      request.businessProcess?.toLowerCase().includes("sales");

    const isExistingSupport = existingTemplate.name?.toLowerCase().includes("support") ||
      request.businessProcess?.toLowerCase().includes("support");

    // Create a complementary template based on what exists
    let complementaryName: string;
    let complementaryDescription: string;
    let complementaryIcon: string;
    let complementaryFeatures: string[];
    let complementaryPersonality: string;
    let complementaryTone: string;
    let complementarySystemPrompt: string;
    let complementaryFirstMessage: string;

    if (isExistingSales) {
      // Add a support-focused template
      complementaryName = `${request.companyName} Customer Care Specialist`;
      complementaryDescription = `A dedicated customer support specialist for ${request.companyName} that handles inquiries with care and professionalism.`;
      complementaryIcon = "🎧";
      complementaryFeatures = ["Customer Support", "Issue Resolution", "FAQ Handling", "Follow-up Care"];
      complementaryPersonality = "Empathetic and Patient";
      complementaryTone = "Warm and Supportive";
      complementarySystemPrompt = `You are a caring customer support specialist for ${request.companyName}. Help customers with their questions, resolve issues efficiently, and ensure a positive experience. Be patient, understanding, and solution-oriented.`;
      complementaryFirstMessage = `Hello! I am [AI Employee Name] from ${request.companyName}, here to assist you with any questions or concerns. How can I help you today?`;
    } else if (isExistingSupport) {
      // Add a sales-focused template
      complementaryName = `${request.companyName} Sales Advisor`;
      complementaryDescription = `A professional sales advisor for ${request.companyName} that engages prospects and guides them toward solutions.`;
      complementaryIcon = "💼";
      complementaryFeatures = ["Lead Engagement", "Product Guidance", "Consultation Booking", "Value Communication"];
      complementaryPersonality = "Confident and Persuasive";
      complementaryTone = "Professional and Engaging";
      complementarySystemPrompt = `You are a professional sales advisor for ${request.companyName}. Engage prospects warmly, understand their needs, present value propositions effectively, and guide them toward making informed decisions.`;
      complementaryFirstMessage = `Hello! I am [AI Employee Name] from ${request.companyName}, here to assist you. I'd love to learn more about your needs and how we can help. What brings you here today?`;
    } else if (isExistingFriendly) {
      // Add a more formal/professional template
      complementaryName = `${request.companyName} Professional Consultant`;
      complementaryDescription = `A professional consultant for ${request.companyName} with a formal, business-focused approach.`;
      complementaryIcon = "👔";
      complementaryFeatures = ["Professional Consultation", "Expert Guidance", "Detailed Analysis", "Strategic Advice"];
      complementaryPersonality = "Analytical and Direct";
      complementaryTone = "Formal and Professional";
      complementarySystemPrompt = `You are a professional consultant for ${request.companyName}. Provide expert guidance with a formal, business-focused approach. Be thorough, analytical, and solution-oriented.`;
      complementaryFirstMessage = `Hello! I am [AI Employee Name] from ${request.companyName}, here to assist you. How may I help you today?`;
    } else {
      // Add a friendly/approachable template
      complementaryName = `${request.companyName} Friendly Assistant`;
      complementaryDescription = `A warm and approachable assistant for ${request.companyName} that creates a welcoming experience.`;
      complementaryIcon = "😊";
      complementaryFeatures = ["Friendly Assistance", "Personalized Help", "Easy Communication", "Supportive Guidance"];
      complementaryPersonality = "Friendly and Approachable";
      complementaryTone = "Warm and Conversational";
      complementarySystemPrompt = `You are a friendly and approachable assistant for ${request.companyName}. Create a warm, welcoming experience while helping customers with their needs. Be personable, helpful, and easy to talk to.`;
      complementaryFirstMessage = `Hello! I am [AI Employee Name] from ${request.companyName}, here to assist you! I'm happy to help with anything you need. What can I do for you today?`;
    }

    return {
      name: complementaryName,
      description: complementaryDescription,
      icon: complementaryIcon,
      features: complementaryFeatures,
      systemPrompt: complementarySystemPrompt,
      firstMessage: complementaryFirstMessage,
      industryFocus: request.industry || "",
      tone: complementaryTone,
      gender: existingTemplate.gender === "Female" ? "Male" : "Female", // Alternate gender
      voice: isExistingFriendly ? "Professional" : "Friendly",
      personality: complementaryPersonality,
      manualKnowledge: existingTemplate.manualKnowledge || "",
      websiteUrls: request.websiteUrls || [],
      openingScript: `Thank you for contacting ${request.companyName}. How can I assist you today?`,
      keyTalkingPoints: existingTemplate.keyTalkingPoints || "• We're here to help\n• Your satisfaction is our priority",
      closingScript: `Thank you for choosing ${request.companyName}. Is there anything else I can help with?`,
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
      openingScript: template.openingScript || "Hi there! How can I help?",
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
