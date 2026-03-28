import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { compareStocks, compareHistory, compareAIAnalysis, searchStocks, getCorrelation } from '../api/client';
import { formatCurrency, formatLargeNumber, formatPercent, formatChangePercent, getChangeColor } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { GitCompare, Plus, X, Brain, TrendingUp, Search } from 'lucide-react';

const COLORS = ['#7c8cf8', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'];
const PERIODS = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
  { label: '5Y', value: '5y' },
];

export default function Compare() {
  const [tickers, setTickers] = useState(['', '']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [historyData, setHistoryData] = useState(null);
  const [period, setPeriod] = useState('1y');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [correlation, setCorrelation] = useState(null);
  const [correlationLoading, setCorrelationLoading] = useState(false);

  const handleSearch = async (query, index) => {
    setActiveInput(index);
    const newTickers = [...tickers];
    newTickers[index] = query;
    setTickers(newTickers);

    if (query.length >= 1) {
      try {
        const res = await searchStocks(query);
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectTicker = (ticker, index) => {
    const newTickers = [...tickers];
    newTickers[index] = ticker;
    setTickers(newTickers);
    setSearchResults([]);
    setActiveInput(null);
  };

  const addTickerSlot = () => {
    if (tickers.length < 5) setTickers([...tickers, '']);
  };

  const removeTickerSlot = (index) => {
    if (tickers.length > 2) {
      setTickers(tickers.filter((_, i) => i !== index));
    }
  };

  const handleCompare = async () => {
    const validTickers = tickers.filter(t => t.trim());
    if (validTickers.length < 2) return;

    setLoading(true);
    setAiAnalysis('');
    try {
      const tickerStr = validTickers.join(',');
      const [stocksRes, historyRes] = await Promise.all([
        compareStocks(tickerStr).catch(() => ({ data: [] })),
        compareHistory(tickerStr, period).catch(() => ({ data: null })),
      ]);
      setStocks(Array.isArray(stocksRes.data) ? stocksRes.data : []);
      setHistoryData(historyRes.data);
    } finally {
      setLoading(false);
    }
  };

  // Reload chart when period changes and we have tickers
  useEffect(() => {
    const validTickers = tickers.filter(t => t.trim());
    if (stocks.length >= 2 && validTickers.length >= 2) {
      const tickerStr = validTickers.join(',');
      compareHistory(tickerStr, period)
        .then(res => setHistoryData(res.data))
        .catch(() => {});
    }
  }, [period]);

  const handleAIAnalysis = async () => {
    const validTickers = tickers.filter(t => t.trim());
    if (validTickers.length < 2) return;
    setAnalyzingAI(true);
    try {
      const res = await compareAIAnalysis(validTickers.join(','));
      setAiAnalysis(res.data.analysis);
    } catch {
      setAiAnalysis('Failed to generate AI comparison.');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const metricRows = [
    { label: 'Price', key: 'price', fmt: formatCurrency },
    { label: 'Market Cap', key: 'marketCap', fmt: formatLargeNumber },
    { label: 'P/E Ratio', key: 'pe', fmt: v => v?.toFixed(2) || 'N/A' },
    { label: 'Forward P/E', key: 'forwardPE', fmt: v => v?.toFixed(2) || 'N/A' },
    { label: 'EPS', key: 'eps', fmt: v => v != null ? `$${v.toFixed(2)}` : 'N/A' },
    { label: 'Revenue Growth', key: 'revenueGrowth', fmt: v => v != null ? formatPercent(v) : 'N/A' },
    { label: 'Profit Margin', key: 'profitMargin', fmt: v => v != null ? formatPercent(v) : 'N/A' },
    { label: 'ROE', key: 'returnOnEquity', fmt: v => v != null ? formatPercent(v) : 'N/A' },
    { label: 'Beta', key: 'beta', fmt: v => v?.toFixed(2) || 'N/A' },
    { label: 'Dividend Yield', key: 'dividend', fmt: v => v != null ? formatPercent(v) : 'N/A' },
    { label: '52W High', key: 'fiftyTwoWeekHigh', fmt: formatCurrency },
    { label: '52W Low', key: 'fiftyTwoWeekLow', fmt: formatCurrency },
    { label: 'Target Price', key: 'targetMeanPrice', fmt: formatCurrency },
    { label: 'Analyst Rating', key: 'recommendation', fmt: v => v?.replace('_', ' ').toUpperCase() || 'N/A' },
    { label: 'Day Change', key: 'changePercent', fmt: v => v != null ? formatChangePercent(v) : 'N/A' },
  ];

  return (
    <div className="compare-page">
      <h1><GitCompare size={24} /> Compare Stocks & ETFs</h1>

      {/* Ticker Input Section */}
      <div className="compare-inputs-card">
        <div className="compare-inputs">
          {tickers.map((ticker, i) => (
            <div key={i} className="compare-input-group">
              <div className="compare-input-wrapper">
                <Search size={14} className="input-icon" />
                <input
                  type="text"
                  placeholder={`Ticker ${i + 1} (e.g. AAPL)`}
                  value={ticker}
                  onChange={(e) => handleSearch(e.target.value.toUpperCase(), i)}
                  onFocus={() => setActiveInput(i)}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  className="compare-input"
                />
                {tickers.length > 2 && (
                  <button className="remove-ticker-btn" onClick={() => removeTickerSlot(i)}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {activeInput === i && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.slice(0, 8).map((r) => (
                    <div
                      key={r.ticker}
                      className="search-dropdown-item"
                      onMouseDown={() => selectTicker(r.ticker, i)}
                    >
                      <strong>{r.ticker}</strong>
                      <span>{r.name}</span>
                      <span style={{ color: getChangeColor(r.changePercent), marginLeft: 'auto' }}>
                        {formatCurrency(r.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {tickers.length < 5 && (
            <button className="add-ticker-btn" onClick={addTickerSlot}>
              <Plus size={16} /> Add
            </button>
          )}
        </div>
        <button className="compare-btn" onClick={handleCompare} disabled={loading || tickers.filter(t => t.trim()).length < 2}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {loading && <LoadingSpinner message="Comparing stocks..." />}

      {/* Comparison Table */}
      {stocks.length >= 2 && (
        <div className="compare-table-card">
          <h3>Side-by-Side Comparison</h3>
          <div className="results-table-wrapper">
            <table className="results-table compare-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {stocks.map((s, i) => (
                    <th key={s.ticker} style={{ color: COLORS[i % COLORS.length] }}>
                      {s.ticker}
                      <div style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>{s.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricRows.map(({ label, key, fmt }) => (
                  <tr key={key}>
                    <td style={{ color: '#888' }}>{label}</td>
                    {stocks.map((s) => {
                      const val = s[key];
                      const isChange = key === 'changePercent';
                      return (
                        <td key={s.ticker} style={isChange ? { color: getChangeColor(val) } : {}}>
                          {fmt(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price Comparison Chart */}
      {historyData && historyData.data && historyData.data.length > 0 && (
        <div className="chart-section">
          <div className="chart-controls">
            <h3><TrendingUp size={18} /> Price Performance (Rebased to 100)</h3>
            <div className="period-buttons">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  className={`period-btn ${period === p.value ? 'active' : ''}`}
                  onClick={() => setPeriod(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historyData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#ccc' }}
              />
              <Legend />
              {historyData.tickers.map((ticker, i) => (
                <Line
                  key={ticker}
                  type="monotone"
                  dataKey={ticker}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Comparison */}
      {stocks.length >= 2 && (
        <div className="ai-section">
          <h3><Brain size={20} /> AI Comparison Analysis</h3>
          {!aiAnalysis && !analyzingAI && (
            <button className="analyze-btn" onClick={handleAIAnalysis}>
              <Brain size={16} /> Generate AI Comparison
            </button>
          )}
          {analyzingAI && <LoadingSpinner message="AI is comparing these stocks..." />}
          {aiAnalysis && <div className="ai-content">{aiAnalysis}</div>}
        </div>
      )}

      {stocks.length >= 2 && (
        <div className="correlation-section">
          <button className="correlation-btn" onClick={async () => {
            setCorrelationLoading(true);
            try {
              const res = await getCorrelation(stocks.map(s => s.ticker), period);
              setCorrelation(res.data);
            } catch { setCorrelation(null); }
            finally { setCorrelationLoading(false); }
          }} disabled={correlationLoading}>
            {correlationLoading ? 'Calculating...' : 'Show Correlation Matrix'}
          </button>

          {correlation && (
            <div className="correlation-matrix">
              <h3>Price Correlation Matrix ({correlation.period})</h3>
              <table className="corr-table">
                <thead>
                  <tr>
                    <th></th>
                    {correlation.tickers.map(t => <th key={t}>{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {correlation.tickers.map((t1, i) => (
                    <tr key={t1}>
                      <td className="corr-label">{t1}</td>
                      {correlation.matrix[i].map((val, j) => {
                        const color = i === j ? 'rgba(99,102,241,0.3)'
                          : val > 0.7 ? 'rgba(0,200,83,0.3)'
                          : val > 0.3 ? 'rgba(255,193,7,0.2)'
                          : val > -0.3 ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,82,82,0.3)';
                        return (
                          <td key={j} className="corr-cell" style={{ background: color }}>
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="corr-legend">
                <span style={{color:'#00c853'}}>■ High correlation ({">"} 0.7)</span>
                <span style={{color:'#ffc107'}}>■ Moderate (0.3-0.7)</span>
                <span style={{color:'#888'}}>■ Low (-0.3 to 0.3)</span>
                <span style={{color:'#ff5252'}}>■ Negative ({"<"} -0.3)</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
