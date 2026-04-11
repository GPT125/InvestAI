import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatWithAI, getConversations } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare, Send, Bot, User, Plus, Trash2, Edit3, Check, X, Clock,
  Sparkles, TrendingUp, BarChart3, HelpCircle, ChevronLeft, ChevronRight,
  Paperclip, Image as ImageIcon, Zap, Crown, Lock, Mic, Globe, Lightbulb,
  FileText as FileIcon,
} from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';
import {
  listConversations,
  createLocalConversation,
  getLocalConversation,
  appendLocalMessage,
  renameLocalConversation,
  deleteLocalConversation,
  mergeServerConversations,
} from '../utils/chatStore';
import {
  getTier, getTierLimits, incrementChatCount, remainingChats,
} from '../utils/tier';

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: "What are today's top performing stocks?",           label: "Top Movers" },
  { icon: BarChart3,  text: "Analyze AAPL stock for me — is it a good buy?",     label: "Stock Analysis" },
  { icon: Sparkles,   text: "Compare QQQ vs SPY for long-term investment",       label: "ETF Compare" },
  { icon: HelpCircle, text: "Explain P/E ratio and why it matters",              label: "Learn Investing" },
  { icon: Globe,      text: "What's happening in global markets today?",         label: "Global Pulse" },
  { icon: Lightbulb,  text: "Give me 3 dividend stocks for passive income",      label: "Dividend Ideas" },
];

/** Convert a browser File to a data URL so we can preview + ship to backend. */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Chat() {
  const { user } = useAuth();
  const userKey = user?.id || 'guest';
  const tier = getTier(user);
  const limits = getTierLimits(user);
  const isFree = tier === 'free';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ name, type, dataUrl, size }]
  const [remaining, setRemaining] = useState(() => remainingChats(user));
  const [showLimitModal, setShowLimitModal] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations from localStorage + optional server merge
  useEffect(() => {
    if (!user) return;
    setConversations(listConversations(userKey));
    setRemaining(remainingChats(user));

    if (!user.isGuest) {
      getConversations()
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            mergeServerConversations(userKey, res.data);
            setConversations(listConversations(userKey));
          }
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshConvos = () => setConversations(listConversations(userKey));

  const handleNewChat = () => {
    setMessages([]);
    setActiveConvo(null);
    setAttachments([]);
  };

  const handleSelectConvo = (convo) => {
    const fresh = getLocalConversation(userKey, convo.id);
    setActiveConvo(fresh || convo);
    setMessages(fresh?.messages || []);
    setAttachments([]);
  };

  const handleDeleteConvo = (e, convoId) => {
    e.stopPropagation();
    deleteLocalConversation(userKey, convoId);
    if (activeConvo?.id === convoId) {
      setMessages([]);
      setActiveConvo(null);
    }
    refreshConvos();
  };

  const handleStartRename = (e, convo) => {
    e.stopPropagation();
    setEditingId(convo.id);
    setEditTitle(convo.title);
  };

  const handleSaveRename = (e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameLocalConversation(userKey, editingId, editTitle.trim());
      refreshConvos();
    }
    setEditingId(null);
  };

  /** Derive a short title from the first user message. */
  const makeTitle = (msg) => {
    const clean = msg.replace(/\s+/g, ' ').trim();
    return clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
  };

  // ── Attachments ────────────────────────────────────────────────────────
  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    // Gate file upload on tier (free cannot upload)
    if (!limits.fileUpload) {
      setShowLimitModal(true);
      return;
    }

    const MAX = 10 * 1024 * 1024; // 10 MB per file
    const valid = files.filter((f) => f.size <= MAX);
    const processed = await Promise.all(
      valid.map(async (f) => ({
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl: await fileToDataURL(f),
      }))
    );
    setAttachments((prev) => [...prev, ...processed].slice(0, 6)); // cap at 6
  };

  const removeAttachment = (i) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  };

  // Paste-image support
  useEffect(() => {
    const onPaste = async (e) => {
      if (!inputRef.current || document.activeElement !== inputRef.current) return;
      const items = e.clipboardData?.items || [];
      const images = [];
      for (const it of items) {
        if (it.type?.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) images.push(file);
        }
      }
      if (images.length) {
        e.preventDefault();
        if (!limits.imageUpload) {
          setShowLimitModal(true);
          return;
        }
        handleFilesSelected(images);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits.imageUpload]);

  // ── Send ───────────────────────────────────────────────────────────────
  const handleSend = async (text) => {
    const msg = text || input.trim();
    if ((!msg && attachments.length === 0) || loading) return;

    // Enforce daily limit for free tier
    if (remaining <= 0) {
      setShowLimitModal(true);
      return;
    }

    // Ensure active convo
    let convo = activeConvo;
    if (!convo) {
      convo = createLocalConversation(userKey, makeTitle(msg || 'New chat'));
      setActiveConvo(convo);
    } else if (convo.title === 'New Chat' && msg) {
      renameLocalConversation(userKey, convo.id, makeTitle(msg));
      convo = { ...convo, title: makeTitle(msg) };
      setActiveConvo(convo);
    }

    // Build the outgoing user content. Attachments are embedded as markdown
    // so they show in history and the AI sees them textually.
    const attachText = attachments.length
      ? '\n\n' + attachments.map((a) => {
          if (a.type.startsWith('image/')) return `📎 Image attached: **${a.name}**`;
          return `📎 File attached: **${a.name}** (${Math.round(a.size / 1024)} KB)`;
        }).join('\n')
      : '';
    const outgoing = (msg || '(no text)') + attachText;

    appendLocalMessage(userKey, convo.id, 'user', outgoing);
    const userMsg = {
      role: 'user',
      content: outgoing,
      timestamp: Math.floor(Date.now() / 1000),
      attachments: attachments.length ? attachments.map((a) => ({ name: a.name, type: a.type, dataUrl: a.dataUrl })) : undefined,
    };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    refreshConvos();
    setInput('');
    setAttachments([]);
    setLoading(true);

    // Track free-tier usage
    if (isFree) {
      incrementChatCount(user?.id);
      setRemaining(remainingChats(user));
    }

    try {
      const history = currentMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await chatWithAI(msg || 'Analyze the attached material.', history);
      const response = res.data.response;

      appendLocalMessage(userKey, convo.id, 'assistant', response);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response, timestamp: Math.floor(Date.now() / 1000) },
      ]);
      refreshConvos();
    } catch {
      const errMsg = 'Sorry, I encountered an error. Please try again.';
      appendLocalMessage(userKey, convo.id, 'assistant', errMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errMsg, timestamp: Math.floor(Date.now() / 1000) },
      ]);
      refreshConvos();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isEmptyState = messages.length === 0 && !loading;

  // Show upgrade banner in chat when free user is running low or every few messages
  const showInlineUpgrade =
    isFree && !isEmptyState && (remaining <= 3 || messages.length >= 6);

  return (
    <div className="chat-page-v2">
      {/* Sidebar */}
      {user && (
        <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="chat-sidebar-header">
            {sidebarOpen && <h3>Chat History</h3>}
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {sidebarOpen && (
            <>
              <button className="new-chat-btn" onClick={handleNewChat}>
                <Plus size={14} /> New Chat
              </button>

              <div className="convo-list">
                {conversations.length > 0 ? (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      className={`convo-item ${activeConvo?.id === c.id ? 'active' : ''}`}
                      onClick={() => handleSelectConvo(c)}
                    >
                      {editingId === c.id ? (
                        <div className="convo-edit-row" onClick={(e) => e.stopPropagation()}>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e)}
                            autoFocus
                            className="convo-edit-input"
                          />
                          <button onClick={handleSaveRename}><Check size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }}><X size={12} /></button>
                        </div>
                      ) : (
                        <>
                          <div className="convo-item-content">
                            <MessageSquare size={13} />
                            <span className="convo-title">{c.title}</span>
                          </div>
                          <div className="convo-item-meta">
                            <span className="convo-time">{formatTime(c.updatedAt)}</span>
                            <div className="convo-actions">
                              <button onClick={(e) => handleStartRename(e, c)} title="Rename"><Edit3 size={11} /></button>
                              <button onClick={(e) => handleDeleteConvo(e, c.id)} title="Delete"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="convo-empty">
                    <Clock size={16} />
                    <span>No conversations yet</span>
                  </div>
                )}
              </div>

              {/* Sidebar upgrade pill for free users */}
              {isFree && (
                <Link to="/pricing" className="chat-sidebar-upgrade">
                  <Crown size={14} />
                  <div>
                    <strong>Upgrade to Pro</strong>
                    <span>Unlimited chats, file uploads, more</span>
                  </div>
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-main-header">
          <div className="chat-header-left">
            <h1><MessageSquare size={22} /> AI Stock Assistant</h1>
            {!user && <span className="chat-login-hint">Sign in to save chat history</span>}
          </div>
          <div className="chat-header-right">
            {user && (
              <Link
                to="/pricing"
                className={`chat-tier-badge tier-${tier}`}
                title={
                  isFree
                    ? `Free plan — ${remaining === Infinity ? '∞' : remaining} messages left today`
                    : `${limits.label} plan — unlimited features`
                }
              >
                {tier === 'max' ? <Crown size={12} /> : tier === 'pro' ? <Zap size={12} /> : <Lock size={12} />}
                <span>{limits.label}</span>
                {isFree && (
                  <span className="chat-tier-counter">
                    {remaining === Infinity ? '∞' : `${remaining}/${limits.chatPerDay}`}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        <div className="chat-window-v2">
          {isEmptyState ? (
            <div className="chat-empty-state">
              <Bot size={48} className="chat-empty-icon" />
              <h2>How can I help you today?</h2>
              <p>Ask me anything about stocks, ETFs, market trends, or investment concepts. {limits.fileUpload ? 'Attach files or paste images to analyze them too.' : ''}</p>
              <div className="suggested-prompts">
                {SUGGESTED_PROMPTS.map((sp, i) => (
                  <button key={i} className="suggested-prompt" onClick={() => handleSend(sp.text)}>
                    <sp.icon size={16} />
                    <span>{sp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg-v2 ${msg.role}`}>
                  <div className="msg-avatar">
                    {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className="msg-bubble">
                    <div
                      className="msg-text"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                    {/* Attachment thumbnails */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="msg-attachments">
                        {msg.attachments.map((a, ai) => (
                          <div key={ai} className="msg-attachment">
                            {a.type.startsWith('image/') ? (
                              <img src={a.dataUrl} alt={a.name} />
                            ) : (
                              <div className="msg-file-chip"><FileIcon size={14} /> {a.name}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.timestamp && (
                      <span className="msg-time">{formatTime(msg.timestamp)}</span>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-msg-v2 assistant">
                  <div className="msg-avatar"><Bot size={18} /></div>
                  <div className="msg-bubble">
                    <div className="msg-text typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Inline upgrade nudge for free users */}
              {showInlineUpgrade && (
                <Link to="/pricing" className="chat-upgrade-inline">
                  <Zap size={16} />
                  <div>
                    <strong>
                      {remaining <= 0
                        ? "You've hit your daily free limit"
                        : remaining <= 3
                          ? `Only ${remaining} free messages left today`
                          : 'Want more from your AI assistant?'}
                    </strong>
                    <span>
                      Upgrade to Pro for 100 messages/day, file uploads, real-time data, and unlimited analysis.
                    </span>
                  </div>
                  <span className="chat-upgrade-cta">See plans →</span>
                </Link>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Attachment previews in input area */}
        {attachments.length > 0 && (
          <div className="chat-attachment-preview">
            {attachments.map((a, i) => (
              <div key={i} className="attachment-chip">
                {a.type.startsWith('image/') ? (
                  <img src={a.dataUrl} alt={a.name} />
                ) : (
                  <FileIcon size={14} />
                )}
                <span>{a.name}</span>
                <button onClick={() => removeAttachment(i)} title="Remove">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="chat-input-v2">
          {/* Tool buttons */}
          <div className="chat-input-tools">
            <button
              className="chat-tool-btn"
              onClick={() => {
                if (!limits.fileUpload) { setShowLimitModal(true); return; }
                fileInputRef.current?.click();
              }}
              title={limits.fileUpload ? 'Attach file' : 'Upgrade to upload files'}
            >
              <Paperclip size={16} />
              {!limits.fileUpload && <Lock size={9} className="chat-tool-lock" />}
            </button>
            <button
              className="chat-tool-btn"
              onClick={() => {
                if (!limits.imageUpload) { setShowLimitModal(true); return; }
                fileInputRef.current?.click();
              }}
              title={limits.imageUpload ? 'Attach image (or paste)' : 'Upgrade to upload images'}
            >
              <ImageIcon size={16} />
              {!limits.imageUpload && <Lock size={9} className="chat-tool-lock" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.csv,.md,.json"
              style={{ display: 'none' }}
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              limits.fileUpload
                ? 'Ask anything — or paste an image / attach a file...'
                : 'Ask about any stock, ETF, or market trend...'
            }
            rows={1}
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || (!input.trim() && attachments.length === 0)}
            className="send-btn-v2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Limit / upgrade modal */}
      {showLimitModal && (
        <div className="chat-limit-modal-backdrop" onClick={() => setShowLimitModal(false)}>
          <div className="chat-limit-modal" onClick={(e) => e.stopPropagation()}>
            <button className="chat-limit-close" onClick={() => setShowLimitModal(false)}>
              <X size={16} />
            </button>
            <div className="chat-limit-icon"><Crown size={28} /></div>
            <h2>Unlock Pro features</h2>
            <p>
              {remaining <= 0
                ? "You've used all your free messages for today. Upgrade to Pro for 100 messages per day, or Max for unlimited."
                : 'File and image uploads are available on Pro and Max plans. Upgrade to analyze earnings PDFs, chart screenshots, and your own documents with AI.'}
            </p>
            <ul className="chat-limit-features">
              <li><Check size={14} /> 100+ AI chat messages per day</li>
              <li><Check size={14} /> Upload PDFs, images, and documents</li>
              <li><Check size={14} /> Real-time market data (no delay)</li>
              <li><Check size={14} /> Unlimited stock analysis</li>
              <li><Check size={14} /> Priority support</li>
            </ul>
            <div className="chat-limit-actions">
              <button className="chat-limit-cancel" onClick={() => setShowLimitModal(false)}>
                Maybe later
              </button>
              <Link to="/pricing" className="chat-limit-upgrade" onClick={() => setShowLimitModal(false)}>
                <Zap size={14} /> View plans
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
