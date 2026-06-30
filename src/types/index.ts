// ---- Type Definitions for ContentEngine ----

/** Supported social media platforms */
export type Platform = "twitter" | "linkedin" | "instagram" | "facebook" | "tiktok";

/** Brand voice options */
export type BrandVoice =
  | "professional"
  | "casual"
  | "bold"
  | "warm"
  | "funny"
  | "luxury"
  | "minimal";

/** Subscription plan tiers */
export type Plan = "starter" | "pro" | "agency";

/** Post status */
export type PostStatus = "pending" | "approved" | "edited";

/** User profile stored in Supabase */
export interface UserProfile {
  id: string;
  business_name: string;
  industry: string;
  target_audience: string;
  brand_voice: BrandVoice;
  platforms: Platform[];
  plan: Plan;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_ends_at?: string;
  created_at: string;
}

/** A single generated post */
export interface GeneratedPost {
  id: string;
  user_id: string;
  client_id?: string;
  platform: Platform;
  day_of_week: string;
  content: string;
  hashtags: string[];
  image_suggestion?: string;
  status: PostStatus;
  original_content: string;
  edited_content?: string;
  created_at: string;
}

/** Input for the AI generation API */
export interface GenerateRequest {
  business_name: string;
  industry: string;
  audience: string;
  brand_voice: BrandVoice;
  platforms: Platform[];
  previous_edits?: EditRecord[];
}

/** Record of a user edit (used for AI learning) */
export interface EditRecord {
  original: string;
  edited: string;
  platform: Platform;
}

/** Response from the AI generation API */
export interface GenerateResponse {
  posts: GeneratedPostInput[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Input for creating a generated post (before saving to DB) */
export interface GeneratedPostInput {
  platform: Platform;
  day_of_week: string;
  content: string;
  hashtags: string[];
  image_suggestion?: string;
  status: PostStatus;
  original_content: string;
}

/** Client record (for agency tier) */
export interface Client {
  id: string;
  agency_user_id: string;
  business_name: string;
  industry: string;
  target_audience: string;
  brand_voice: BrandVoice;
  platforms: Platform[];
  created_at: string;
}

/** Edit history record */
export interface EditHistory {
  id: string;
  post_id: string;
  user_id: string;
  original: string;
  edited: string;
  created_at: string;
}

/** Stripe product configuration */
export interface ProductConfig {
  name: string;
  tier: Plan;
  monthlyPriceId: string;
  yearlyPriceId: string;
  monthlyAmount: number;
  yearlyAmount: number;
  postsPerWeek: number;
  maxPlatforms: number;
  features: string[];
}

/** Platform-specific formatting rules */
export interface PlatformRules {
  maxChars: number;
  hashtagLimit: number;
  bestTimes: string[];
  contentStyle: string;
}

/** Industry-specific hooks and trends */
export interface IndustryHooks {
  hooks: string[];
  topics: string[];
  hashtagPrefix: string[];
}

export const PLATFORM_RULES: Record<Platform, PlatformRules> = {
  twitter: {
    maxChars: 280,
    hashtagLimit: 3,
    bestTimes: ["7-9 AM", "12-1 PM", "5-6 PM"],
    contentStyle: "Concise, punchy, conversational. Hook in first line.",
  },
  linkedin: {
    maxChars: 3000,
    hashtagLimit: 5,
    bestTimes: ["7-9 AM", "12-1 PM", "5-6 PM"],
    contentStyle: "Professional, thought-leadership, value-driven. Storytelling with insights.",
  },
  instagram: {
    maxChars: 2200,
    hashtagLimit: 30,
    bestTimes: ["9-11 AM", "7-9 PM"],
    contentStyle: "Visual-first, emotional, authentic. Strong hook in first line.",
  },
  facebook: {
    maxChars: 63206,
    hashtagLimit: 5,
    bestTimes: ["9-11 AM", "1-3 PM"],
    contentStyle: "Engaging, community-oriented, conversational. Questions and storytelling.",
  },
  tiktok: {
    maxChars: 150,
    hashtagLimit: 5,
    bestTimes: ["7-9 AM", "12-2 PM", "7-10 PM"],
    contentStyle: "Trendy, authentic, entertainment-first. Short and snappy.",
  },
};

export const BRAND_VOICE_DESCRIPTIONS: Record<BrandVoice, string> = {
  professional:
    "Authoritative, confident, industry-leading. Uses data and evidence. Avoids slang. Polished and formal tone.",
  casual:
    "Friendly, approachable, conversational. Uses everyday language. Feels like a chat with a helpful colleague.",
  bold:
    "Confident, direct, provocative. Makes strong statements. Challenges the status quo. Uses powerful language.",
  warm:
    "Empathetic, caring, community-focused. Uses inclusive language. Feels personal and genuine.",
  funny:
    "Humorous, witty, playful. Uses jokes, puns, and light-hearted content. Entertaining while being informative.",
  luxury:
    "Sophisticated, elegant, exclusive. Refined language. Premium feel. Focus on quality and craftsmanship.",
  minimal:
    "Clean, simple, clear. Short sentences. No fluff. Gets straight to the point. Zen-like simplicity.",
};

export const INDUSTRIES = [
  "Accounting", "Advertising", "Aerospace", "Agriculture", "Architecture",
  "Art & Design", "Automotive", "Banking & Finance", "Beauty & Cosmetics",
  "Biotechnology", "Cannabis", "Chemical", "Cloud Computing", "Construction",
  "Consulting", "Consumer Goods", "Cybersecurity", "Data & Analytics",
  "Defense", "E-commerce", "Education", "Energy & Utilities", "Engineering",
  "Entertainment", "Environmental Services", "Events & Hospitality",
  "Fashion & Apparel", "Film & Video Production", "Financial Services",
  "Food & Beverage", "Gaming", "Government & Public Sector", "Healthcare",
  "Home & Garden", "Human Resources", "Insurance", "Interior Design",
  "International Trade", "Internet Services", "Investment Banking",
  "Journalism & Media", "Legal & Law", "Logistics & Supply Chain",
  "Manufacturing", "Marketing", "Medical Devices", "Mining & Metals",
  "Music & Audio", "Nonprofit & NGO", "Personal Branding", "Pet Care",
  "Pharmaceuticals", "Photography", "Physical Therapy", "Podcasting",
  "Public Relations", "Publishing", "Real Estate", "Recruiting & Staffing",
  "Religion & Spirituality", "Renewable Energy", "Restaurants", "Retail",
  "Robotics", "SaaS (Software as a Service)", "Science & Research",
  "Security & Investigations", "Social Media", "Sports & Recreation",
  "Sustainability", "Tech Hardware", "Telecommunications", "Tourism & Travel",
  "Translation & Localization", "Transportation", "Venture Capital",
  "Veterinary", "Video Production", "Virtual Reality", "Wellness & Fitness",
  "Writing & Editing", "Other",
];

export const PRODUCT_CONFIGS: Record<Plan, ProductConfig> = {
  starter: {
    name: "Starter",
    tier: "starter",
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || "price_starter_monthly",
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY || "price_starter_yearly",
    monthlyAmount: 29,
    yearlyAmount: 290,
    postsPerWeek: 10,
    maxPlatforms: 1,
    features: [
      "10 AI-generated posts per week",
      "1 social media platform",
      "Basic brand voice",
      "Manual post approval",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    tier: "pro",
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly",
    monthlyAmount: 79,
    yearlyAmount: 790,
    postsPerWeek: 30,
    maxPlatforms: 3,
    features: [
      "30 AI-generated posts per week",
      "Up to 3 social media platforms",
      "Custom brand voice",
      "Edit & approval workflow",
      "AI learns from your edits",
      "Priority email & chat support",
    ],
  },
  agency: {
    name: "Agency",
    tier: "agency",
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY || "price_agency_monthly",
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_YEARLY || "price_agency_yearly",
    monthlyAmount: 199,
    yearlyAmount: 1990,
    postsPerWeek: 999,
    maxPlatforms: 10,
    features: [
      "Unlimited AI-generated posts",
      "Up to 10 social media platforms",
      "Custom brand voice per client",
      "Client management dashboard",
      "White-label exports",
      "Bulk generation across clients",
      "Dedicated account manager",
      "API access",
    ],
  },
};
