import { useState, useEffect } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Zap, TrendingUp, TrendingDown, Volume2, Activity, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

export default function MomentumRadar() {
  const [radarData, setRadarData] = useState(null);
  const [unusualVol, setUnusualVol] = useState(null);
  const [breakouts, setBreakouts] = useState(null);
  const [activeTab, setActiveTab] = useState('radar');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [radarRes, volRes, breakRes] = await Promise.all([
        api.get('/momentum/radar?limit=30'),
        api.get('/momentum/unusual-volume?limit=20'),
        api.get('/momentum/breakouts?limit=15'),
      ]);
      setRadarData(radarRes.data);
      setUnusualVol(volRes.data);
      setBreakouts(breakRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Scanning momentum signals...</p></div>;

  const stocks = radarData?.stocks || [];
  const topStock = stocks[0];

  return (
    <div className="momentum-page">
      <div className="page-header-row">
        <div>
          <h1><Zap size={28} /> Momentum Radar</h1>
          <p className="page-subtitle">Real-time momentum scanner across multiple timeframes</p>
        </div>
        <button className="refresh-btn" onClick={loadData}><Activity size={16} /> Refresh</button>
      </div>

      {/* Tabs */}
      <div className="feature-tabs">
        <button className={activeTab === 'radar' ? 'active' : ''} onClick={() => setActiveTab('radar')}>
          <Target size={16} /> Momentum Radar
        </button>
        <button className={activeTab === 'volume' ? 'active' : ''} onClick={() => setActiveTab('volume')}>
          <Volume2 size={16} /> Unusual Volume
        </button>
        <button className={activeTab === 'breakouts' ? 'active' : ''} onClick={() => setActiveTab('breakouts')}>
          <TrendingUp size={16} /> Breakouts
        </button>
      </div>

      {activeTab === 'radar' && (
        <>
          {/* Top movers radar chart */}
          {topStock && (
            <div className="feature-card spotlight-card">
              <h3>Top Momentum: {topStock.ticker}</h3>
              <p className="spotlight-name">{topStock.name} — Blast Score: <span className="highlight-score">{topStock.blastScore}</span></p>
              <div className="radar-chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={[
                    { axis: '1D', value: Math.max(0, Math.min(100, topStock.return1d * 5 + 50)) },
                    { axis: '1W', value: Math.max(0, Math.min(100, topStock.return1w * 2.5 + 50)) },
                    { axis: '1M', value: Math.max(0, Math.min(100, topStock.return1m * 1.5 + 50)) },
                    { axis: '3M', value: Math.max(0, Math.min(100, topStock.return3m + 50)) },
                    { axis: 'Volume', value: Math.min(100, topStock.volumeRatio * 33) },
                    { axis: 'RS50', value: Math.max(0, Math.min(100, topStock.rs50 * 3 + 50)) },
                  ]}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#aaa', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Momentum" dataKey="value" stroke="#7c8cf8" fill="#7c8cf8" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Momentum table */}
          <div className="feature-card">
            <h3>Momentum Rankings</h3>
            <div className="table-scroll">
              <table className="feature-table">
                <thead>
                  <tr>
                    <th>#</th><th>Ticker</th><th>Price</th><th>1D</th><th>1W</th><th>1M</th><th>3M</th>
                    <th>Vol Ratio</th><th>Blast Score</th><th>Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s, i) => (
                    <tr key={s.ticker} onClick={() => navigate(`/stock/${s.ticker}`)} className="clickable-row">
                      <td>{i + 1}</td>
                      <td><strong>{s.ticker}</strong><br /><span className="sub-text">{s.name}</span></td>
                      <td>${s.price}</td>
                      <td className={s.return1d >= 0 ? 'positive' : 'negative'}>{s.return1d >= 0 ? '+' : ''}{s.return1d}%</td>
                      <td className={s.return1w >= 0 ? 'positive' : 'negative'}>{s.return1w >= 0 ? '+' : ''}{s.return1w}%</td>
                      <td className={s.return1m >= 0 ? 'positive' : 'negative'}>{s.return1m >= 0 ? '+' : ''}{s.return1m}%</td>
                      <td className={s.return3m >= 0 ? 'positive' : 'negative'}>{s.return3m >= 0 ? '+' : ''}{s.return3m}%</td>
                      <td className={s.volumeRatio >= 1.5 ? 'highlight-vol' : ''}>{s.volumeRatio}x</td>
                      <td><span className={`blast-badge ${s.blastScore >= 70 ? 'hot' : s.blastScore >= 50 ? 'warm' : 'cool'}`}>{s.blastScore}</span></td>
                      <td><span className={`direction-tag ${s.direction}`}>{s.direction === 'bullish' ? <><ArrowUpRight size={14} /> Bullish</> : s.direction === 'bearish' ? <><ArrowDownRight size={14} /> Bearish</> : 'Mixed'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'volume' && (
        <div className="feature-card">
          <h3><Volume2 size={20} /> Unusual Volume Alerts</h3>
          <p className="card-subtitle">Stocks with volume significantly above their 20-day average</p>
          <div className="table-scroll">
            <table className="feature-table">
              <thead>
                <tr><th>Ticker</th><th>Price</th><th>Change</th><th>Today Vol</th><th>Avg Vol</th><th>Ratio</th><th>Signal</th></tr>
              </thead>
              <tbody>
                {(unusualVol?.alerts || []).map(a => (
                  <tr key={a.ticker} onClick={() => navigate(`/stock/${a.ticker}`)} className="clickable-row">
                    <td><strong>{a.ticker}</strong><br /><span className="sub-text">{a.name}</span></td>
                    <td>${a.price}</td>
                    <td className={a.change1d >= 0 ? 'positive' : 'negative'}>{a.change1d >= 0 ? '+' : ''}{a.change1d}%</td>
                    <td>{(a.todayVolume / 1e6).toFixed(1)}M</td>
                    <td>{(a.avgVolume / 1e6).toFixed(1)}M</td>
                    <td><span className="blast-badge hot">{a.volumeRatio}x</span></td>
                    <td><span className={`signal-tag ${a.signal.includes('Up') ? 'bullish' : a.signal.includes('Down') ? 'bearish' : 'neutral'}`}>{a.signal}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'breakouts' && (
        <div className="feature-card">
          <h3><TrendingUp size={20} /> Technical Breakouts</h3>
          <p className="card-subtitle">Stocks breaking through key technical levels</p>
          <div className="breakout-grid">
            {(breakouts?.breakouts || []).map(b => (
              <div key={b.ticker} className={`breakout-card ${b.signalType}`} onClick={() => navigate(`/stock/${b.ticker}`)}>
                <div className="breakout-header">
                  <strong>{b.ticker}</strong>
                  <span className={`direction-tag ${b.signalType}`}>{b.signalType === 'bullish' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {b.signalType}</span>
                </div>
                <div className="breakout-name">{b.name}</div>
                <div className="breakout-price">${b.price} <span className={b.change1d >= 0 ? 'positive' : 'negative'}>({b.change1d >= 0 ? '+' : ''}{b.change1d}%)</span></div>
                <div className="breakout-signals">
                  {b.signals.map((sig, i) => (
                    <span key={i} className="signal-pill">{sig}</span>
                  ))}
                </div>
                <div className="breakout-levels">
                  <span>52W: ${b.low52} — ${b.high52}</span>
                  <span>SMA50: ${b.sma50} | SMA200: ${b.sma200}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
