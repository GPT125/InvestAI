import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMarketOverview, getSectors, getTopStocks, getMarketSummary } from '../api/client';
import { formatCurrency, formatChangePercent, getChangeColor, getScoreColor } from '../utils/formatters';
import { renderMarkdown } from '../utils/markdown';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StockCard from '../components/common/StockCard';
import { FileText, ExternalLink, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const getHeatmapColor = (changePercent) => {
  const val = parseFloat(changePercent) || 0;
  if (val > 2) return '#059669';
  if (val > 1) return '#047857';
  if (val > 0.5) return '#065f46';
  if (val > 0) return '#064e3b';
  if (val > -0.5) return '#78350f';
  if (val > -1) return '#92400e';
  if (val > -2) return '#991b1b';
  return '#7f1d1d';
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// Map frequency setting → interval in ms
const FREQ_MS = {
  realtime: 60 * 1000,        // 1 min
  hourly:   60 * 60 * 1000,   // 1 hr
  daily:    24 * 60 * 60 * 1000,
  weekly:   7 * 24 * 60 * 60 * 1000,
  monthly:  30 * 24 * 60 * 60 * 1000,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [indices, setIndices] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);   // when frontend fetched
  const [countdown, setCountdown] = useState(null);           // seconds until next refresh
  const navigate = useNavigate();
  const nextRefreshAt = useRef(null);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // Read frequency from user settings
  const getFrequencyMs = useCallback(() => {
    try {
      const s = JSON.parse(localStorage.getItem('stockai-settings') || '{}');
      return FREQ_MS[s.summaryFrequency] || 5 * 60 * 1000; // default 5 min
    } catch {
      return 5 * 60 * 1000;
    }
  }, []);

  const loadSummary = useCallback((force = false) => {
    setSummaryLoading(true);
    const url = force ? '/market/summary?force=true' : '/market/summary';
    import('../api/client').then(({ default: api }) => {
      api.get(url)
        .then(res => {
          setSummary(res.data);
          const now = new Date();
          setLastFetchedAt(now);
          // Schedule next refresh
          const ms = getFrequencyMs();
          nextRefreshAt.current = now.getTime() + ms;
          setCountdown(Math.round(ms / 1000));
        })
        .catch(() => {})
        .finally(() => setSummaryLoading(false));
    });
  }, [getFrequencyMs]);

  // Countdown ticker
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      if (nextRefreshAt.current) {
        const remaining = Math.max(0, Math.round((nextRefreshAt.current - Date.now()) / 1000));
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [idx, sec, top] = await Promise.all([
          getMarketOverview().catch(() => ({ data: [] })),
          getSectors().catch(() => ({ data: [] })),
          getTopStocks(12).catch(() => ({ data: [] })),
        ]);
        setIndices(idx.data);
        setSectors(sec.data);
        setTopStocks(top.data);
      } finally {
        setLoading(false);
      }
    }
    load();
    loadSummary();
  }, [loadSummary]);

  // Set up auto-refresh interval based on user setting
  useEffect(() => {
    const ms = getFrequencyMs();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => loadSummary(), ms);
    return () => clearInterval(intervalRef.current);
  }, [loadSummary, getFrequencyMs]);

  const formatCountdown = (secs) => {
    if (secs == null) return '';
    if (secs >= 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
    if (secs >= 60) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    return `${secs}s`;
  };

  if (loading) return <LoadingSpinner message="Loading market data..." />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{user ? `${getGreeting()}, ${user.name?.split(' ')[0] || user.email.split('@')[0]}` : 'Market Overview'}</h1>
          <span className="dashboard-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Market Summary */}
      <div className="market-summary-card">
        <div className="summary-header-row">
          <h3><FileText size={16} /> AI Market Summary</h3>
          <div className="summary-meta">
            {lastFetchedAt && !summaryLoading && (
              <span className="summary-time">
                Fetched {lastFetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {countdown != null && countdown > 0 && (
                  <> · Next in {formatCountdown(countdown)}</>
                )}
              </span>
            )}
            <button
              className={`summary-refresh-btn ${summaryLoading ? 'spinning' : ''}`}
              onClick={() => loadSummary(true)}
              disabled={summaryLoading}
              title="Refresh market summary now"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {summaryLoading ? (
          <p className="summary-loading-text">Generating market summary…</p>
        ) : summary ? (
          <>
            <div className="summary-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(summary.summary || '') }} />
            {summary.sources && summary.sources.length > 0 && (
              <div className="summary-sources">
                <span>Sources: </span>
                {summary.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="source-link">
                    {s.source || 'Link'} <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            )}
            {summary.generatedAt && (
              <span className="summary-generated-at">
                AI generated: {new Date(summary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </>
        ) : (
          <p style={{ color: '#666', fontSize: 14 }}>Market summary unavailable.</p>
        )}
      </div>

      {/* Index Cards */}
      <div className="index-cards">
        {indices.map((idx) => (
          <div key={idx.name} className="index-card">
            <h3>{idx.name}</h3>
            <p className="index-price">{formatCurrency(idx.price)}</p>
            <p className="index-change" style={{ color: getChangeColor(idx.changePercent) }}>
              {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent?.toFixed(2)}%
              <span className="index-change-abs"> ({idx.changePercent >= 0 ? '+' : ''}{formatCurrency(idx.change)})</span>
            </p>
          </div>
        ))}
      </div>

      {/* Market Movers */}
      {topStocks.length > 0 && (
        <div className="market-movers">
          <div className="movers-section">
            <h3 className="movers-title gainers-title">
              <TrendingUp size={15} /> Top Gainers
            </h3>
            <div className="movers-list">
              {[...topStocks]
                .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.ticker} className="mover-item" onClick={() => navigate(`/stock/${s.ticker}`)}>
                    <div className="mover-info">
                      <span className="mover-ticker">{s.ticker}</span>
                      <span className="mover-name">{s.name?.substring(0, 22)}</span>
                    </div>
                    <div className="mover-data">
                      <span className="mover-price">{formatCurrency(s.price)}</span>
                      <span className="mover-change gain">{formatChangePercent(s.changePercent)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="movers-section">
            <h3 className="movers-title losers-title">
              <TrendingDown size={15} /> Top Losers
            </h3>
            <div className="movers-list">
              {[...topStocks]
                .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.ticker} className="mover-item" onClick={() => navigate(`/stock/${s.ticker}`)}>
                    <div className="mover-info">
                      <span className="mover-ticker">{s.ticker}</span>
                      <span className="mover-name">{s.name?.substring(0, 22)}</span>
                    </div>
                    <div className="mover-data">
                      <span className="mover-price">{formatCurrency(s.price)}</span>
                      <span className="mover-change loss">{formatChangePercent(s.changePercent)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="section-header">
        <h2>Top Rated Stocks</h2>
      </div>
      <div className="stock-grid">
        {topStocks.map((stock) => (
          <StockCard key={stock.ticker} stock={stock} />
        ))}
      </div>

      <div className="section-header">
        <h2>Sector Performance</h2>
      </div>
      <div className="sector-heatmap">
        {sectors.map((s) => (
          <div
            key={s.sector}
            className="heatmap-cell"
            style={{ backgroundColor: getHeatmapColor(s.changePercent) }}
          >
            <span className="heatmap-cell-name">{s.sector}</span>
            <span className="heatmap-cell-etf">{s.etf}</span>
            <span className="heatmap-cell-change">
              {s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
