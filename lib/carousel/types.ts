/**
 * Carousel Engine Types
 *
 * Data model for the automated carousel generation system.
 * Each carousel is a 5-slide post sourced from the Intelligence Hub
 * and rendered as images for LinkedIn, Instagram, X, and TikTok.
 */

export type CarouselStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export type Platform = 'linkedin' | 'instagram' | 'x' | 'tiktok';

export type SlideType = 'hero' | 'signal' | 'insight' | 'personal' | 'closer';

export type PhotoCategory = 'headshots' | 'working' | 'speaking' | 'lifestyle' | 'team' | 'candid' | 'fire';

export type ContentCategory = 'growth' | 'authority' | 'bridge';

export type CTAVariant =
  | 'follow'
  | 'comment'
  | 'intelligence_report'
  | 'weekly_email'
  | 'ai_assessment'
  | 'battler_community'
  | 'strategy_call';

export type PersonalAngle =
  | 'origin_story'
  | 'lost_everything'
  | 'career_pivot'
  | 'battler_identity'
  | 'bali_lifestyle'
  | 'bridge_both'
  | 'raw_journey'
  | 'community_mates'
  | 'skill_stack'
  | 'operator_mindset'
  | 'the_why';

export interface SlideContent {
  slideNumber: number;
  slideType: SlideType;
  /** Gold label text (e.g. "THIS WEEK IN AI") */
  label: string;
  /** Main headline, max 8 words */
  headline: string;
  /** Optional subheadline or body text */
  body: string | null;
  /** Bullet points (for insight slide) */
  bullets: string[] | null;
  /** URL of the rendered PNG */
  imageUrl: string | null;
}

export interface CarouselContent {
  /** Content category determines CTA logic and messaging tone */
  contentCategory: ContentCategory;
  /** Slide 1: Hero image */
  hero: {
    imagePrompt: string;
    generatedImageUrl: string | null;
    category: string;
    headline: string;
  };
  /** Slide 2: The signal */
  signal: {
    label: string;
    headline: string;
    highlightWord: string;
    body: string;
  };
  /** Slide 3: Why it matters */
  insight: {
    label: string;
    headline: string;
    bullets: string[];
  };
  /** Slide 4: Personal photo + narrative */
  personal: {
    angle: PersonalAngle;
    text: string;
    photoPath: string | null;
  };
  /** Slide 5: Closer */
  closer: {
    ctaVariant: CTAVariant;
    ctaText: string;
  };
}

export interface CarouselCaption {
  linkedin: string;
  instagram: string;
  x: string;
  tiktok: string;
}

export interface Carousel {
  id: string;
  status: CarouselStatus;
  /** Source signal ID from Intelligence Hub */
  sourceSignalId: string;
  sourceSignalTitle: string;
  sourceSignalCategory: string;
  /** Generated content for all 5 slides */
  content: CarouselContent;
  /** Platform-specific captions */
  captions: CarouselCaption;
  /** URLs to rendered slide PNGs */
  slideUrls: string[];
  /** Platforms this carousel targets */
  platforms: Platform[];
  createdAt: string;
  approvedAt: string | null;
  /** Week number for frequency tracking */
  weekNumber: number;
  year: number;
}

/** Input for the generation pipeline */
export interface CarouselGenerateInput {
  /** Override signal selection - use this specific signal ID */
  signalId?: string;
  /** Override personal angle */
  personalAngle?: PersonalAngle;
  /** Override CTA variant */
  ctaVariant?: CTAVariant;
  /** Override photo path */
  photoPath?: string;
}

/** Slide dimensions per platform */
export const SLIDE_DIMENSIONS: Record<Platform, { width: number; height: number }> = {
  linkedin: { width: 1080, height: 1350 },
  instagram: { width: 1080, height: 1350 },
  x: { width: 1200, height: 675 },
  tiktok: { width: 1080, height: 1920 },
};

/**
 * CTA options with weighted probabilities.
 *
 * Distribution from USP Brand Document:
 * - Follow the account: 20%
 * - Leave a comment: 15%
 * - Weekly AI Intelligence Report signup: 15%
 * - Weekly 3-2-1 email brief signup: 15%
 * - Free 10-page AI Assessment: 15%
 * - Battler community/follow hook: 10%
 * - Book a strategy call: 10%
 *
 * CTA logic by post type:
 * - Growth posts: follow, comment, battler_community
 * - Bridge posts: weekly_email, intelligence_report, battler_community
 * - Authority posts: ai_assessment, strategy_call, intelligence_report
 */
export const CTA_WEIGHTS: Array<{ variant: CTAVariant; weight: number; text: string; audience: 'battler' | 'operator' | 'both'; postTypes: ContentCategory[] }> = [
  { variant: 'follow', weight: 20, text: 'Follow @joshbuildswithai for more.', audience: 'both', postTypes: ['growth'] },
  { variant: 'comment', weight: 15, text: 'Drop your thoughts in the comments.', audience: 'both', postTypes: ['growth'] },
  { variant: 'intelligence_report', weight: 15, text: 'Subscribe to our weekly AI Intelligence Report. 200+ news pieces distilled into what actually matters. Link in bio.', audience: 'both', postTypes: ['bridge', 'authority'] },
  { variant: 'weekly_email', weight: 15, text: 'Get the weekly 3-2-1 AI brief straight to your inbox. Link in bio.', audience: 'both', postTypes: ['bridge'] },
  { variant: 'ai_assessment', weight: 15, text: 'If you run a business, get a free 10-page AI Assessment tailored to your operations. Link in bio.', audience: 'operator', postTypes: ['authority'] },
  { variant: 'battler_community', weight: 10, text: 'If you are a battler wanting to escape the 9-5 and build with AI, hit follow. Something is coming for you.', audience: 'battler', postTypes: ['growth', 'bridge'] },
  { variant: 'strategy_call', weight: 10, text: 'Already running a business and want AI leverage? Book a free strategy call. Link in bio.', audience: 'operator', postTypes: ['authority'] },
];
