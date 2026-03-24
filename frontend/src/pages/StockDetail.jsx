import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, ReferenceLine } from 'recharts';
import { getStock, getStockHistory, getStockScore, getStockNews, analyzeStock, getETFHoldings, getExtendedHoursHistory } from '../api/client';
import { formatCurrency, formatLargeNumber, formatPercent, formatChangePercent, getChangeColor, getScoreColor } from '../utils/formatters';
import { PERIODS } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Brain, ExternalLink, TrendingUp, TrendingDown, Clock, Target, Calendar, DollarSign } from 'lucide-react';

const COLORS = ['#7c8cf8', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'];

const SCORE_KEYS_STOCK = [
  { key: 'valuation', label: 'Valuation' },
  { key: 'growth', label: 'Growth' },
  { key: 'financialHealth', label: 'Financial Health' },
  { key: 'momentum', label: 'Momentum' },
  { key: 'dividends', label: 'Dividends' },
  { key: 'analyst', label: 'Analyst' },
];

const SCORE_KEYS_ETF = [
  { key: 'costEfficiency', label: 'Cost Efficiency' },
  { key: 'performance', label: 'Performance' },
  { key: 'momentum', label: 'Momentum' },
  { key: 'liquidity', label: 'Liquidity' },
  { key: 'issuerQuality', label: 'Issuer Quality' },
];

export default function StockDetail() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [extendedHistory, setExtendedHistory] = useState([]);
  const [score, setScore] = useState(null);
  const [news, setNews] = useState([]);
  const [etfHoldings, setEtfHoldings] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [period, setPeriod] = useState('1y');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showExtended, setShowExtended] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setAnalysis('');
      try {
        const [s, h, sc, n] = await Promise.all([
          getStock(ticker).catch(() => ({ data: null })),
          getStockHistory(ticker, period).catch(() => ({ data: [] })),
          getStockScore(ticker).catch(() => ({ data: null })),
          getStockNews(ticker).catch(() => ({ data: [] })),
        ]);
        setStock(s.data);
        setHistory(h.data || []);
        setScore(sc.data);
        setNews(Array.isArray(n.data) ? n.data : []);

        // Load ETF holdings if applicable
        if (s.data?.isETF) {
          getETFHoldings(ticker).then(r => setEtfHoldings(r.data)).catch(() => {});
        } else {
          setEtfHoldings(null);
        }

        // Load extended hours data
        getExtendedHoursHistory(ticker)
          .then(r => setExtendedHistory(r.data || []))
          .catch(() => setExtendedHistory([]));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticker, period]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeStock(ticker);
      setAnalysis(res.data.analysis);
    } catch {
      setAnalysis('Failed to generate analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <LoadingSpinner message={`Loading ${ticker}...`} />;
  if (!stock) return <div className="error-message">Stock {ticker} not found.</div>;

  const isUp = (stock.changePercent || 0) >= 0;
  const isETF = stock.isETF;
  const scoreKeys = isETF ? SCORE_KEYS_ETF : SCORE_KEYS_STOCK;

  // Build chart data with after-hours markers
  // When extended is on, show a continuous line for ALL data,
  // plus an overlay line that only has values during extended hours
  const chartData = showExtended && extendedHistory.length > 0
    ? extendedHistory.map((p, i, arr) => {
        // "regularClose" = the continuous price line (always filled)
        // "afterHours" = overlay line only during extended hours (for color distinction)
        const prev = i > 0 ? arr[i - 1] : null;
        const next = i < arr.length - 1 ? arr[i + 1] : null;
        // To keep after-hours line connected to regular hours, include boundary points
        const isEdge = (p.isExtended && prev && !prev.isExtended) ||
                       (p.isExtended && next && !next.isExtended) ||
                       (!p.isExtended && prev && prev.isExtended) ||
                       (!p.isExtended && next && next.isExtended);
        return {
          date: p.date,
          regularClose: p.close,
          afterHours: p.isExtended || isEdge ? p.close : null,
          volume: p.volume,
          isExtended: p.isExtended,
        };
      })
    : history;

  // Calculate target price info
  const targetPrice = stock.targetMeanPrice;
  const targetHigh = stock.targetHighPrice;
  const targetLow = stock.targetLowPrice;
  const currentPrice = stock.price;
  const targetUpside = targetPrice && currentPrice ? ((targetPrice / currentPrice - 1) * 100) : null;

  return (
    <div className="stock-detail">
      <div className="stock-header">
        <div>
          <h1>
            {stock.ticker}
            <span className="stock-name-sub"> {stock.name}</span>
            {isETF && <span className="etf-badge">ETF</span>}
          </h1>
          <div className="stock-price-row">
            <span className="big-price">{formatCurrency(stock.price)}</span>
            <span className="big-change" style={{ color: getChangeColor(stock.changePercent) }}>
              {isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {formatChangePercent(stock.changePercent)}
            </span>
          </div>
          {/* Pre/Post Market */}
          {stock.preMarketPrice && (
            <div className="extended-hours">
              <Clock size={12} />
              <span>Pre-Market: {formatCurrency(stock.preMarketPrice)} </span>
              <span style={{ color: getChangeColor(stock.preMarketChangePercent) }}>
                {formatChangePercent(stock.preMarketChangePercent)}
              </span>
            </div>
          )}
          {stock.postMarketPrice && (
            <div className="extended-hours" style={{ color: '#4ade80' }}>
              <Clock size={12} />
              <span>After-Hours: {formatCurrency(stock.postMarketPrice)} </span>
              <span style={{ color: stock.postMarketChangePercent >= 0 ? '#4ade80' : '#f87171' }}>
                {formatChangePercent(stock.postMarketChangePercent)}
              </span>
            </div>
          )}
          <span className="stock-sector-badge">
            {isETF ? (stock.category || 'ETF') : `${stock.sector} - ${stock.industry}`}
          </span>
        </div>
        {score && (
          <div className="score-panel">
            <div className="big-score" style={{ backgroundColor: getScoreColor(score.composite) }}>
              {score.composite}
            </div>
            <span className="score-rating">{score.rating}</span>
          </div>
        )}
      </div>

      {/* Price Chart */}
      <div className="chart-section">
        <div className="chart-controls">
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
          {extendedHistory.length > 0 && (
            <button
              className={`period-btn ${showExtended ? 'active' : ''}`}
              onClick={() => setShowExtended(!showExtended)}
              style={{ marginLeft: 12, borderColor: '#4ade80', color: showExtended ? '#fff' : '#4ade80', background: showExtended ? '#4ade80' : 'transparent' }}
            >
              <Clock size={12} /> After Hours
            </button>
          )}
        </div>
        <ResponsiveContainer width="100%" height={350}>
          {showExtended && extendedHistory.length > 0 ? (
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorRegular" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(d) => {
                const timePart = d.slice(11);
                if (timePart) return timePart;
                const datePart = d.slice(5, 10);
                return datePart;
              }} interval="preserveStartEnd" minTickGap={50} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#ccc' }}
                formatter={(v, name) => [formatCurrency(v), name === 'afterHours' ? 'After Hours' : 'Regular']}
              />
              {/* Solid continuous line for regular hours */}
              <Area type="monotone" dataKey="regularClose" stroke={isUp ? '#22c55e' : '#ef4444'} fill="url(#colorRegular)" strokeWidth={2} name="Regular" dot={false} connectNulls />
              {/* Overlay dashed line for after-hours segments only */}
              <Line type="monotone" dataKey="afterHours" stroke="#4ade80" strokeWidth={2.5} dot={false} name="After Hours" connectNulls={false} strokeDasharray="6 3" />
            </ComposedChart>
          ) : (
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#ccc' }}
                formatter={(v) => [formatCurrency(v), 'Price']}
              />
              <Area type="monotone" dataKey="close" stroke={isUp ? '#22c55e' : '#ef4444'} fill="url(#colorPrice)" strokeWidth={2} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="detail-grid">
        {/* Key Metrics */}
        <div className="metrics-card">
          <h3>{isETF ? 'ETF Details' : 'Key Metrics'}</h3>
          <table className="metrics-table">
            <tbody>
              {isETF ? (
                <>
                  <tr><td>Total Assets</td><td>{formatLargeNumber(stock.totalAssets)}</td></tr>
                  <tr><td>Expense Ratio</td><td>{stock.expenseRatio != null ? (stock.expenseRatio * 100).toFixed(2) + '%' : 'N/A'}</td></tr>
                  <tr><td>Fund Family</td><td>{stock.fundFamily || 'N/A'}</td></tr>
                  <tr><td>Category</td><td>{stock.category || 'N/A'}</td></tr>
                  <tr><td>YTD Return</td><td>{stock.ytdReturn ? formatPercent(stock.ytdReturn) : 'N/A'}</td></tr>
                  <tr><td>3Y Return</td><td>{stock.threeYearReturn ? formatPercent(stock.threeYearReturn) : 'N/A'}</td></tr>
                  <tr><td>5Y Return</td><td>{stock.fiveYearReturn ? formatPercent(stock.fiveYearReturn) : 'N/A'}</td></tr>
                  <tr><td>Beta</td><td>{stock.beta?.toFixed(2) || 'N/A'}</td></tr>
                  <tr><td>Dividend Yield</td><td>{stock.dividend ? formatPercent(stock.dividend) : 'N/A'}</td></tr>
                  <tr><td>52W High</td><td>{formatCurrency(stock.fiftyTwoWeekHigh)}</td></tr>
                  <tr><td>52W Low</td><td>{formatCurrency(stock.fiftyTwoWeekLow)}</td></tr>
                  <tr><td>Avg Volume</td><td>{formatLargeNumber(stock.avgVolume)}</td></tr>
                </>
              ) : (
                <>
                  <tr><td>Market Cap</td><td>{formatLargeNumber(stock.marketCap)}</td></tr>
                  <tr><td>P/E Ratio</td><td>{stock.pe?.toFixed(2) || 'N/A'}</td></tr>
                  <tr><td>Forward P/E</td><td>{stock.forwardPE?.toFixed(2) || 'N/A'}</td></tr>
                  <tr><td>PEG Ratio</td><td>{stock.peg?.toFixed(2) || 'N/A'}</td></tr>
                  <tr><td>EPS</td><td>{formatCurrency(stock.eps)}</td></tr>
                  <tr><td>Beta</td><td>{stock.beta?.toFixed(2) || 'N/A'}</td></tr>
                  <tr><td>Dividend Yield</td><td>{stock.dividend ? formatPercent(stock.dividend) : 'N/A'}</td></tr>
                  <tr><td>Debt/Equity</td><td>{stock.debtToEquity?.toFixed(1) || 'N/A'}</td></tr>
                  <tr><td>Free Cash Flow</td><td>{formatLargeNumber(stock.freeCashflow)}</td></tr>
                  <tr><td>52W High</td><td>{formatCurrency(stock.fiftyTwoWeekHigh)}</td></tr>
                  <tr><td>52W Low</td><td>{formatCurrency(stock.fiftyTwoWeekLow)}</td></tr>
                  <tr><td>50-Day Avg</td><td>{formatCurrency(stock.fiftyDayAvg)}</td></tr>
                  <tr><td>200-Day Avg</td><td>{formatCurrency(stock.twoHundredDayAvg)}</td></tr>
                  <tr><td>Revenue Growth</td><td>{stock.revenueGrowth ? formatPercent(stock.revenueGrowth) : 'N/A'}</td></tr>
                  <tr><td>Profit Margin</td><td>{stock.profitMargin ? formatPercent(stock.profitMargin) : 'N/A'}</td></tr>
                  <tr><td>ROE</td><td>{stock.returnOnEquity ? formatPercent(stock.returnOnEquity) : 'N/A'}</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Score Breakdown + Target Price */}
        <div className="metrics-card">
          <h3>Score Breakdown {isETF ? '(ETF)' : '(Stock)'}</h3>
          {score && (
            <div className="score-bars">
              {scoreKeys.map(({ key, label }) => (
                score[key] != null && (
                  <div key={key} className="score-bar-row">
                    <span className="score-label">{label}</span>
                    <div className="score-bar-bg">
                      <div
                        className="score-bar-fill"
                        style={{ width: `${score[key]}%`, backgroundColor: getScoreColor(score[key]) }}
                      />
                    </div>
                    <span className="score-value">{score[key]}</span>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Target Price Section - More Prominent */}
          {(targetPrice || stock.recommendation) && (
            <div className="target-price-section">
              <h4><Target size={16} /> Price Target & Analyst Consensus</h4>
              {stock.recommendation && (
                <div className="target-row highlight">
                  <span className="target-label">Analyst Rating</span>
                  <span className={`analyst-badge ${stock.recommendation}`}>{stock.recommendation.replace('_', ' ').toUpperCase()}</span>
                </div>
              )}
              {targetPrice && (
                <>
                  <div className="target-row highlight">
                    <span className="target-label">Target Price (12-Month)</span>
                    <span className="target-value">{formatCurrency(targetPrice)}</span>
                  </div>
                  {targetUpside !== null && (
                    <div className="target-row">
                      <span className="target-label">Potential Upside/Downside</span>
                      <span className="target-value" style={{ color: targetUpside >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 18 }}>
                        {targetUpside >= 0 ? '+' : ''}{targetUpside.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {targetHigh && (
                    <div className="target-row">
                      <span className="target-label">Target High</span>
                      <span className="target-value">{formatCurrency(targetHigh)}</span>
                    </div>
                  )}
                  {targetLow && (
                    <div className="target-row">
                      <span className="target-label">Target Low</span>
                      <span className="target-value">{formatCurrency(targetLow)}</span>
                    </div>
                  )}
                </>
              )}
              {stock.numberOfAnalysts && (
                <div className="target-row">
                  <span className="target-label">Number of Analysts</span>
                  <span className="target-value">{stock.numberOfAnalysts}</span>
                </div>
              )}
              <p className="target-note">
                <Calendar size={12} /> Analyst targets typically represent a 12-month price outlook.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ETF Holdings */}
      {isETF && etfHoldings && etfHoldings.holdings && etfHoldings.holdings.length > 0 && (
        <div className="metrics-card" style={{ marginBottom: 24 }}>
          <h3>Top Holdings ({etfHoldings.holdings.length} companies)</h3>
          <table className="metrics-table">
            <thead>
              <tr>
                <td style={{ color: '#888' }}>Symbol</td>
                <td style={{ color: '#888' }}>Company</td>
                <td style={{ color: '#888', textAlign: 'right' }}>Weight</td>
              </tr>
            </thead>
            <tbody>
              {etfHoldings.holdings.map((h, i) => (
                <tr key={i} className="clickable-row" onClick={() => h.symbol && navigate(`/stock/${h.symbol}`)}>
                  <td><strong style={{ color: '#7c8cf8' }}>{h.symbol || '—'}</strong></td>
                  <td style={{ color: '#ccc' }}>{h.name}</td>
                  <td style={{ textAlign: 'right' }}>
                    {h.weight ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 60, height: 6, background: '#1e1e3a', borderRadius: 3, overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: `${Math.min(h.weight * 5, 100)}%`, background: '#7c8cf8', borderRadius: 3 }} />
                        </span>
                        <span style={{ fontWeight: 600 }}>{h.weight}%</span>
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Sector Weights */}
          {etfHoldings.sectorWeights && etfHoldings.sectorWeights.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 14, color: '#888', marginBottom: 10 }}>Sector Breakdown</h4>
              {etfHoldings.sectorWeights.map((sw, i) => (
                <div key={i} className="score-bar-row" style={{ marginBottom: 6 }}>
                  <span className="score-label" style={{ width: 150 }}>{sw.sector}</span>
                  <div className="score-bar-bg">
                    <div className="score-bar-fill" style={{ width: `${sw.weight}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="score-value">{sw.weight}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Analysis */}
      <div className="ai-section">
        <h3><Brain size={20} /> AI Analysis</h3>
        {!analysis && !analyzing && (
          <button className="analyze-btn" onClick={handleAnalyze}>
            <Brain size={16} /> Generate AI Analysis
          </button>
        )}
        {analyzing && <LoadingSpinner message={`AI is analyzing this ${isETF ? 'ETF' : 'stock'}...`} />}
        {analysis && <div className="ai-content">{analysis}</div>}
      </div>

      {/* Company Description */}
      {stock.description && (
        <div className="description-section">
          <h3>About {stock.name}</h3>
          <p>{stock.description}</p>
          {stock.website && (
            <a href={stock.website} target="_blank" rel="noopener noreferrer" className="website-link">
              <ExternalLink size={14} /> {stock.website}
            </a>
          )}
        </div>
      )}

      {/* News - Always show section */}
      <div className="news-section">
        <h3>Latest News</h3>
        {news && news.length > 0 ? (
          <div className="news-list">
            {news.map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" className="news-item">
                <div>
                  <h4>{article.title}</h4>
                  <p>{article.description}</p>
                  <span className="news-meta">{article.source} {article.publishedAt ? `- ${new Date(typeof article.publishedAt === 'number' ? article.publishedAt * 1000 : article.publishedAt).toLocaleDateString()}` : ''}</span>
                </div>
                {article.image && <img src={article.image} alt="" className="news-thumb" />}
              </a>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', fontSize: 14 }}>No recent news available for {ticker}. News data is sourced from Yahoo Finance and may not be available for all securities.</p>
        )}
      </div>
    </div>
  );
}
