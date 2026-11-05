/**
 * Cookieless analytics. Every event carries session_id (random, per tab), lang, mode and ref. Nothing identifies a person.
 *
 * Sends to Plausible when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, and/or PostHog (cookieless, no person profiles)
 * when NEXT_PUBLIC_POSTHOG_KEY is set. With neither, events are only logged to the console in development
 * and kept in window.__scentEvents for manual checks.
 */

export type EventName =
  | 'quiz_start'
  | 'question_answered'
  | 'quiz_complete'
  | 'result_view'
  | 'card_download'
  | 'share_click'
  | 'sample_click'
  | 'buy_click'
  | 'accuracy_rating'
  | 'compare_complete'
  | 'tried_feedback';

type Props = Record<string, string | number | boolean | null | string[]>;

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '';
const PLAUSIBLE_HOST = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || 'https://plausible.io';
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

const context: { lang: string; mode: string; ref: string | null } = { lang: 'en', mode: 'self', ref: null };

export function setAnalyticsContext(c: Partial<typeof context>) {
  Object.assign(context, c);
}

let sessionId: string | null = null;
function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem('scenttype.sid');
  } catch {}
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try {
      sessionStorage.setItem('scenttype.sid', sessionId);
    } catch {}
  }
  return sessionId;
}

export function track(event: EventName, props: Props = {}) {
  if (typeof window === 'undefined') return;
  const payload = { session_id: getSessionId(), lang: context.lang, mode: context.mode, ref: context.ref, ...props };

  const w = window as unknown as { __scentEvents?: unknown[] };
  (w.__scentEvents ??= []).push({ event, ...payload });
  if (process.env.NODE_ENV !== 'production') console.info('[analytics]', event, payload);

  // Plausible custom props must be scalars.
  if (PLAUSIBLE_DOMAIN) {
    const flat: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(payload)) if (v !== null) flat[k] = Array.isArray(v) ? v.join(',') : v;
    send(`${PLAUSIBLE_HOST}/api/event`, { name: event, url: location.href, domain: PLAUSIBLE_DOMAIN, props: flat });
  }
  if (POSTHOG_KEY) {
    send(`${POSTHOG_HOST}/capture/`, {
      api_key: POSTHOG_KEY,
      event,
      properties: { distinct_id: payload.session_id, $process_person_profile: false, $current_url: location.href, ...payload },
    });
  }
}

function send(url: string, body: unknown) {
  try {
    const data = JSON.stringify(body);
    if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([data], { type: 'text/plain' }))) return;
    fetch(url, { method: 'POST', body: data, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch {}
}
