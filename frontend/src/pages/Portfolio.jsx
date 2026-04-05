import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getPortfolio, addHolding, updateHolding, removeHolding, getPortfolioAnalysis } from '../api/client';
import { formatCurrency, formatChangePercent, getChangeColor } from '../utils/formatters';
import { renderMarkdown } from '../utils/markdown';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PieChart as PieIcon, Plus, Trash2, Brain, TrendingUp, TrendingDown, History, Edit2, Check, X } from 'lucide-react';

const COLORS = ['var(--color-primary, #7c8cf8)', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'];

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newCost, setNewCost] = useState('');
  const [adding, setAdding] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [editingTicker, setEditingTicker] = useState(null);
  const [editShares, setEditShares] = useState('');
  const [editCost, setEditCost] = useState('');
  const navigate = useNavigate();

  const loadPortfolio = async () => {
    try {
      const res = await getPortfolio();
      setPortfolio(res.data);
    } catch {
      setPortfolio({ holdings: [], soldHoldings: [], summary: {}, sectorAllocation: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPortfolio(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTicker || !newShares || !newCost) return;
    setAdding(true);
    try {
      const res = await addHolding(newTicker.toUpperCase(), parseFloat(newShares), parseFloat(newCost));
      setPortfolio(res.data);
      setNewTicker('');
      setNewShares('');
      setNewCost('');
      setShowAddForm(false);
    } catch {
      alert('Failed to add holding. Check the ticker symbol.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ticker) => {
    if (!confirm(`Remove ${ticker} from portfolio? It will be moved to your history.`)) return;
    try {
      const res = await removeHolding(ticker);
      setPortfolio(res.data);
    } catch {
      alert('Failed to remove holding.');
    }
  };

  const handleEdit = (h) => {
    setEditingTicker(h.ticker);
    setEditShares(h.shares.toString());
    setEditCost(h.avgCost.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingTicker) return;
    try {
      const res = await updateHolding(editingTicker, parseFloat(editShares), parseFloat(editCost));
      setPortfolio(res.data);
      setEditingTicker(null);
    } catch {
      alert('Failed to update holding.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTicker(null);
    setEditShares('');
    setEditCost('');
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await getPortfolioAnalysis();
      setAnalysis(res.data.analysis);
    } catch {
      setAnalysis('Failed to generate portfolio analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading portfolio..." />;

  const { holdings = [], soldHoldings = [], summary = {}, sectorAllocation = [] } = portfolio || {};

  const allocationData = holdings.map((h) => ({
    name: h.ticker,
    value: h.marketValue || 0,
  }));

  // Custom label renderers for Recharts v3 - must return JSX <text> elements
  const RADIAN = Math.PI / 180;
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = (percent * 100).toFixed(0);
    return (
      <text x={x} y={y} fill="#ccc" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
        {name} {pct}%
      </text>
    );
  };

  const renderSectorLabel = ({ cx, cy, midAngle, outerRadius, payload, value }) => {
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    // Use the API's percent field directly (already a proper percentage like 28.9)
    const pct = payload?.percent != null ? payload.percent.toFixed(0) : '';
    const label = payload?.sector || '';
    return (
      <text x={x} y={y} fill="#ccc" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
        {label} {pct}%
      </text>
    );
  };

  return (
    <div className="portfolio-page">
      <h1><PieIcon size={24} /> Portfolio</h1>

      {/* Summary Cards */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <span className="summary-label">Total Value</span>
          <span className="summary-value">{formatCurrency(summary.totalValue)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Cost</span>
          <span className="summary-value">{formatCurrency(summary.totalCost)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Gain/Loss</span>
          <span className="summary-value" style={{ color: getChangeColor(summary.totalGainLoss) }}>
            {summary.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(summary.totalGainLoss)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Return</span>
          <span className="summary-value" style={{ color: getChangeColor(summary.totalGainLossPct) }}>
            {summary.totalGainLossPct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {' '}{formatChangePercent(summary.totalGainLossPct)}
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="portfolio-charts">
        {allocationData.length > 0 && (
          <div className="chart-card">
            <h3>Allocation by Ticker</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={renderPieLabel} labelLine={false}>
                  {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {sectorAllocation.length > 0 && (
          <div className="chart-card">
            <h3>Allocation by Sector</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sectorAllocation} dataKey="value" nameKey="sector" cx="50%" cy="50%" outerRadius={80} label={renderSectorLabel} labelLine={false}>
                  {sectorAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Current Holdings Table */}
      <div className="holdings-section">
        <div className="holdings-header">
          <h3>Current Holdings ({holdings.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={16} /> Add Holding
            </button>
            {soldHoldings && soldHoldings.length > 0 && (
              <button
                className="add-btn"
                onClick={() => setShowHistory(!showHistory)}
                style={{ background: showHistory ? 'var(--color-primary, #7c8cf8)' : '#444' }}
              >
                <History size={16} /> Past Holdings ({soldHoldings.length})
              </button>
            )}
          </div>
        </div>

        {showAddForm && (
          <form className="add-form" onSubmit={handleAdd}>
            <input type="text" placeholder="Ticker (e.g. AAPL)" value={newTicker} onChange={(e) => setNewTicker(e.target.value)} required />
            <input type="number" placeholder="Shares" value={newShares} onChange={(e) => setNewShares(e.target.value)} step="0.01" min="0.01" required />
            <input type="number" placeholder="Avg Cost ($)" value={newCost} onChange={(e) => setNewCost(e.target.value)} step="0.01" min="0.01" required />
            <button type="submit" className="submit-btn" disabled={adding}>{adding ? 'Adding...' : 'Add'}</button>
          </form>
        )}

        <div className="results-table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Name</th>
                <th>Shares</th>
                <th>Avg Cost</th>
                <th>Price</th>
                <th>Value</th>
                <th>Gain/Loss</th>
                <th>Return</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.ticker} className="clickable-row" onClick={() => editingTicker !== h.ticker && navigate(`/stock/${h.ticker}`)}>
                  <td><strong>{h.ticker}</strong></td>
                  <td style={{ color: '#888', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                  <td>
                    {editingTicker === h.ticker ? (
                      <input type="number" className="edit-input" value={editShares} onChange={(e) => setEditShares(e.target.value)} onClick={(e) => e.stopPropagation()} step="0.01" min="0.01" />
                    ) : h.shares}
                  </td>
                  <td>
                    {editingTicker === h.ticker ? (
                      <input type="number" className="edit-input" value={editCost} onChange={(e) => setEditCost(e.target.value)} onClick={(e) => e.stopPropagation()} step="0.01" min="0.01" />
                    ) : formatCurrency(h.avgCost)}
                  </td>
                  <td>{formatCurrency(h.currentPrice)}</td>
                  <td>{formatCurrency(h.marketValue)}</td>
                  <td style={{ color: getChangeColor(h.gainLoss) }}>{h.gainLoss >= 0 ? '+' : ''}{formatCurrency(h.gainLoss)}</td>
                  <td style={{ color: getChangeColor(h.gainLossPct) }}>{formatChangePercent(h.gainLossPct)}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    {editingTicker === h.ticker ? (
                      <>
                        <button className="save-edit-btn" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}>
                          <Check size={14} />
                        </button>
                        <button className="cancel-edit-btn" onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}>
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEdit(h); }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); handleRemove(h.ticker); }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Past/Sold Holdings */}
      {showHistory && soldHoldings && soldHoldings.length > 0 && (
        <div className="holdings-section" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3><History size={18} /> Past Holdings</h3>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>These stocks were previously in your portfolio. They are not included in your current portfolio value or charts.</p>
          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Name</th>
                  <th>Shares</th>
                  <th>Avg Cost</th>
                  <th>Sold Price</th>
                  <th>Sold Date</th>
                  <th>Gain/Loss</th>
                  <th>Return</th>
                </tr>
              </thead>
              <tbody>
                {soldHoldings.map((h, i) => (
                  <tr key={i} className="clickable-row" onClick={() => navigate(`/stock/${h.ticker}`)} style={{ opacity: 0.8 }}>
                    <td><strong>{h.ticker}</strong></td>
                    <td style={{ color: '#888' }}>{h.name}</td>
                    <td>{h.shares}</td>
                    <td>{formatCurrency(h.avgCost)}</td>
                    <td>{formatCurrency(h.soldPrice)}</td>
                    <td style={{ color: '#888' }}>{h.soldDate}</td>
                    <td style={{ color: getChangeColor(h.gainLoss) }}>{h.gainLoss >= 0 ? '+' : ''}{formatCurrency(h.gainLoss)}</td>
                    <td style={{ color: getChangeColor(h.gainLossPct) }}>{formatChangePercent(h.gainLossPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Portfolio Analysis */}
      <div className="ai-section">
        <h3><Brain size={20} /> AI Portfolio Analysis</h3>
        {!analysis && !analyzing && (
          <button className="analyze-btn" onClick={handleAnalyze}>
            <Brain size={16} /> Analyze My Portfolio
          </button>
        )}
        {analyzing && <LoadingSpinner message="AI is analyzing your portfolio..." />}
        {analysis && (
          <div
            className="ai-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }}
          />
        )}
      </div>
    </div>
  );
}
