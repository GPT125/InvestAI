import { useState, useRef, useEffect } from 'react';
import { chatWithAI, getConversations, createConversation, getConversationMessages, deleteConversation, renameConversation, chatInConversation } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Bot, User, Plus, Trash2, Edit3, Check, X, Clock, Sparkles, TrendingUp, BarChart3, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: "What are today's top performing stocks?", label: "Top Movers" },
  { icon: BarChart3, text: "Analyze AAPL stock for me — is it a good buy?", label: "Stock Analysis" },
  { icon: Sparkles, text: "Compare QQQ vs SPY for long-term investment", label: "ETF Compare" },
  { icon: HelpCircle, text: "Explain P/E ratio and why it matters", label: "Learn Investing" },
];

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount if logged in
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    setLoadingConvos(true);
    try {
      const res = await getConversations();
      setConversations(res.data || []);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConvos(false);
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setActiveConvo(null);
    if (user) {
      try {
        const res = await createConversation("New Chat");
        setActiveConvo(res.data);
        await loadConversations();
      } catch {}
    }
  };

  const handleSelectConvo = async (convo) => {
    setActiveConvo(convo);
    try {
      const res = await getConversationMessages(convo.id);
      setMessages(res.data || []);
    } catch {
      setMessages([]);
    }
  };

  const handleDeleteConvo = async (e, convoId) => {
    e.stopPropagation();
    try {
      await deleteConversation(convoId);
      if (activeConvo?.id === convoId) {
        setMessages([]);
        setActiveConvo(null);
      }
      await loadConversations();
    } catch {}
  };

  const handleStartRename = (e, convo) => {
    e.stopPropagation();
    setEditingId(convo.id);
    setEditTitle(convo.title);
  };

  const handleSaveRename = async (e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      try {
        await renameConversation(editingId, editTitle.trim());
        await loadConversations();
      } catch {}
    }
    setEditingId(null);
  };

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInput('');
    setLoading(true);

    try {
      const history = currentMessages.map((m) => ({ role: m.role, content: m.content }));

      let response;
      if (user && activeConvo) {
        // Logged in with active conversation — save to history
        const res = await chatInConversation(activeConvo.id, msg, history);
        response = res.data.response;
        // Refresh conversation list (title may have updated)
        loadConversations();
      } else if (user && !activeConvo) {
        // Logged in but no convo yet — create one first
        const convoRes = await createConversation("New Chat");
        const newConvo = convoRes.data;
        setActiveConvo(newConvo);
        const res = await chatInConversation(newConvo.id, msg, history);
        response = res.data.response;
        loadConversations();
      } else {
        // Not logged in — just chat without saving
        const res = await chatWithAI(msg, history);
        response = res.data.response;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
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
                {loadingConvos ? (
                  <div className="convo-loading">Loading...</div>
                ) : conversations.length > 0 ? (
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
