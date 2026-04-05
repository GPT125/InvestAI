import { useState, useEffect } from 'react';
import axios from 'axios';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Search as SearchIcon, Shield, AlertTriangle, Layers, Activity, BarChart3 } from 'lucide-react';
import { getPortfolio } from '../api/client';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

const COLORS = ['var(--color-primary, #7c8cf8)', '#f87171', '#22c55e', '#f59e0b', '#06b6d4', '#a78bfa', '#fb923c', '#e879f9', '#84cc16', '#f472b6'];

export default function PortfolioXray() {
  const [portfolio, setPortfolio] = useState(null);
  const [xrayData, setXrayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadPortfolio(); }, []);

  const loadPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      const portRes = await getPortfolio();
      const holdings = portRes.data?.holdings || [];
      setPortfolio(holdings);
      if (holdings.length >= 2) {
        await runXray(holdings);
      } else {
        setError('Need at least 2 holdings in your portfolio for X-Ray analysis');
      }
    } catch (e) { setError('Failed to load portfolio'); }
    setLoading(false);
  };

  const runXray = async (holdings) => {
    try {
      const payload = { holdings: holdings.map(h => ({ ticker: h.ticker, shares: h.shares })) };
      const res = await api.post('/xray/analyze', payload);
      setXrayData(res.data);
    } catch (e) { setError('Failed to run X-Ray analysis'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Running deep portfolio analysis...</p></div>;

  if (error) return (
    <div className="xray-page">
      <div className="page-header-row"><h1><SearchIcon size={28} /> Portfolio X-Ray</h1></div>
      <div className="feature-card"><p style={{color:'#f87171'}}>{error}</p><p>Add holdings in the <a href="/portfolio" style={{color:'var(--color-primary, #7c8cf8)'}}>Portfolio</a> page first.</p></div>
    </div>
  );

  if (!xrayData) return null;

  const port = xrayData.portfolio;
  const sectorData = Object.entries(xrayData.concentrationRisk?.sectorWeights || {}).map(([name, val]) => ({ name, value: val }));
  const holdingData = xrayData.holdings || [];

  return (
    <div className="xray-page">
      <div className="page-header-row">
        <div>
          <h1><SearchIcon size={28} /> Portfolio X-Ray</h1>
          <p className="page-subtitle">Deep risk analysis revealing hidden correlations and exposures</p>
        </div>
        <button className="refresh-btn" onClick={loadPortfolio}><Activity size={16} /> Rescan</button>
      </div>

      {/* Diversification Score */}
      <div className={`div-score-card ${xrayData.diversificationLabel?.toLowerCase()}`}>
        <div className="div-score-circle" style={{ borderColor: xrayData.diversificationScore >= 70 ? '#22c55e' : xrayData.diversificationScore >= 50 ? '#84cc16' : xrayData.diversificationScore >= 30 ? '#f59e0b' : '#ef4444' }}>
          {xrayData.diversificationScore}
        </div>
        <div>
          <h2>Diversification: {xrayData.diversificationLabel}</h2>
          <p>Avg Correlation: {xrayData.avgCorrelation} | Top Holding: {xrayData.concentrationRisk?.topHolding} ({xrayData.concentrationRisk?.topHoldingWeight}%)</p>
        </div>
      </div>

      {/* Portfolio Metrics */}
      <div className="xray-metrics-grid">
        <div className="xray-metric"><span className="metric-label">Annual Return</span><span className={`metric-val ${port.annualReturn >= 0 ? 'positive' : 'negative'}`}>{port.annualReturn}%</span></div>
        <div className="xray-metric"><span className="metric-label">Volatility</span><span className="metric-val">{port.annualVolatility}%</span></div>
        <div className="xray-metric"><span className="metric-label">Beta</span><span className="metric-val">{port.beta}</span></div>
        <div className="xray-metric"><span className="metric-label">Sharpe Ratio</span><span className={`metric-val ${port.sharpe >= 1 ? 'positive' : port.sharpe >= 0 ? '' : 'negative'}`}>{port.sharpe}</span></div>
        <div className="xray-metric"><span className="metric-label">VaR (95%)</span><span className="metric-val negative">{port.var95}%</span></div>
        <div className="xray-metric"><span className="metric-label">CVaR (95%)</span><span className="metric-val negative">{port.cvar95}%</span></div>
        <div className="xray-metric"><span className="metric-label">Max Drawdown</span><span className="metric-val negative">{port.maxDrawdown}%</span></div>
        <div className="xray-metric"><span className="metric-label">VaR (99%)</span><span className="metric-val negative">{port.var99}%</span></div>
      </div>

      {/* Sector Allocation */}
      <div className="xray-two-col">
        <div className="feature-card">
          <h3><Layers size={18} /> Sector Concentration</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}%`}>
                {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="feature-card">
          <h3><Shield size={18} /> Risk Clusters</h3>
          {xrayData.riskClusters?.length > 0 ? (
            <div className="risk-clusters">
              {xrayData.riskClusters.map((c, i) => (
                <div key={i} className="risk-cluster-item">
                  <AlertTriangle size={16} color="#f59e0b" />
                  <div>
                    <strong>{c.stocks.join(' + ')}</strong>
                    <span className="cluster-corr">Correlation: {c.correlation}</span>
                    <p className="cluster-risk">{c.risk}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="sub-text">No high-correlation clusters detected — good diversification!</p>}
        </div>
      </div>

      {/* Holdings Detail */}
      <div className="feature-card">
        <h3><BarChart3 size={18} /> Holdings Risk Profile</h3>
        <div className="table-scroll">
          <table className="feature-table">
            <thead><tr><th>Ticker</th><th>Weight</th><th>Beta</th><th>Volatility</th><th>Sharpe</th><th>Ann. Return</th></tr></thead>
            <tbody>
              {holdingData.map(h => (
                <tr key={h.ticker}>
                  <td><strong>{h.ticker}</strong></td>
                  <td>{h.weight}%</td>
                  <td className={h.beta > 1.2 ? 'negative' : h.beta < 0.8 ? 'positive' : ''}>{h.beta}</td>
                  <td>{h.volatility}%</td>
                  <td className={h.sharpe >= 1 ? 'positive' : h.sharpe < 0 ? 'negative' : ''}>{h.sharpe}</td>
                  <td className={h.annualReturn >= 0 ? 'positive' : 'negative'}>{h.annualReturn}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation Pairs */}
      <div className="feature-card">
        <h3>Top Correlations</h3>
        <div className="corr-pairs-grid">
          {(xrayData.correlationPairs || []).map((p, i) => (
            <div key={i} className="corr-pair-card" style={{ borderLeft: `3px solid ${p.correlation > 0.7 ? '#ef4444' : p.correlation > 0.3 ? '#f59e0b' : p.correlation > -0.3 ? '#6b7280' : '#22c55e'}` }}>
              <span>{p.tickerA} ↔ {p.tickerB}</span>
              <span className="corr-val">{p.correlation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
