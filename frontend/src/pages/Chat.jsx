import { useState, useRef, useEffect } from 'react';
import { chatWithAI, getConversations } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare, Send, Bot, User, Plus, Trash2, Edit3, Check, X, Clock,
  Sparkles, TrendingUp, BarChart3, HelpCircle, ChevronLeft, ChevronRight,
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

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: "What are today's top performing stocks?", label: "Top Movers" },
  { icon: BarChart3,  text: "Analyze AAPL stock for me — is it a good buy?", label: "Stock Analysis" },
  { icon: Sparkles,   text: "Compare QQQ vs SPY for long-term investment",   label: "ETF Compare" },
  { icon: HelpCircle, text: "Explain P/E ratio and why it matters",          label: "Learn Investing" },
];

export default function Chat() {
  const { user } = useAuth();
  const userKey = user?.id || 'guest';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations from localStorage, then merge any server-side convos.
  // localStorage is the source of truth so we survive server wipes.
  useEffect(() => {
    if (!user) return;
    setConversations(listConversations(userKey));

    // Best-effort: pull server convos in case we're on a new device
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
  };

  const handleSelectConvo = (convo) => {
    const fresh = getLocalConversation(userKey, convo.id);
    setActiveConvo(fresh || convo);
    setMessages(fresh?.messages || []);
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

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    // Ensure we have an active conversation (create locally if needed)
    let convo = activeConvo;
    if (!convo) {
      convo = createLocalConversation(userKey, makeTitle(msg));
      setActiveConvo(convo);
    } else if (convo.title === 'New Chat') {
      // Auto-title conversation from first message
      renameLocalConversation(userKey, convo.id, makeTitle(msg));
      convo = { ...convo, title: makeTitle(msg) };
      setActiveConvo(convo);
    }

    // Persist user message locally IMMEDIATELY
    appendLocalMessage(userKey, convo.id, 'user', msg);
    const userMsg = { role: 'user', content: msg, timestamp: Math.floor(Date.now() / 1000) };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    refreshConvos();
    setInput('');
    setLoading(true);

    try {
      const history = currentMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await chatWithAI(msg, history);
      const response = res.data.response;

      // Persist assistant reply locally
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
            </>
          )}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-main-header">
          <h1><MessageSquare size={22} /> AI Stock Assistant</h1>
          {!user && <span className="chat-login-hint">Sign in to save chat history</span>}
        </div>

        <div className="chat-window-v2">
          {isEmptyState ? (
            <div className="chat-empty-state">
              <Bot size={48} className="chat-empty-icon" />
              <h2>How can I help you today?</h2>
              <p>Ask me anything about stocks, ETFs, market trends, or investment concepts.</p>
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
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <div className="chat-input-v2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any stock, ETF, or market trend..."
            rows={1}
            disabled={loading}
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="send-btn-v2">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
