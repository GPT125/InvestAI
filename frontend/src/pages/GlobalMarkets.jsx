import { useState, useEffect } from 'react';
import { Globe, TrendingUp, TrendingDown, DollarSign, Newspaper, ExternalLink } from 'lucide-react';
import api from '../api/client';
import { formatCurrency, getChangeColor } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function GlobalMarkets() {
  const [indices, setIndices] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [ix, cx, cm, ev] = await Promise.all([
        api.get('/global/indices').catch(() => ({ data: [] })),
        api.get('/global/currencies').catch(() => ({ data: [] })),
        api.get('/global/commodities').catch(() => ({ data: [] })),
        api.get('/global/events').catch(() => ({ data: [] })),
      ]);
      setIndices(ix.data || []);
      setCurrencies(cx.data || []);
      setCommodities(cm.data || []);
      setEvents(ev.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading global markets..." />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1><Globe size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Global Markets</h1>
          <span className="dashboard-date">World indices, currencies, commodities, and international events</span>
        </div>
      </div>

      {/* World indices */}
      <div className="section-header">
        <h2>World Indices</h2>
      </div>
      <div className="index-cards">
        {indices.map(ix => (
          <div key={ix.ticker} className="index-card">
            <h3>
              <span style={{ marginRight: 6 }}>{ix.flag}</span>
              {ix.name}
            </h3>
            <p className="index-price">{ix.price?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            <p className="index-change" style={{ color: getChangeColor(ix.changePercent) }}>
              {ix.changePercent >= 0 ? '+' : ''}{ix.changePercent?.toFixed(2)}%
              <span className="index-change-abs"> · {ix.country}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Currencies */}
      <div className="section-header" style={{ marginTop: 32 }}>
        <h2>Currency Exchange</h2>
      </div>
      <div className="index-cards">
        {currencies.map(c => (
          <div key={c.ticker} className="index-card">
            <h3>{c.label}</h3>
            <p className="index-price">{c.price?.toFixed(4)}</p>
            <p className="index-change" style={{ color: getChangeColor(c.changePercent) }}>
              {c.changePercent >= 0 ? '+' : ''}{c.changePercent?.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>

      {/* Commodities */}
      <div className="section-header" style={{ marginTop: 32 }}>
        <h2>Commodities</h2>
      </div>
      <div className="index-cards">
        {commodities.map(c => (
          <div key={c.ticker} className="index-card">
            <h3>{c.label}</h3>
            <p className="index-price">{formatCurrency(c.price)}</p>
            <p className="index-change" style={{ color: getChangeColor(c.changePercent) }}>
              {c.changePercent >= 0 ? '+' : ''}{c.changePercent?.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>

      {/* International Events */}
      <div className="section-header" style={{ marginTop: 32 }}>
        <h2><Newspaper size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />International Events Affecting US Markets</h2>
      </div>
      {events.length === 0 ? (
        <div className="comp-empty" style={{ padding: 24 }}>
          <p style={{ color: '#888' }}>No recent international events available.</p>
        </div>
      ) : (
        <div className="news-list">
          {events.map((n, i) => (
            <a
              key={i}
              href={n.link || n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
            >
              <div className="news-item-content">
                <h4 className="news-title">{n.title}</h4>
                {n.publisher && <span className="news-source">{n.publisher}</span>}
              </div>
              <ExternalLink size={14} style={{ opacity: 0.6 }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
