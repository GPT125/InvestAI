/**
 * Subscription tier helpers.
 *
 * Tier is stored in user.settings.tier. Valid values: 'free' | 'pro' | 'max'.
 * Daily usage counters are stored per-user in localStorage so the free-tier
 * limits persist even when the backend (Render free tier) loses state.
 */

export const TIER_LIMITS = {
  free: {
    chatPerDay: 10,
    analysisPerDay: 5,
    imageUpload: false,
    fileUpload: false,
    unlimitedContext: false,
    label: 'Free',
  },
  pro: {
    chatPerDay: 100,
    analysisPerDay: 50,
    imageUpload: true,
    fileUpload: true,
    unlimitedContext: false,
    label: 'Pro',
  },
  max: {
    chatPerDay: Infinity,
    analysisPerDay: Infinity,
    imageUpload: true,
    fileUpload: true,
    unlimitedContext: true,
    label: 'Max',
  },
};

export function getTier(user) {
  const t = user?.settings?.tier;
  if (t === 'pro' || t === 'max') return t;
  return 'free';
}

export function getTierLimits(user) {
  return TIER_LIMITS[getTier(user)];
}

/** Key for today's usage counter */
const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const usageKey = (userId) => `investai-usage-${userId || 'guest'}-${todayKey()}`;

export function getTodayChatCount(userId) {
  try {
    const raw = localStorage.getItem(usageKey(userId));
    const obj = raw ? JSON.parse(raw) : {};
    return obj.chat || 0;
  } catch {
    return 0;
  }
}

export function incrementChatCount(userId) {
  try {
    const key = usageKey(userId);
    const raw = localStorage.getItem(key);
    const obj = raw ? JSON.parse(raw) : {};
    obj.chat = (obj.chat || 0) + 1;
    localStorage.setItem(key, JSON.stringify(obj));
    return obj.chat;
  } catch {
    return 0;
  }
}

export function remainingChats(user) {
  const limit = getTierLimits(user).chatPerDay;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - getTodayChatCount(user?.id));
}
