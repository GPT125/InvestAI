import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Users, Clock, DollarSign, TrendingUp, TrendingDown, Copy, Check, Bot, X, ChevronRight, Flame, Medal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatChangePercent, getChangeColor } from '../utils/formatters';
import api from '../api/client';

const DURATIONS = [
  { label: '1 Week', value: 7 },
  { label: '1 Month', value: 30 },
  { label: '3 Months', value: 90 },
  { label: '6 Months', value: 180 },
  { label: '1 Year', value: 365 },
  { label: '2 Years', value: 730 },
];

const BUDGETS = [
  { label: '$1,000', value: 1000 },
  { label: '$5,000', value: 5000 },
  { label: '$10,000', value: 10000 },
  { label: '$25,000', value: 25000 },
  { label: '$50,000', value: 50000 },
  { label: '$100,000', value: 100000 },
];

function CreateModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [budget, setBudget] = useState(10000);
  const [includeAI, setIncludeAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter a competition name'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/competitions', { name: name.trim(), duration_days: duration, starting_budget: budget, include_ai: includeAI });
      onCreated(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create competition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Trophy size={20} /> Create Competition</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Competition Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Spring Stock Challenge 2026"
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Duration</label>
            <div className="option-grid">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  className={`option-btn ${duration === d.value ? 'active' : ''}`}
                  onClick={() => setDuration(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Starting Budget</label>
            <div className="option-grid">
              {BUDGETS.map(b => (
                <button
                  key={b.value}
                  className={`option-btn ${budget === b.value ? 'active' : ''}`}
                  onClick={() => setBudget(b.value)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeAI}
                onChange={e => setIncludeAI(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary, #7c8cf8)' }}
              />
              <div>
                <span style={{ color: '#e0e0e0', fontWeight: 500 }}>Challenge the AI Bot</span>
                <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>
                  Compete against our AI which analyzes all available market data to make trades
                </p>
              </div>
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="create-comp-btn" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create & Get Invite Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompetitionCard({ comp, onJoin, currentUserId }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const isOwner = comp.created_by === currentUserId;
  const myEntry = comp.participants?.find(p => p.user_id === currentUserId);
  const isActive = comp.status === 'active';
  const isPending = comp.status === 'pending';

  const copyLink = (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/competitions?join=${comp.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sorted = [...(comp.participants || [])].sort((a, b) => b.portfolio_value - a.portfolio_value);
  const myRank = sorted.findIndex(p => p.user_id === currentUserId) + 1;

  const daysLeft = comp.end_date
    ? Math.max(0, Math.ceil((new Date(comp.end_date) - new Date()) / 86400000))
    : null;

  return (
    <div className="comp-card" onClick={() => navigate(`/competitions/${comp.id}`)}>
      <div className="comp-card-header">
        <div>
          <h3 className="comp-name">{comp.name}</h3>
          <div className="comp-meta">
            <span className={`comp-status status-${comp.status}`}>{comp.status}</span>
            {daysLeft !== null && isActive && (
              <span className="comp-days"><Clock size={12} /> {daysLeft}d left</span>
            )}
            <span className="comp-participants"><Users size={12} /> {comp.participants?.length || 0} players</span>
          </div>
        </div>
        <div className="comp-budget">
          <DollarSign size={14} />
          {formatCurrency(comp.starting_budget)}
        </div>
      </div>

      {myEntry && (
        <div className="comp-my-stats">
          <div className="comp-stat">
            <span className="comp-stat-label">My Value</span>
            <span className="comp-stat-value">{formatCurrency(myEntry.portfolio_value)}</span>
          </div>
          <div className="comp-stat">
            <span className="comp-stat-label">Return</span>
            <span className="comp-stat-value" style={{ color: getChangeColor(myEntry.return_pct) }}>
              {myEntry.return_pct >= 0 ? '+' : ''}{myEntry.return_pct?.toFixed(2)}%
            </span>
          </div>
          <div className="comp-stat">
            <span className="comp-stat-label">Rank</span>
            <span className="comp-stat-value">#{myRank || '—'}</span>
          </div>
        </div>
      )}

      {/* Leaderboard preview */}
      {sorted.length > 0 && (
        <div className="comp-leaderboard-preview">
          {sorted.slice(0, 3).map((p, i) => (
            <div key={p.user_id} className="comp-leader-row">
              <span className="comp-rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </span>
              <span className="comp-leader-name">
                {p.is_ai ? <><Bot size={12} /> AI Bot</> : (p.display_name || 'Player')}
              </span>
              <span className="comp-leader-value" style={{ color: getChangeColor(p.return_pct) }}>
                {p.return_pct >= 0 ? '+' : ''}{p.return_pct?.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="comp-card-footer">
        {!myEntry && !isOwner && isPending && (
          <button className="comp-join-btn" onClick={e => { e.stopPropagation(); onJoin(comp.id); }}>
            Join Competition
          </button>
        )}
        {isOwner && (
          <button className="comp-copy-btn" onClick={copyLink}>
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Invite Link</>}
          </button>
        )}
        <button className="comp-view-btn">
          View Details <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Competitions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'public'

  // Check for join code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join');
    if (joinId && user) {
      handleJoin(joinId);
    }
  }, [user]);

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/competitions');
      setCompetitions(res.data || []);
    } catch {
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (compId) => {
    try {
      await api.post(`/competitions/${compId}/join`);
      // Remove join param from URL
      const url = new URL(window.location);
      url.searchParams.delete('join');
      window.history.replaceState({}, '', url);
      loadCompetitions();
      navigate(`/competitions/${compId}`);
    } catch (e) {
      console.error('Failed to join competition:', e);
    }
  };

  const myComps = competitions.filter(c =>
    c.participants?.some(p => p.user_id === user?.id) || c.created_by === user?.id
  );
  const publicComps = competitions.filter(c =>
    !c.participants?.some(p => p.user_id === user?.id) && c.created_by !== user?.id
  );

  const displayed = activeTab === 'my' ? myComps : publicComps;

  if (!user) {
    return (
      <div className="competitions-page">
        <div className="comp-empty" style={{ marginTop: 60 }}>
          <Trophy size={48} style={{ color: 'var(--color-primary, #7c8cf8)', opacity: 0.4 }} />
          <h2>Stock Trading Competitions</h2>
          <p>Sign in to create or join competitions and compete against friends or the AI.</p>
          <button className="create-comp-btn" onClick={() => navigate('/login')}>
            Sign In to Compete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="competitions-page">
      <div className="comp-page-header">
        <div>
          <h1><Trophy size={24} /> Competitions</h1>
          <p className="comp-subtitle">Challenge friends or the AI to stock trading competitions</p>
        </div>
        <button className="create-comp-btn" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Competition
        </button>
      </div>

      {/* How it works */}
      <div className="comp-info-banner">
        <div className="comp-info-item">
          <Trophy size={20} style={{ color: '#f59e0b' }} />
          <div>
            <strong>Create or Join</strong>
            <p>Set up a custom competition and invite friends with a link</p>
          </div>
        </div>
        <div className="comp-info-item">
          <DollarSign size={20} style={{ color: '#22c55e' }} />
          <div>
            <strong>Virtual Budget</strong>
            <p>Trade with virtual money — buy/sell stocks on real-time prices</p>
          </div>
        </div>
        <div className="comp-info-item">
          <Bot size={20} style={{ color: 'var(--color-primary, #7c8cf8)' }} />
          <div>
            <strong>AI Challenge</strong>
            <p>Optionally compete against our AI that analyzes all market data</p>
          </div>
        </div>
        <div className="comp-info-item">
          <Medal size={20} style={{ color: '#ef4444' }} />
          <div>
            <strong>Leaderboard</strong>
            <p>Track rankings by portfolio return % in real time</p>
          </div>
        </div>
      </div>

      <div className="comp-tabs">
        <button className={`comp-tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
          My Competitions ({myComps.length})
        </button>
        <button className={`comp-tab ${activeTab === 'public' ? 'active' : ''}`} onClick={() => setActiveTab('public')}>
          Open to Join ({publicComps.length})
        </button>
      </div>

      {loading ? (
        <div className="comp-loading">Loading competitions...</div>
      ) : displayed.length === 0 ? (
        <div className="comp-empty">
          <Trophy size={48} style={{ color: 'var(--color-primary, #7c8cf8)', opacity: 0.3 }} />
          <h3>{activeTab === 'my' ? 'No competitions yet' : 'No open competitions'}</h3>
          <p>{activeTab === 'my' ? 'Create a competition and invite friends!' : 'All competitions require an invite link.'}</p>
          {activeTab === 'my' && (
            <button className="create-comp-btn" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Competition
            </button>
          )}
        </div>
      ) : (
        <div className="comp-grid">
          {displayed.map(comp => (
            <CompetitionCard
              key={comp.id}
              comp={comp}
              onJoin={handleJoin}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(comp) => {
            setCompetitions(prev => [comp, ...prev]);
            navigate(`/competitions/${comp.id}`);
          }}
        />
      )}
    </div>
  );
}
