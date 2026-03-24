import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMarketOverview, getSectors, getTopStocks, getMarketSummary } from '../api/client';
import { formatCurrency, formatChangePercent, getChangeColor, getScoreColor } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StockCard from '../components/common/StockCard';
import { FileText, ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const [indices, setIndices] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const navigate = useNavigate();

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

    // Load summary separately (it's slower due to AI)
    getMarketSummary()
      .then(res => setSummary(res.data))
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading market data..." />;

  return (
    <div className="dashboard">
      <h1>Market Overview</h1>

      {/* Market Summary */}
      <div className="market-summary-card">
        <h3><FileText size={18} /> Market Summary</h3>
        {summaryLoading ? (
          <p style={{ color: '#888', fontSize: 14 }}>Generating AI market summary...</p>
        ) : summary ? (
          <>
            <div className="summary-text">{summary.summary}</div>
            {summary.sources && summary.sources.length > 0 && (
              <div className="summary-sources">
                <span style={{ color: '#888', fontSize: 12 }}>Sources: </span>
                {summary.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="source-link">
                    {s.source || 'Link'} <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            )}
            {summary.generatedAt && (
              <span className="summary-time">Updated: {new Date(summary.generatedAt).toLocaleTimeString()}</span>
            )}
          </>
        ) : (
          <p style={{ color: '#666', fontSize: 14 }}>Market summary unavailable.</p>
        )}
      </div>

      <div className="index-cards">
        {indices.map((idx) => (
          <div key={idx.name} className="index-card">
            <h3>{idx.name}</h3>
            <p className="index-price">{formatCurrency(idx.price)}</p>
            <p className="index-change" style={{ color: getChangeColor(idx.changePercent) }}>
              {formatChangePercent(idx.changePercent)}
            </p>
          </div>
        ))}
      </div>

      <h2>Top Rated Stocks</h2>
      <div className="stock-grid">
        {topStocks.map((stock) => (
          <StockCard key={stock.ticker} stock={stock} />
        ))}
      </div>

      <h2>Sector Performance</h2>
      <div className="sector-grid">
        {sectors.map((s) => (
          <div
            key={s.sector}
            className="sector-card"
            style={{ borderLeftColor: getChangeColor(s.changePercent) }}
          >
            <h4>{s.sector}</h4>
            <span className="sector-etf">{s.etf}</span>
            <p style={{ color: getChangeColor(s.changePercent) }}>
              {formatChangePercent(s.changePercent)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
