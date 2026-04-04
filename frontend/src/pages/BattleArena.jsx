import { useState } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Swords, Trophy, Search, Zap, Shield, TrendingUp, DollarSign, Star, BarChart3 } from 'lucide-react';
import { searchStocks } from '../api/client';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

const CATEGORY_ICONS = {
  growth: TrendingUp, value: DollarSign, momentum: Zap, stability: Shield,
  quality: Star, income: BarChart3, size: BarChart3, sentiment: Star,
};

export default function BattleArena() {
  const [tickerA, setTickerA] = useState('');
  const [tickerB, setTickerB] = useState('');
  const [searchA, setSearchA] = useState([]);
  const [searchB, setSearchB] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleSearch = async (q, setter) => {
    if (q.length >= 1) {
      try {
        const res = await searchStocks(q.toUpperCase());
        setter(res.data?.slice(0, 5) || []);
      } catch { setter([]); }
    } else { setter([]); }
  };

  const startBattle = async () => {
    if (!tickerA || !tickerB) return;
    setLoading(true);
    setShowAnimation(true);
    try {
      const res = await api.get(`/battle/fight?ticker_a=${tickerA.toUpperCase()}&ticker_b=${tickerB.toUpperCase()}`);
      setTimeout(() => {
        setResult(res.data);
        setShowAnimation(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      setShowAnimation(false);
    }
    setLoading(false);
  };

  const radarData = result ? Object.keys(result.fighterA.stats).map(cat => ({
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    [result.fighterA.ticker]: result.fighterA.stats[cat],
    [result.fighterB.ticker]: result.fighterB.stats[cat],
  })) : [];

  return (
    <div className="battle-page">
      <div className="page-header-row">
        <div>
          <h1><Swords size={28} /> Stock Battle Arena</h1>
          <p className="page-subtitle">Head-to-head stock showdown across 8 dimensions</p>
        </div>
      </div>

      {/* Fighter Selection */}
      <div className="battle-select-row">
        <div className="fighter-select">
          <label>Fighter A</label>
          <div className="search-input-wrap">
            <Search size={14} />
            <input placeholder="e.g. AAPL" value={tickerA} onChange={e => { setTickerA(e.target.value.toUpperCase()); handleSearch(e.target.value, setSearchA); }}
              onKeyDown={e => e.key === 'Enter' && startBattle()} />
          </div>
          {searchA.length > 0 && (
            <div className="battle-search-dropdown">
              {searchA.map(s => <div key={s.ticker} className="battle-search-item" onClick={() => { setTickerA(s.ticker); setSearchA([]); }}><strong>{s.ticker}</strong> <span>{s.name}</span></div>)}
            </div>
          )}
        </div>

        <div className="vs-badge">VS</div>

        <div className="fighter-select">
          <label>Fighter B</label>
          <div className="search-input-wrap">
            <Search size={14} />
            <input placeholder="e.g. MSFT" value={tickerB} onChange={e => { setTickerB(e.target.value.toUpperCase()); handleSearch(e.target.value, setSearchB); }}
              onKeyDown={e => e.key === 'Enter' && startBattle()} />
          </div>
          {searchB.length > 0 && (
            <div className="battle-search-dropdown">
              {searchB.map(s => <div key={s.ticker} className="battle-search-item" onClick={() => { setTickerB(s.ticker); setSearchB([]); }}><strong>{s.ticker}</strong> <span>{s.name}</span></div>)}
            </div>
          )}
        </div>

        <button className="battle-btn" onClick={startBattle} disabled={!tickerA || !tickerB || loading}>
          <Swords size={18} /> {loading ? 'Fighting...' : 'FIGHT!'}
        </button>
      </div>

      {/* Animation */}
      {showAnimation && (
        <div className="battle-animation">
          <div className="fighter-a-anim">{tickerA}</div>
          <div className="vs-anim">⚔️</div>
          <div className="fighter-b-anim">{tickerB}</div>
        </div>
      )}

      {/* Results */}
      {result && !showAnimation && (
        <>
          {/* Winner Banner */}
          <div className={`winner-banner ${result.overallWinner === result.fighterA.ticker ? 'winner-a' : result.overallWinner === result.fighterB.ticker ? 'winner-b' : 'tie'}`}>
            <Trophy size={24} />
            <div>
              <h2>{result.overallWinner === 'tie' ? 'TIE!' : `${result.overallWinner} WINS!`}</h2>
              <p>{result.verdict}</p>
            </div>
            <div className="score-summary">
              <span>{result.fighterA.ticker}: {result.fighterA.totalScore}</span>
              <span>vs</span>
              <span>{result.fighterB.ticker}: {result.fighterB.totalScore}</span>
            </div>
          </div>

          {/* Stat Cards Side by Side */}
          <div className="fighter-cards-row">
            {[result.fighterA, result.fighterB].map((f, idx) => (
              <div key={f.ticker} className={`fighter-card ${result.overallWinner === f.ticker ? 'winner' : ''}`}>
                <div className="fighter-header">
                  <h3>{f.ticker}</h3>
                  <span className="fighter-name">{f.name}</span>
                  <span className="fighter-sector">{f.sector}</span>
                </div>
                <div className="fighter-price">${f.price}</div>
                <div className="fighter-record">
                  <span className="wins-badge">{f.wins} Wins</span>
                  <span className="total-badge">Total: {f.totalScore}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Radar Chart */}
          <div className="feature-card">
            <h3>Stat Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#ccc', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={result.fighterA.ticker} dataKey={result.fighterA.ticker} stroke="#7c8cf8" fill="#7c8cf8" fillOpacity={0.3} />
                <Radar name={result.fighterB.ticker} dataKey={result.fighterB.ticker} stroke="#f87171" fill="#f87171" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Round-by-Round */}
          <div className="feature-card">
            <h3>Round-by-Round</h3>
            <div className="rounds-grid">
              {result.rounds.map(r => {
                const Icon = CATEGORY_ICONS[r.category] || Star;
                return (
                  <div key={r.category} className={`round-card ${r.winner === result.fighterA.ticker ? 'win-a' : r.winner === result.fighterB.ticker ? 'win-b' : 'draw'}`}>
                    <Icon size={18} />
                    <h4>{r.category.charAt(0).toUpperCase() + r.category.slice(1)}</h4>
                    <div className="round-scores">
                      <span className={r.winner === result.fighterA.ticker ? 'winner-score' : ''}>{result.fighterA.ticker}: {r.scoreA}</span>
                      <span className={r.winner === result.fighterB.ticker ? 'winner-score' : ''}>{result.fighterB.ticker}: {r.scoreB}</span>
                    </div>
                    {r.winner !== 'tie' && <span className="round-winner">Winner: {r.winner}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Race */}
          <div className="feature-card">
            <h3>Performance Race</h3>
            <div className="perf-race-table">
              <table className="feature-table">
                <thead><tr><th>Period</th><th>{result.fighterA.ticker}</th><th>{result.fighterB.ticker}</th><th>Winner</th></tr></thead>
                <tbody>
                  {Object.keys(result.fighterA.performance).map(p => {
                    const a = result.fighterA.performance[p];
                    const b = result.fighterB.performance[p];
                    return (
                      <tr key={p}>
                        <td><strong>{p}</strong></td>
                        <td className={a >= 0 ? 'positive' : 'negative'}>{a != null ? `${a >= 0 ? '+' : ''}${a}%` : 'N/A'}</td>
                        <td className={b >= 0 ? 'positive' : 'negative'}>{b != null ? `${b >= 0 ? '+' : ''}${b}%` : 'N/A'}</td>
                        <td>{a != null && b != null ? (a > b ? result.fighterA.ticker : b > a ? result.fighterB.ticker : 'Tie') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
