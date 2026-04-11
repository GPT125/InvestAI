/**
 * Per-user local chat-history store.
 *
 * Why this exists:
 *   The backend stores chat history in SQLite on Render's free tier, whose
 *   filesystem is ephemeral — data is wiped on every cold-start / redeploy.
 *   So we make localStorage the authoritative store. The backend is still
 *   called best-effort so chats can be re-synced from any device later.
 *
 * Storage layout (keyed per-user so accounts don't mix):
 *   investai-chats-<userId>  →  [
 *     { id, title, createdAt, updatedAt, messages: [{ role, content, timestamp }] },
 *     ...
 *   ]
 */

const keyFor = (userId) => `investai-chats-${userId || 'guest'}`;

function loadAll(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(userId, convos) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(convos));
  } catch {}
}

/** Return all conversations for a user, newest first. */
export function listConversations(userId) {
  return loadAll(userId).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/** Create a new conversation. Returns the new convo object. */
export function createLocalConversation(userId, title = 'New Chat') {
  const now = Math.floor(Date.now() / 1000);
  const id = `local-${now}-${Math.random().toString(36).slice(2, 8)}`;
  const convo = { id, title, createdAt: now, updatedAt: now, messageCount: 0, messages: [] };
  const all = loadAll(userId);
  all.unshift(convo);
  saveAll(userId, all);
  return convo;
}

/** Get a conversation with its messages. */
export function getLocalConversation(userId, convoId) {
  return loadAll(userId).find((c) => c.id === convoId) || null;
}

/** Append a message to a conversation and bump updatedAt. */
export function appendLocalMessage(userId, convoId, role, content) {
  const all = loadAll(userId);
  const convo = all.find((c) => c.id === convoId);
  if (!convo) return null;
  const now = Math.floor(Date.now() / 1000);
  convo.messages = convo.messages || [];
  convo.messages.push({ role, content, timestamp: now });
  convo.updatedAt = now;
  convo.messageCount = convo.messages.length;
  saveAll(userId, all);
  return convo;
}

/** Rename a conversation. */
export function renameLocalConversation(userId, convoId, title) {
  const all = loadAll(userId);
  const convo = all.find((c) => c.id === convoId);
  if (!convo) return false;
  convo.title = title;
  convo.updatedAt = Math.floor(Date.now() / 1000);
  saveAll(userId, all);
  return true;
}

/** Delete a conversation. */
export function deleteLocalConversation(userId, convoId) {
  const all = loadAll(userId).filter((c) => c.id !== convoId);
  saveAll(userId, all);
}

/**
 * Merge server convos back into local store. Preserves any local-only convos
 * and adopts any server convos we don't have yet. Useful on first login.
 */
export function mergeServerConversations(userId, serverConvos) {
  if (!Array.isArray(serverConvos) || serverConvos.length === 0) return;
  const local = loadAll(userId);
  const byId = new Map(local.map((c) => [c.id, c]));
  for (const s of serverConvos) {
    if (!s || !s.id) continue;
    if (!byId.has(s.id)) {
      byId.set(s.id, { ...s, messages: s.messages || [] });
    } else {
      // Prefer the newer updatedAt
      const existing = byId.get(s.id);
      if ((s.updatedAt || 0) > (existing.updatedAt || 0)) {
        byId.set(s.id, { ...existing, ...s, messages: existing.messages });
      }
    }
  }
  saveAll(userId, Array.from(byId.values()));
}
