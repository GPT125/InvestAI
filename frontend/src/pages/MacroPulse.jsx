import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Globe, DollarSign, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Gem } from 'lucide-react';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

const HEALTH_COLORS = { Robust: '#22c55e', Healthy: '#84cc16', Mixed: '#f59e0b', Stressed: '#f97316', Critical: '#ef4444' };

export default function MacroPulse() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/macro/pulse');
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Reading the macro pulse...</p></div>;

  const ind = data?.indicators || {};

  return (
    <div className="macro-page">
      <div className="page-header-row">
        <div>
          <h1><Activity size={28} /> Macro Pulse</h1>
          <p className="page-subtitle">Global economic health dashboard</p>
        </div>
        <button className="refresh-btn" onClick={loadData}><Activity size={16} /> Refresh</button>
      </div>

      {/* Health Score */}
      <div className="macro-health-card" style={{ borderColor: HEALTH_COLORS[ind.healthLabel] || '#666' }}>
        <div className="health-score-circle" style={{ borderColor: HEALTH_COLORS[ind.healthLabel], color: HEALTH_COLORS[ind.healthLabel] }}>
          {ind.healthScore}
        </div>
        <div>
          <h2 style={{ color: HEALTH_COLORS[ind.healthLabel] }}>Economy: {ind.healthLabel}</h2>
          <p>Composite score based on yield curve, dollar strength, credit markets, and equity performance</p>
        </div>
      </div>

      {/* Key Indicators */}
      <div className="macro-grid">
        {/* Yield Curve */}
        {ind.yieldCurve && ind.yieldCurve.status !== 'Unavailable' && (
          <div className="macro-card">
            <h4><BarChart3 size={18} /> Yield Curve</h4>
            <div className={`macro-signal ${ind.yieldCurve.status === 'Normal' ? 'good' : ind.yieldCurve.status === 'Flat' ? 'warning' : 'danger'}`}>
              {ind.yieldCurve.status}
            </div>
            <div className="macro-details">
              <div><span>10Y Yield:</span><strong>{ind.yieldCurve.yield10Y}%</strong></div>
              <div><span>3M Yield:</span><strong>{ind.yieldCurve.yield3M}%</strong></div>
              <div><span>Spread:</span><strong className={ind.yieldCurve.spread >= 0 ? 'positive' : 'negative'}>{ind.yieldCurve.spread}%</strong></div>
            </div>
            <div className="macro-signal-text">
              {ind.yieldCurve.status === 'Inverted' && <><AlertTriangle size={14} /> {ind.yieldCurve.signal}</>}
              {ind.yieldCurve.status !== 'Inverted' && ind.yieldCurve.signal}
            </div>
          </div>
        )}

        {/* Dollar */}
        {ind.dollar && (
          <div className="macro-card">
            <h4><DollarSign size={18} /> US Dollar</h4>
            <div className={`macro-signal ${ind.dollar.trend === 'Weakening' ? 'good' : 'warning'}`}>
              {ind.dollar.trend}
            </div>
            <div className="macro-details">
              <div><span>UUP Price:</span><strong>${ind.dollar.price}</strong></div>
              <div><span>1M Change:</span><strong className={ind.dollar.change1m >= 0 ? 'positive' : 'negative'}>{ind.dollar.change1m >= 0 ? '+' : ''}{ind.dollar.change1m}%</strong></div>
            </div>
            <div className="macro-signal-text">{ind.dollar.impact}</div>
          </div>
        )}

        {/* Risk Appetite */}
        {ind.riskAppetite && (
          <div className="macro-card">
            <h4><Activity size={18} /> Risk Appetite</h4>
            <div className={`macro-signal ${ind.riskAppetite.level === 'Risk-On' ? 'good' : ind.riskAppetite.level === 'Neutral' ? 'warning' : 'danger'}`}>
              {ind.riskAppetite.level}
            </div>
            <div className="macro-details">
              <div><span>Credit Spread:</span><strong className={ind.riskAppetite.creditSpread >= 0 ? 'positive' : 'negative'}>{ind.riskAppetite.creditSpread}%</strong></div>
            </div>
            <div className="macro-signal-text">
              {ind.riskAppetite.level === 'Risk-On' ? 'Markets favoring riskier assets' : ind.riskAppetite.level === 'Risk-Off' ? 'Flight to safety in progress' : 'Balanced risk sentiment'}
            </div>
          </div>
        )}
      </div>

      {/* Global Indices */}
      {ind.globalIndices?.length > 0 && (
        <div className="feature-card">
          <h3><Globe size={20} /> Global Indices</h3>
          <div className="table-scroll">
            <table className="feature-table">
              <thead><tr><th>Index</th><th>Price</th><th>1D</th><th>1M</th><th>YTD</th></tr></thead>
              <tbody>
                {ind.globalIndices.map(idx => (
                  <tr key={idx.name}>
                    <td><strong>{idx.name}</strong></td>
                    <td>{idx.price?.toLocaleString()}</td>
                    <td className={idx.change1d >= 0 ? 'positive' : 'negative'}>{idx.change1d >= 0 ? '+' : ''}{idx.change1d}%</td>
                    <td className={idx.change1m >= 0 ? 'positive' : 'negative'}>{idx.change1m >= 0 ? '+' : ''}{idx.change1m}%</td>
                    <td className={idx.changeYtd >= 0 ? 'positive' : 'negative'}>{idx.changeYtd >= 0 ? '+' : ''}{idx.changeYtd}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commodities */}
      {ind.commodities?.length > 0 && (
        <div className="feature-card">
          <h3><Gem size={20} /> Commodities</h3>
          <div className="commodity-cards-grid">
            {ind.commodities.map(c => (
              <div key={c.name} className="commodity-card">
                <h4>{c.name}</h4>
                <div className="commodity-price">${c.price}</div>
                <div className="commodity-changes">
                  <span className={c.change1w >= 0 ? 'positive' : 'negative'}>1W: {c.change1w >= 0 ? '+' : ''}{c.change1w}%</span>
                  <span className={c.change1m >= 0 ? 'positive' : 'negative'}>1M: {c.change1m >= 0 ? '+' : ''}{c.change1m}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
