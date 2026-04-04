import { useState, useEffect } from 'react';
import axios from 'axios';
import { Scan, ArrowUpRight, ArrowDownRight, AlertCircle, Activity, Shield, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

const PATTERN_COLORS = { bullish: '#22c55e', bearish: '#ef4444', neutral: '#f59e0b' };

export default function SmartPatterns() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patterns/scan?limit=30');
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Scanning for technical patterns...</p></div>;

  const detections = data?.detections || [];
  const filtered = filter === 'all' ? detections : filter === 'bullish' ? detections.filter(d => d.bullishCount > d.bearishCount) : detections.filter(d => d.bearishCount > d.bullishCount);
  const summary = data?.summary || {};

  return (
    <div className="patterns-page">
      <div className="page-header-row">
        <div>
          <h1><Scan size={28} /> Smart Pattern Scanner</h1>
          <p className="page-subtitle">AI-powered technical pattern detection across the market</p>
        </div>
        <button className="refresh-btn" onClick={loadData}><Activity size={16} /> Rescan</button>
      </div>

      {/* Summary Stats */}
      <div className="pattern-summary-row">
        <div className="summary-stat">
          <span className="stat-num">{summary.totalScanned || 0}</span>
          <span className="stat-label">Stocks Scanned</span>
        </div>
        <div className="summary-stat">
          <span className="stat-num">{summary.withPatterns || 0}</span>
          <span className="stat-label">Patterns Found</span>
        </div>
        <div className="summary-stat bullish">
          <ArrowUpRight size={18} />
          <span className="stat-num">{(summary.topBullish || []).length}</span>
          <span className="stat-label">Bullish Signals</span>
        </div>
        <div className="summary-stat bearish">
          <ArrowDownRight size={18} />
          <span className="stat-num">{(summary.topBearish || []).length}</span>
          <span className="stat-label">Bearish Signals</span>
        </div>
      </div>

      {/* Filter */}
      <div className="pattern-filters">
        <Filter size={16} />
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All ({detections.length})</button>
        <button className={filter === 'bullish' ? 'active' : ''} onClick={() => setFilter('bullish')}>Bullish</button>
        <button className={filter === 'bearish' ? 'active' : ''} onClick={() => setFilter('bearish')}>Bearish</button>
      </div>

      {/* Detection Cards */}
      <div className="pattern-cards-grid">
        {filtered.map(d => (
          <div key={d.ticker} className="pattern-detection-card" onClick={() => navigate(`/stock/${d.ticker}`)}>
            <div className="pattern-card-header">
              <div>
                <strong className="pattern-ticker">{d.ticker}</strong>
                <span className="pattern-name">{d.name}</span>
              </div>
              <div className="pattern-price-info">
                <span className="pattern-price">${d.price}</span>
                <span className={d.change1d >= 0 ? 'positive' : 'negative'}>{d.change1d >= 0 ? '+' : ''}{d.change1d}%</span>
              </div>
            </div>

            <div className="pattern-rsi">
              RSI: <span className={d.rsi > 70 ? 'negative' : d.rsi < 30 ? 'positive' : ''}>{d.rsi}</span>
              <div className="rsi-bar">
                <div className="rsi-fill" style={{ width: `${d.rsi}%`, background: d.rsi > 70 ? '#ef4444' : d.rsi < 30 ? '#22c55e' : '#7c8cf8' }} />
              </div>
            </div>

            <div className="pattern-tags">
              {d.patterns.map((p, i) => (
                <span key={i} className="pattern-tag" style={{ borderColor: PATTERN_COLORS[p.type], color: PATTERN_COLORS[p.type] }}>
                  {p.type === 'bullish' ? <ArrowUpRight size={12} /> : p.type === 'bearish' ? <ArrowDownRight size={12} /> : <AlertCircle size={12} />}
                  {p.name}
                  <span className="pattern-strength">{p.strength}</span>
                </span>
              ))}
            </div>

            <div className="pattern-card-footer">
              <span className="sector-tag">{d.sector}</span>
              <span className="pattern-count">{d.patternCount} patterns</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
