/**
 * Carousel Engine
 *
 * Automated carousel generation from Intelligence Hub signals.
 * Produces 5-slide carousels rendered as PNGs for all platforms.
 * Distribution handled externally via Postbridge.
 *
 * Usage:
 *   import { generateCarousel } from '@/lib/carousel';
 *
 *   const result = await generateCarousel();
 *   // or with overrides:
 *   const result = await generateCarousel({
 *     signalId: 'specific-signal-uuid',
 *     personalAngle: 'battler_identity',
 *     ctaVariant: 'follow',
 *   });
 */

export { generateCarousel } from './pipeline';
export type { PipelineResult } from './pipeline';
export { notifyCarouselReady, notifyCarouselApproved, notifyWeeklySummary } from './notify';
export { checkWeeklyLimit, isTodayScheduled, getScheduledDays } from './frequency';
export type {
  Carousel,
  CarouselContent,
  CarouselCaption,
  CarouselGenerateInput,
  CarouselStatus,
  Platform,
  SlideType,
  CTAVariant,
  PersonalAngle,
} from './types';
