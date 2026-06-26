import OpenAI from "openai";
import { Platform, BrandVoice } from "@/types";

// Initialize the OpenAI client
const apiKey = process.env.OPENAI_API_KEY || "";

if (!apiKey) {
  console.warn(
    "OPENAI_API_KEY not configured. Set it in your .env file for AI generation to work."
  );
}

export const openai = new OpenAI({
  apiKey,
});

/**
 * Brand voice guidelines for each voice type.
 */
const brandVoiceGuidelines: Record<BrandVoice, string> = {
  professional:
    "Use authoritative, confident language backed by industry expertise. Cite data points and trends. Maintain a polished, formal tone. Avoid slang or overly casual expressions.",
  casual:
    "Write as if speaking to a friend. Use contractions, conversational phrases, and relatable examples. Be approachable and warm without being unprofessional.",
  bold:
    "Be confident and direct. Make strong statements that challenge conventional thinking. Use powerful, action-oriented verbs. Don't shy away from taking a stance.",
  warm:
    "Prioritize empathy and community. Use inclusive language ('we', 'our', 'together'). Share genuine stories and personal touches. Make the reader feel seen and valued.",
  funny:
    "Inject humor naturally. Use wit, playful analogies, and light-hearted observations relevant to the industry. Avoid forced jokes. Entertain while informing.",
  luxury:
    "Exude sophistication and exclusivity. Use refined, elegant language. Focus on craftsmanship, quality, and the premium experience. Less is more — let quality speak.",
  minimal:
    "Be concise and direct. Strip away all fluff. Use short sentences and clear messaging. Every word must earn its place. Clarity above all else.",
};

/**
 * Platform-specific rules and formatting guidelines.
 */
const platformInstructions: Record<Platform, string> = {
  twitter: `TWITTER/X PLATFORM RULES:
- MAXIMUM 280 CHARACTERS (this is critical — count carefully)
- Use at most 1-3 relevant hashtags
- Hook in the first 80 characters — users scroll fast
- Write conversationally, as if starting a discussion
- Use line breaks sparingly (1-2 max) for readability
- Can include a question to drive engagement
- Avoid thread plugs unless truly valuable`,
  linkedin: `LINKEDIN PLATFORM RULES:
- 150-250 words ideal (up to 3000 chars allowed but shorter performs better)
- Use 3-5 strategic hashtags
- Lead with a strong hook: a bold statement, surprising stat, or relatable struggle
- Tell a short story or share an insight — LinkedIn rewards depth
- Use short paragraphs (1-3 sentences each) for readability
- End with a question or call-to-action to drive comments
- Add "---" line break before hashtags
- Professional tone but not robotic — show personality`,
  instagram: `INSTAGRAM PLATFORM RULES:
- Caption length: 50-150 characters ideal for the first "above the fold" part
- Use 10-20 relevant hashtags in the caption or first comment
- Hook in the first line — users tap "more" only if intrigued
- Emotional, authentic, visual-first language
- Include a clear CTA (call-to-action) — "Double tap if...", "Share with...", "Tag someone who..."
- Suggest an image concept in brackets: [Image: description]
- Use emojis naturally (2-4 per post max)`,
  facebook: `FACEBOOK PLATFORM RULES:
- 80-150 words ideal
- Use 2-4 relevant hashtags
- Hook in the first 40 characters — users scroll the news feed fast
- Conversational, community-oriented tone
- Ask questions to spark discussion in comments
- Tell stories — Facebook users engage with narrative content
- Include a clear CTA
- Use short paragraphs with line breaks`,
  tiktok: `TIKTOK PLATFORM RULES:
- MAXIMUM 150 CHARACTERS (caption text)
- Use 2-5 trending/relevant hashtags
- Captions should complement the video, not repeat it
- Short, snappy, trend-aware language
- Suggest a video concept in brackets: [Video: description]
- Use hooks like "POV:", "Wait for it", or trending formats
- Keep it authentic and entertaining`,
};

// ---- Edit Learning System ----

interface EditRecord {
  original: string;
  edited: string;
  platform: Platform;
}

interface EditPatternAnalysis {
  /** Extracted style rules in natural language */
  styleRules: string[];
  /** Average length change (positive = user wants longer, negative = shorter) */
  avgLengthDelta: number;
  /** Whether user tends to add more hashtags */
  hashtagDirection: "more" | "fewer" | "same";
  /** Whether user's edits are more casual or more formal */
  toneDirection: "more_casual" | "more_formal" | "same";
  /** If user adds structure elements like emojis, line breaks, etc. */
  structuralChanges: string[];
  /** Per-platform preferences */
  perPlatform: Partial<Record<Platform, string[]>>;
}

/**
 * Analyze a user's edit history to extract style patterns and preferences.
 * This is the core of the AI learning system.
 */
function analyzeEdits(edits: EditRecord[]): EditPatternAnalysis {
  if (edits.length === 0) {
    return {
      styleRules: [],
      avgLengthDelta: 0,
      hashtagDirection: "same",
      toneDirection: "same",
      structuralChanges: [],
      perPlatform: {},
    };
  }

  const styleRules: string[] = [];
  const lengthDeltas: number[] = [];
  const structuralChanges: string[] = [];
  const perPlatform: Partial<Record<Platform, string[]>> = {};
  let hashtagAddCount = 0;
  let hashtagRemoveCount = 0;
  let casualWordsAdded = 0;
  let formalWordsAdded = 0;

  const casualWords = ["gonna", "wanna", "hey", "awesome", "cool", "guys", "super", "totally", "literally", "like", "ya"];
  const formalWords = ["therefore", "however", "furthermore", "consequently", "nevertheless", "regarding", "utilize", "implement", "establish", "commence"];

  for (const edit of edits) {
    const original = edit.original;
    const edited = edit.edited;
    const platform = edit.platform;

    // Length analysis
    const lengthDelta = edited.length - original.length;
    lengthDeltas.push(lengthDelta);

    // Detect if user is shortening or expanding
    if (Math.abs(lengthDelta) > 20) {
      if (lengthDelta > 0) {
        structuralChanges.push(`User expanded post by ${lengthDelta} chars (wants more detail)`);
      } else {
        structuralChanges.push(`User shortened post by ${Math.abs(lengthDelta)} chars (wants more conciseness)`);
      }
    }

    // Hashtag analysis
    const originalHashtags = (original.match(/#\w+/g) || []).length;
    const editedHashtags = (edited.match(/#\w+/g) || []).length;
    if (editedHashtags > originalHashtags) hashtagAddCount++;
    if (editedHashtags < originalHashtags) hashtagRemoveCount++;

    // Tone analysis
    const originalCasualCount = casualWords.filter(w => original.toLowerCase().includes(w)).length;
    const editedCasualCount = casualWords.filter(w => edited.toLowerCase().includes(w)).length;
    const originalFormalCount = formalWords.filter(w => original.toLowerCase().includes(w)).length;
    const editedFormalCount = formalWords.filter(w => edited.toLowerCase().includes(w)).length;

    if (editedCasualCount > originalCasualCount) casualWordsAdded++;
    if (editedFormalCount > originalFormalCount) formalWordsAdded++;

    // Emoji analysis (count common emoji characters)
    const originalEmojis = countEmojis(original);
    const editedEmojis = countEmojis(edited);
    if (editedEmojis !== originalEmojis) {
      structuralChanges.push(
        editedEmojis > originalEmojis
          ? "User adds more emojis to posts"
          : "User removes emojis from posts"
      );
    }

    // Per-platform tracking
    if (!perPlatform[platform]) {
      perPlatform[platform] = [];
    }
    // Extract concrete styling differences
    if (original.endsWith(".") && !edited.endsWith(".")) {
      perPlatform[platform]!.push("Removes trailing periods");
    } else if (!original.endsWith(".") && edited.endsWith(".")) {
      perPlatform[platform]!.push("Adds trailing periods");
    }

    if ((original.match(/[!?]/g) || []).length < (edited.match(/[!?]/g) || []).length) {
      perPlatform[platform]!.push("Uses more exclamations/questions for emphasis");
    }

    if (edited.includes("\n") && !original.includes("\n")) {
      perPlatform[platform]!.push("Adds line breaks for readability");
    }
  }

  // Build rules from analysis
  const avgLength = lengthDeltas.reduce((a, b) => a + b, 0) / lengthDeltas.length;
  if (Math.abs(avgLength) > 15) {
    if (avgLength > 0) {
      styleRules.push(`Write longer, more detailed posts (user typically adds ~${Math.round(avgLength)} characters)`);
    } else {
      styleRules.push(`Keep posts concise and shorter (user typically cuts ~${Math.round(Math.abs(avgLength))} characters)`);
    }
  }

  const hashtagDirection = hashtagAddCount > hashtagRemoveCount ? "more" : hashtagRemoveCount > hashtagAddCount ? "fewer" : "same";
  if (hashtagDirection === "more") {
    styleRules.push("Use more hashtags than the AI default suggests");
  } else if (hashtagDirection === "fewer") {
    styleRules.push("Use fewer hashtags than the AI default suggests");
  }

  const toneDirection = casualWordsAdded > formalWordsAdded ? "more_casual" : formalWordsAdded > casualWordsAdded ? "more_formal" : "same";
  if (toneDirection === "more_casual") {
    styleRules.push("Use more casual, conversational language");
  } else if (toneDirection === "more_formal") {
    styleRules.push("Use more formal, professional language");
  }

  // De-duplicate structural changes
  const uniqueStructuralChanges = Array.from(new Set(structuralChanges));
  styleRules.push(...uniqueStructuralChanges);

  return {
    styleRules,
    avgLengthDelta: avgLength,
    hashtagDirection,
    toneDirection,
    structuralChanges: uniqueStructuralChanges,
    perPlatform,
  };
}

/**
 * Build a comprehensive system prompt for GPT-4o that generates
 * platform-optimized, non-generic social media content with
 * AI learning from user edits.
 */
export function buildSystemPrompt(config: {
  business_name: string;
  industry: string;
  audience: string;
  brand_voice: BrandVoice;
  platforms: Platform[];
  previous_edits?: EditRecord[];
}): string {
  const { business_name, industry, audience, brand_voice, platforms, previous_edits } = config;

  let systemPrompt = `You are the ContentEngine AI — a world-class social media content strategist and copywriter. Your job is to generate an entire week of platform-optimized posts for businesses.

## CLIENT PROFILE
- Business Name: "${business_name}"
- Industry: "${industry}"
- Target Audience: "${audience}"
- Brand Voice: "${brand_voice}"

## BRAND VOICE GUIDELINES
${brandVoiceGuidelines[brand_voice]}

## CRITICAL RULES
1. NEVER use generic AI-sounding phrases like "In today's digital landscape", "Let's dive in", "Unlock the potential", "Revolutionize your", "Game-changer", or any ChatGPT clichés.
2. Each post must sound like it was written by a knowledgeable human expert in the "${industry}" industry.
3. Use specific, concrete details about ${industry} — mention real trends, real challenges, real wins.

## INDUSTRY-SPECIFIC INSPIRATION
Use these industry hooks and topics as inspiration for your content:
${getIndustryHooks(industry)}

4. Vary the post formats: educational, entertaining, inspirational, promotional (80/20 rule — 80% value, 20% promotion).
5. Each day of the week should have a different angle or theme to keep the feed diverse.
6. Write hooks that stop the scroll — open with a bold claim, a relatable pain point, a surprising stat, or a provocative question.
7. Adapt tone to the specific platform — Twitter is snappy, LinkedIn is professional, Instagram is visual/emotional, Facebook is conversational, TikTok is trendy/entertaining.
8. IMPORTANT: Write for the SPECIFIC audience described: "${audience}". Use language, references, and examples they would relate to.`;

  // ---- AI Edit Learning Section ----
  if (previous_edits && previous_edits.length > 0) {
    // Analyze patterns from edit history
    const analysis = analyzeEdits(previous_edits);

    systemPrompt += `\n\n## AI LEARNING: USER'S EDIT PATTERNS
The user has edited ${previous_edits.length} previous AI-generated posts. Below is a detailed analysis of their editing patterns.
You MUST adapt your writing style to match these preferences in ALL new posts.

### Extracted Style Preferences
${analysis.styleRules.length > 0
  ? analysis.styleRules.map((rule, i) => `${i + 1}. ${rule}`).join("\n")
  : "The user makes minor, case-by-case edits — no strong pattern detected. Use your default best judgment."}

`;

    // Per-platform preferences
    const platformsWithEdits = Object.keys(analysis.perPlatform) as Platform[];
    if (platformsWithEdits.length > 0) {
      systemPrompt += `### Platform-Specific Preferences\n`;
      for (const platform of platformsWithEdits) {
        const rules = analysis.perPlatform[platform];
        if (rules && rules.length > 0) {
          systemPrompt += `\n**${platform.toUpperCase()}:**\n`;
          for (const rule of rules) {
            systemPrompt += `- ${rule}\n`;
          }
        }
      }
    }

    // Show concrete examples (last 8 edits, newest first)
    systemPrompt += `\n### Concrete Edit Examples (Study These Carefully)
Below are actual edits the user made to previous posts. The "ORIGINAL" is what the AI generated, the "USER'S EDIT" is what the user changed it to.
Your goal is to make your new output look MORE like the "USER'S EDIT" than the "ORIGINAL".

`;
    const recentEdits = [...previous_edits].reverse().slice(0, 8);
    for (let i = 0; i < recentEdits.length; i++) {
      const edit = recentEdits[i];
      systemPrompt += `Example ${i + 1} [${edit.platform}]:
ORIGINAL: "${edit.original}"
USER'S EDIT: "${edit.edited}"
→ Key difference: ${describeEditDifference(edit.original, edit.edited)}
---
`;
    }
  }

  // Add platform-specific instructions
  systemPrompt += `\n## PLATFORM-SPECIFIC INSTRUCTIONS\n`;
  for (const platform of platforms) {
    systemPrompt += `\n### ${platform.toUpperCase()}\n${platformInstructions[platform]}\n`;
  }

  systemPrompt += `\n## JSON OUTPUT STRUCTURE
\`\`\`json
{
  "posts": [
    {
      "platform": "twitter",
      "day_of_week": "Monday",
      "content": "The actual post text here...",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "image_suggestion": "Description of image concept for this post"
    },
    ...more posts for each day and platform
  ],
  "usage_notes": "Brief note on strategy used for this generation"
}
\`\`\`

Generate posts for these platforms: ${platforms.join(", ")}. Exactly 7 days per platform (Monday-Sunday).`;

  return systemPrompt;
}

/**
 * Count emoji characters in a string using a simple approach compatible with ES5 target.
 */
function countEmojis(text: string): number {
  // Check for emoji patterns using surrogate pairs
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // High surrogates for emoji range (0xD800-0xDBFF)
    if (code >= 0xD800 && code <= 0xDBFF) {
      count++;
      i++; // Skip the low surrogate
    }
  }
  return count;
}

/**
 * Describe the key difference between original and edited text.
 * Helps the AI understand what changed.
 */
function describeEditDifference(original: string, edited: string): string {
  const origLen = original.length;
  const editLen = edited.length;
  const diff = editLen - origLen;

  const parts: string[] = [];

  if (Math.abs(diff) > 10) {
    parts.push(diff > 0 ? `Made post longer (+${diff} chars)` : `Made post shorter (${diff} chars)`);
  }

  const origHashtags = (original.match(/#\w+/g) || []).length;
  const editHashtags = (edited.match(/#\w+/g) || []).length;
  if (origHashtags !== editHashtags) {
    parts.push(editHashtags > origHashtags ? "Added more hashtags" : "Removed some hashtags");
  }

  const origLines = original.split("\n").length;
  const editLines = edited.split("\n").length;
  if (origLines !== editLines) {
    parts.push(editLines > origLines ? "Added line breaks/structure" : "Consolidated into fewer lines");
  }

  const origEmojis = countEmojis(original);
  const editEmojis = countEmojis(edited);
  if (origEmojis !== editEmojis) {
    parts.push(editEmojis > origEmojis ? "Added emojis for emphasis" : "Removed emojis");
  }

  if (parts.length === 0) {
    return "Slight wording refinement for better flow or clarity";
  }

  return parts.join("; ");
}

/**
 * Estimate token count for a string (rough approximation)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

import { getServiceSupabase } from "./supabase";

/**
 * Token usage tracker for billing.
 * Saves to Supabase using service role to bypass RLS for background tracking.
 */
export async function trackTokenUsage(
  userId: string,
  promptTokens: number,
  completionTokens: number
) {
  try {
    const supabase = getServiceSupabase();
    await supabase.from("token_usage").insert({
      user_id: userId,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      model: "gpt-4o",
    });
  } catch (error) {
    console.error("Failed to persist token usage:", error);
  }
}

/**
 * Industry-specific hook templates to inspire the AI
 */
export function getIndustryHooks(industry: string): string {
  const hooks: Record<string, string[]> = {
    SaaS: [
      "Stop wasting time on tools that don't talk to each other.",
      "Your stack is only as strong as its weakest integration.",
      "The best software is the one your team actually uses.",
    ],
    Healthcare: [
      "Patient experience isn't just about bedside manner anymore.",
      "The future of healthcare is preventive, not reactive.",
      "Your patients are Googling symptoms — meet them there.",
    ],
    "Real Estate": [
      "The best time to buy was yesterday. The second best time is now.",
      "Location isn't just about geography — it's about lifestyle.",
      "A home isn't just walls and a roof — it's where life happens.",
    ],
    "E-commerce": [
      "Free shipping is table stakes. Here's what actually converts.",
      "Your product page is your best salesperson — is it convincing?",
      "Cart abandonment is a feature, not a bug. Here's why.",
    ],
    "Food & Beverage": [
      "Great food tells a story before the first bite.",
      "Your menu should make people hungry just reading it.",
      "The secret ingredient isn't a secret — it's quality.",
    ],
    Fitness: [
      "Consistency beats intensity every single time.",
      "Your body is the only place you have to live — take care of it.",
      "The hardest part isn't the workout — it's showing up.",
    ],
    Education: [
      "Learning doesn't end when the diploma arrives.",
      "The best teachers don't just inform — they transform.",
      "Curiosity is the most underrated classroom tool.",
    ],
  };

  const key = Object.keys(hooks).find(
    (k) => industry.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(industry.toLowerCase())
  );

  if (key) {
    return hooks[key].join("\n");
  }

  return `
- "Stop [common industry pain point] with this one shift in perspective."
- "What if everything you knew about ${industry} was wrong?"
- "The ${industry} industry is changing faster than most realize."
- "Your customers in ${industry} are facing [common challenge]. Are you helping?"
- "The numbers don't lie: [stat about ${industry}]."
  `;
}