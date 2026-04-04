import { useState, useEffect } from 'react';
import axios from 'axios';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { RotateCcw, ArrowUpRight, ArrowDownRight, TrendingUp, Minus } from 'lucide-react';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

const PHASE_COLORS = {
  Leading: '#22c55e',
  Improving: '#3b82f6',
  Weakening: '#f59e0b',
  Lagging: '#ef4444',
};

export default function SectorRotation() {
  const [flowData, setFlowData] = useState(null);
  const [rrgData, setRrgData] = useState(null);
  const [activeTab, setActiveTab] = useState('flow');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [flowRes, rrgRes] = await Promise.all([
        api.get('/rotation/flow?period=6mo'),
        api.get('/rotation/rrg'),
      ]);
      setFlowData(flowRes.data);
      setRrgData(rrgRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Analyzing sector rotation...</p></div>;

  const sectors = flowData?.sectors || [];
  const rrgPoints = rrgData?.points || [];

  const PhaseIcon = ({ phase }) => {
    if (phase === 'Leading') return <ArrowUpRight size={14} color={PHASE_COLORS.Leading} />;
    if (phase === 'Improving') return <TrendingUp size={14} color={PHASE_COLORS.Improving} />;
    if (phase === 'Weakening') return <ArrowDownRight size={14} color={PHASE_COLORS.Weakening} />;
    return <Minus size={14} color={PHASE_COLORS.Lagging} />;
  };

  return (
    <div className="rotation-page">
      <div className="page-header-row">
        <div>
          <h1><RotateCcw size={28} /> Sector Rotation Tracker</h1>
          <p className="page-subtitle">Track institutional money flow between market sectors</p>
        </div>
        <button className="refresh-btn" onClick={loadData}><RotateCcw size={16} /> Refresh</button>
      </div>

      <div className="feature-tabs">
        <button className={activeTab === 'flow' ? 'active' : ''} onClick={() => setActiveTab('flow')}>Money Flow</button>
        <button className={activeTab === 'rrg' ? 'active' : ''} onClick={() => setActiveTab('rrg')}>Relative Rotation</button>
        <button className={activeTab === 'heatmap' ? 'active' : ''} onClick={() => setActiveTab('heatmap')}>Performance Heatmap</button>
      </div>

      {activeTab === 'flow' && (
        <>
          {/* Phase summary */}
          <div className="phase-summary-grid">
            {['Leading', 'Improving', 'Weakening', 'Lagging'].map(phase => {
              const inPhase = sectors.filter(s => s.phase === phase);
              return (
                <div key={phase} className="phase-card" style={{ borderLeft: `3px solid ${PHASE_COLORS[phase]}` }}>
                  <h4 style={{ color: PHASE_COLORS[phase] }}>{phase}</h4>
                  <div className="phase-sectors">
                    {inPhase.map(s => <span key={s.sector} className="phase-sector-tag">{s.sector}</span>)}
                    {inPhase.length === 0 && <span className="sub-text">None</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flow table */}
          <div className="feature-card">
            <h3>Sector Money Flow</h3>
            <div className="table-scroll">
              <table className="feature-table">
                <thead>
                  <tr><th>Sector</th><th>ETF</th><th>Price</th><th>1W</th><th>1M</th><th>3M</th><th>Flow Change</th><th>Rel. Strength</th><th>Phase</th></tr>
                </thead>
                <tbody>
                  {sectors.map(s => (
                    <tr key={s.sector}>
                      <td><strong>{s.sector}</strong></td>
                      <td>{s.etf}</td>
                      <td>${s.price}</td>
                      <td className={s.return1w >= 0 ? 'positive' : 'negative'}>{s.return1w >= 0 ? '+' : ''}{s.return1w}%</td>
                      <td className={s.return1m >= 0 ? 'positive' : 'negative'}>{s.return1m >= 0 ? '+' : ''}{s.return1m}%</td>
                      <td className={s.return3m >= 0 ? 'positive' : 'negative'}>{s.return3m >= 0 ? '+' : ''}{s.return3m}%</td>
                      <td className={s.flowChange >= 0 ? 'positive' : 'negative'}>{s.flowChange >= 0 ? '+' : ''}{s.flowChange}%</td>
                      <td className={s.relativeStrength >= 0 ? 'positive' : 'negative'}>{s.relativeStrength >= 0 ? '+' : ''}{s.relativeStrength}%</td>
                      <td><span className="phase-badge" style={{ color: PHASE_COLORS[s.phase], borderColor: PHASE_COLORS[s.phase] }}><PhaseIcon phase={s.phase} /> {s.phase}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Flow chart */}
          <div className="feature-card">
            <h3>Money Flow Change (5-Day vs Prior 5-Day)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectors} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis type="number" tick={{ fill: '#aaa', fontSize: 11 }} />
                <YAxis dataKey="sector" type="category" tick={{ fill: '#ccc', fontSize: 11 }} width={110} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', color: '#eee' }} />
                <Bar dataKey="flowChange" name="Flow Change %">
                  {sectors.map((s, i) => (
                    <Cell key={i} fill={s.flowChange >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === 'rrg' && (
        <div className="feature-card">
          <h3>Relative Rotation Graph</h3>
          <p className="card-subtitle">Sectors plotted by relative strength (x) and momentum (y) vs S&P 500</p>
          <div className="rrg-legend">
            {['Leading', 'Improving', 'Weakening', 'Lagging'].map(q => (
              <span key={q} className="rrg-legend-item" style={{ color: PHASE_COLORS[q] }}>● {q}</span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis type="number" dataKey="rsRatio" name="RS-Ratio" tick={{ fill: '#aaa', fontSize: 11 }} label={{ value: 'Relative Strength', fill: '#888', position: 'bottom' }} />
              <YAxis type="number" dataKey="rsMomentum" name="RS-Momentum" tick={{ fill: '#aaa', fontSize: 11 }} label={{ value: 'Momentum', fill: '#888', angle: -90, position: 'left' }} />
              <Tooltip content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: '#1a1a2e', border: '1px solid #333', padding: 10, borderRadius: 6, color: '#eee' }}>
                    <strong>{d.sector}</strong> ({d.etf})<br />
                    RS-Ratio: {d.rsRatio} | Momentum: {d.rsMomentum}<br />
                    <span style={{ color: PHASE_COLORS[d.quadrant] }}>{d.quadrant}</span>
                  </div>
                );
              }} />
              <Scatter data={rrgPoints}>
                {rrgPoints.map((p, i) => (
                  <Cell key={i} fill={PHASE_COLORS[p.quadrant]} r={8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="rrg-labels">
            {rrgPoints.map(p => (
              <span key={p.sector} className="rrg-label" style={{ color: PHASE_COLORS[p.quadrant] }}>{p.sector}: {p.quadrant}</span>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className="feature-card">
          <h3>Performance Heatmap</h3>
          <div className="sector-heatmap-grid">
            {sectors.map(s => {
              const color = s.return1m > 5 ? '#166534' : s.return1m > 2 ? '#15803d' : s.return1m > 0 ? '#22c55e44' : s.return1m > -2 ? '#ef444444' : s.return1m > -5 ? '#dc2626' : '#991b1b';
              return (
                <div key={s.sector} className="heatmap-cell" style={{ background: color }}>
                  <strong>{s.sector}</strong>
                  <span className="heatmap-etf">{s.etf}</span>
                  <span className="heatmap-val">{s.return1m >= 0 ? '+' : ''}{s.return1m}%</span>
                  <span className="heatmap-sub">1M Return</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
