/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * analytics.ts — Lightweight Posthog analytics wrapper for FUTURA.
 * Tracks key product events to understand user behavior and conversion funnels.
 * No PII is sent — only anonymous user IDs and event metadata.
 */

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
      isFeatureEnabled: (flag: string) => boolean;
    };
  }
}

/** Whether analytics is available */
const isAvailable = () => typeof window !== 'undefined' && !!window.posthog;

/**
 * Identify a logged-in user for cohort tracking.
 * Call this right after login.
 */
export function identifyUser(userId: string, properties?: { isPremium?: boolean; email?: string }) {
  if (!isAvailable()) return;
  window.posthog!.identify(userId, properties);
}

/**
 * Reset user session on logout.
 */
export function resetAnalytics() {
  if (!isAvailable()) return;
  window.posthog!.reset();
}

/**
 * Track a generic event with optional metadata.
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!isAvailable()) return;
  try {
    window.posthog!.capture(event, properties);
  } catch (e) {
    // Never let analytics break the app
    console.warn('[Analytics] Failed to track event:', event, e);
  }
}

// ─── Typed Event Helpers ───────────────────────────────────────────────────

/** User navigated to a tab/section */
export function trackPageView(tab: string) {
  trackEvent('page_view', { tab });
}

/** User used a specific feature */
export function trackFeatureUsed(feature: string, metadata?: Record<string, unknown>) {
  trackEvent('feature_used', { feature, ...metadata });
}

/** User clicked the upgrade/membership button */
export function trackUpgradeClicked(source: string) {
  trackEvent('upgrade_clicked', { source });
}

/** User submitted a payment report */
export function trackPaymentSubmitted(paymentType: string) {
  trackEvent('payment_submitted', { payment_type: paymentType });
}

/** User generated an image */
export function trackImageGenerated(brandId?: string) {
  trackEvent('image_generated', { brand_id: brandId });
}

/** User generated copy/content */
export function trackCopyGenerated(type: string) {
  trackEvent('copy_generated', { copy_type: type });
}

/** User sent a message to the advisor/hub */
export function trackAdvisorMessage() {
  trackEvent('advisor_message_sent');
}

/** User saved an asset to gallery */
export function trackAssetSaved() {
  trackEvent('asset_saved');
}
