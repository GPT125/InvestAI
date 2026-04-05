import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend, ReferenceLine, ComposedChart } from 'recharts';
import { getStock, getStockHistory, getStockScore, getStockNews, analyzeStock, getETFHoldings, getExtendedHoursHistory, getIncomeStatement, getEarnings, getPerformanceComparison, getTechnicals, getStockPeers } from '../api/client';
import { formatCurrency, formatLargeNumber, formatPercent, formatChangePercent, getChangeColor, getScoreColor } from '../utils/formatters';
import { PERIODS } from '../utils/constants';
import { renderMarkdown } from '../utils/markdown';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Brain, ExternalLink, TrendingUp, TrendingDown, Clock, Target, Calendar, DollarSign, BarChart3, Activity, BarChart2, Gauge, Calculator, ChevronDown } from 'lucide-react';

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

const fmtB = (v) => {
  if (v == null) return 'N/A';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
};


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
  // Data for charts
  const [incomeData, setIncomeData] = useState([]);
  const [earningsData, setEarningsData] = useState(null);
  const [perfData, setPerfData] = useState(null);
  const [technicals, setTechnicals] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcEntry, setCalcEntry] = useState('');
  const [calcTarget, setCalcTarget] = useState('');
  const [calcStop, setCalcStop] = useState('');
  const [calcRisk, setCalcRisk] = useState('1000');
  const [peers, setPeers] = useState(null);
  const [peersLoading, setPeersLoading] = useState(false);

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

        const isETF = s.data?.isETF;

        // Load ETF holdings if applicable
        if (isETF) {
          getETFHoldings(ticker).then(r => setEtfHoldings(r.data)).catch(() => {});
        } else {
          setEtfHoldings(null);
          // Load financial data for charts (stocks only)
          getIncomeStatement(ticker, 'quarter').then(r => {
            if (Array.isArray(r.data) && r.data.length > 0) {
              setIncomeData(r.data.slice().reverse().map(q => ({
                quarter: q.period || q.date?.slice(0, 7) || '',
                revenue: q.revenue,
                netIncome: q.netIncome,
                grossProfit: q.grossProfit,
                operatingIncome: q.operatingIncome,
              })));
            }
          }).catch(() => {});

          getEarnings(ticker).then(r => setEarningsData(r.data)).catch(() => {});
          getPerformanceComparison(ticker).then(r => setPerfData(r.data)).catch(() => {});
        }

        // Load technical analysis data
        getTechnicals(ticker)
          .then(r => setTechnicals(r.data))
          .catch(() => setTechnicals(null));

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

  const calcResults = () => {
    const entry = parseFloat(calcEntry) || 0;
    const target = parseFloat(calcTarget) || 0;
    const stop = parseFloat(calcStop) || 0;
    const riskAmount = parseFloat(calcRisk) || 0;

    if (!entry || !stop || !riskAmount) return null;

    const riskPerShare = Math.abs(entry - stop);
    const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
    const totalCost = shares * entry;
    const potentialLoss = shares * riskPerShare;
    const potentialGain = target ? shares * Math.abs(target - entry) : 0;
    const riskReward = potentialLoss > 0 && potentialGain > 0 ? (potentialGain / potentialLoss).toFixed(2) : 'N/A';
    const targetPercent = target && entry ? (((target - entry) / entry) * 100).toFixed(2) : 0;
    const stopPercent = entry ? (((stop - entry) / entry) * 100).toFixed(2) : 0;

    return { shares, totalCost, potentialLoss, potentialGain, riskReward, riskPerShare, targetPercent, stopPercent };
  };

  if (loading) return <LoadingSpinner message={`Loading ${ticker}...`} />;
  if (!stock) return <div className="error-message">Stock {ticker} not found.</div>;

  const isUp = (stock.changePercent || 0) >= 0;
  const isETF = stock.isETF;
  const scoreKeys = isETF ? SCORE_KEYS_ETF : SCORE_KEYS_STOCK;

  // Only allow after-hours view for short periods (1D/5D) where intraday data makes sense
  const canShowExtended = ['1d', '5d'].includes(period) && extendedHistory.length > 0;

  const rawChartData = showExtended && canShowExtended
    ? extendedHistory.map((p) => ({
        date: p.date,
        close: p.close,
        volume: p.volume,
        isExtended: p.isExtended,
      }))
    : history;

  // Compute SMAs for periods with enough data
  const showSMA = !['1d', '5d'].includes(period);
  const chartData = rawChartData.map((d, i) => {
    const result = { ...d };
    if (showSMA) {
      if (i >= 49) {
        const slice50 = rawChartData.slice(i - 49, i + 1);
        result.sma50 = parseFloat((slice50.reduce((s, p) => s + (p.close || 0), 0) / 50).toFixed(2));
      }
      if (i >= 199) {
        const slice200 = rawChartData.slice(i - 199, i + 1);
        result.sma200 = parseFloat((slice200.reduce((s, p) => s + (p.close || 0), 0) / 200).toFixed(2));
      }
    }
    return result;
  });

  const targetPrice = stock.targetMeanPrice;
  const targetHigh = stock.targetHighPrice;
  const targetLow = stock.targetLowPrice;
  const currentPrice = stock.price;
  const targetUpside = targetPrice && currentPrice ? ((targetPrice / currentPrice - 1) * 100) : null;

  // Build performance comparison data for chart
  const perfChartData = perfData?.periods ? Object.entries(perfData.periods).map(([k, v]) => ({
    period: k.toUpperCase(),
    stock: v.stockReturn,
    sp500: v.spReturn,
  })) : [];

  // Build earnings chart data
  const earningsChartData = earningsData?.data?.quarterly_revenue?.length > 0
    ? earningsData.data.quarterly_revenue.map(q => ({
        quarter: q.quarter,
        revenue: q.revenue,
        earnings: q.earnings,
      }))
    : [];

  // EPS chart data
  const epsChartData = earningsData?.data?.eps_history?.filter(e => e.epsActual != null)?.slice().reverse() || [];

  // Gross margin trend
  const grossMarginData = incomeData.filter(q => q.revenue > 0 && q.grossProfit != null).map(q => ({
    quarter: q.quarter,
    grossMarginPct: parseFloat(((q.grossProfit / q.revenue) * 100).toFixed(1)),
    operatingMarginPct: q.operatingIncome && q.revenue > 0 ? parseFloat(((q.operatingIncome / q.revenue) * 100).toFixed(1)) : null,
  }));

  // Build valuation metrics for radar-like display
  const valuationMetrics = !isETF ? [
    { label: 'P/E', value: stock.pe, benchmark: 25 },
    { label: 'Fwd P/E', value: stock.forwardPE, benchmark: 20 },
    { label: 'P/B', value: stock.pb, benchmark: 3 },
    { label: 'Debt/Eq', value: stock.debtToEquity, benchmark: 100 },
    { label: 'Profit %', value: stock.profitMargin ? stock.profitMargin * 100 : null, benchmark: 20 },
    { label: 'ROE %', value: stock.returnOnEquity ? stock.returnOnEquity * 100 : null, benchmark: 15 },
  ].filter(m => m.value != null) : [];

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
          {/* 52-Week Range */}
          {stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh && (
            <div className="week52-range">
              <div className="week52-labels">
                <span>52W Low: ${stock.fiftyTwoWeekLow?.toFixed(2)}</span>
                <span>52W High: ${stock.fiftyTwoWeekHigh?.toFixed(2)}</span>
              </div>
              <div className="week52-bar">
                <div className="week52-fill" style={{
                  width: `${Math.min(100, Math.max(0, ((stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100))}%`
                }}>
                  <span className="week52-marker">&#9660;</span>
                </div>
              </div>
            </div>
          )}
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
          {canShowExtended && (
            <button
              className={`period-btn ${showExtended ? 'active' : ''}`}
              onClick={() => setShowExtended(!showExtended)}
              style={{ marginLeft: 12, borderColor: '#4ade80', color: showExtended ? '#fff' : '#4ade80', background: showExtended ? '#4ade80' : 'transparent' }}
            >
              <Clock size={12} /> After Hours
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(d) => {
                if (showExtended && canShowExtended) return d.slice(11) || d.slice(5, 10);
                return d.slice(5);
              }} interval="preserveStartEnd" minTickGap={50} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} domain={['auto', 'auto']} width={65} tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#ccc' }}
                formatter={(v, name) => {
                  if (name === 'close') return [formatCurrency(v), 'Price'];
                  if (name === 'sma50') return [formatCurrency(v), 'SMA 50'];
                  if (name === 'sma200') return [formatCurrency(v), 'SMA 200'];
                  return [formatCurrency(v), name];
                }}
              />
              <Area type="monotone" dataKey="close" stroke={isUp ? '#22c55e' : '#ef4444'} fill="url(#colorPrice)" strokeWidth={2} dot={false} connectNulls />
              {showSMA && chartData.some(d => d.sma50) && (
                <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
              )}
              {showSMA && chartData.some(d => d.sma200) && (
                <Line type="monotone" dataKey="sma200" stroke="#8b5cf6" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
              )}
              {showSMA && (chartData.some(d => d.sma50) || chartData.some(d => d.sma200)) && (
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                  formatter={(v) => v === 'close' ? 'Price' : v === 'sma50' ? 'SMA 50' : v === 'sma200' ? 'SMA 200' : v}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Volume Chart */}
          {chartData.some(d => d.volume > 0) && (
            <ResponsiveContainer width="100%" height={70}>
              <BarChart data={chartData} barCategoryGap={0}>
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fill: '#555', fontSize: 9 }} width={65} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${(v/1e6).toFixed(2)}M`, 'Volume']}
                  labelStyle={{ color: '#888', fontSize: 10 }}
                />
                <Bar dataKey="volume" fill="#7c8cf8" opacity={0.6} radius={0} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Data-Driven Charts Section - Revenue, Earnings, Performance */}
      {!isETF && (incomeData.length > 0 || earningsChartData.length > 0 || perfChartData.length > 0) && (
        <div className="data-charts-section">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} /> Financial Data & Charts
          </h2>
          <div className="data-charts-grid">
            {/* Revenue & Net Income */}
            {incomeData.length > 0 && (
              <div className="chart-card">
                <h3>Revenue vs Net Income (Quarterly)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={incomeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="quarter" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} tickFormatter={fmtB} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                      formatter={(v) => [fmtB(v)]}
                    />
                    <Bar dataKey="revenue" fill="#7c8cf8" name="Revenue" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="netIncome" fill="#22c55e" name="Net Income" radius={[3, 3, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Earnings - Revenue & Earnings */}
            {earningsChartData.length > 0 && (
              <div className="chart-card">
                <h3>Quarterly Revenue & Earnings</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={earningsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="quarter" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} tickFormatter={fmtB} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                      formatter={(v) => [fmtB(v)]}
                    />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="earnings" fill="#06b6d4" name="Earnings" radius={[3, 3, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* EPS Actual vs Estimate */}
            {epsChartData.length > 0 && (
              <div className="chart-card">
                <h3>EPS: Actual vs Estimate</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={epsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="quarter" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <ReferenceLine y={0} stroke="#444" strokeWidth={1} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                      formatter={(v, name, props) => {
                        const d = props.payload;
                        if (name === 'epsActual' && d.epsEstimate != null) {
                          const beat = v > d.epsEstimate;
                          return [`$${v?.toFixed(2)} ${beat ? '▲ Beat' : '▼ Miss'}`, 'Actual EPS'];
                        }
                        return [`$${v?.toFixed(2)}`, name === 'epsEstimate' ? 'Est. EPS' : 'Actual EPS'];
                      }}
                    />
                    <Bar dataKey="epsEstimate" fill="#444" name="Estimate" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="epsActual" name="Actual" radius={[3, 3, 0, 0]}>
                      {epsChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.epsActual >= (entry.epsEstimate ?? entry.epsActual) ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                    <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Performance vs S&P 500 */}
            {perfChartData.length > 0 && (
              <div className="chart-card">
                <h3>{ticker} vs S&P 500 Returns</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perfChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="period" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <ReferenceLine y={0} stroke="#555" strokeWidth={1.5} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                      formatter={(v, name) => [`${v?.toFixed(1)}%`, name === 'stock' ? ticker : 'S&P 500']}
                    />
                    <Bar dataKey="stock" name={ticker} radius={[3, 3, 0, 0]}>
                      {perfChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.stock >= 0 ? '#7c8cf8' : '#ef4444'} />
                      ))}
                    </Bar>
                    <Bar dataKey="sp500" name="S&P 500" radius={[3, 3, 0, 0]}>
                      {perfChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.sp500 >= 0 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                    <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gross Margin Trend */}
            {grossMarginData.length > 1 && (
              <div className="chart-card">
                <h3>Margin Trend (Quarterly)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={grossMarginData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="quarter" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                      formatter={(v, name) => [`${v?.toFixed(1)}%`, name === 'grossMarginPct' ? 'Gross Margin' : 'Operating Margin']}
                    />
                    <Line type="monotone" dataKey="grossMarginPct" stroke="#7c8cf8" strokeWidth={2} dot={{ r: 3 }} name="Gross Margin" />
                    {grossMarginData.some(d => d.operatingMarginPct != null) && (
                      <Line type="monotone" dataKey="operatingMarginPct" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Operating Margin" />
                    )}
                    <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Valuation Metrics Table */}
            {valuationMetrics.length > 0 && (
              <div className="chart-card">
                <h3>Valuation Snapshot</h3>
                <table className="metrics-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <td style={{ color: '#666', fontSize: 11 }}>Metric</td>
                      <td style={{ color: '#666', fontSize: 11, textAlign: 'right' }}>Value</td>
                      <td style={{ color: '#666', fontSize: 11, textAlign: 'right' }}>Benchmark</td>
                      <td style={{ color: '#666', fontSize: 11, width: 80 }}>Rating</td>
                    </tr>
                  </thead>
                  <tbody>
                    {valuationMetrics.map((m, i) => {
                      const ratio = m.value / m.benchmark;
                      const color = ratio < 0.8 ? '#22c55e' : ratio < 1.2 ? '#f59e0b' : '#ef4444';
                      const label = ratio < 0.8 ? 'Good' : ratio < 1.2 ? 'Fair' : 'High';
                      return (
                        <tr key={i}>
                          <td>{m.label}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{m.value?.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', color: '#666' }}>{m.benchmark}</td>
                          <td>
                            <span style={{ color, fontWeight: 600, fontSize: 12 }}>{label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
                      <div className="score-bar-fill" style={{ width: `${score[key]}%`, backgroundColor: getScoreColor(score[key]) }} />
                    </div>
                    <span className="score-value">{score[key]}</span>
                  </div>
                )
              ))}
            </div>
          )}
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

      {/* Financials Link */}
      {!isETF && (
        <div className="metrics-card" style={{ marginBottom: 24, textAlign: 'center', padding: 16 }}>
          <button
            className="analyze-btn"
            onClick={() => navigate(`/stock/${ticker}/financials`)}
            style={{ margin: '0 auto', background: '#1e1e3a', border: '1px solid #7c8cf8' }}
          >
            <DollarSign size={16} /> View Full Financials (Income, Balance Sheet, Cash Flow, Earnings)
          </button>
        </div>
      )}

      {/* Technical Analysis Panel */}
      {technicals && (
        <div className="technicals-panel">
          <div className="technicals-header">
            <h3><Activity size={20} /> Technical Dashboard</h3>
            <span className={`overall-signal ${
              technicals.overall_signal === 'Bullish' ? 'bullish' :
              technicals.overall_signal === 'Bearish' ? 'bearish' : 'neutral'
            }`}>
              {technicals.overall_signal === 'Bullish' ? <TrendingUp size={14} /> :
               technicals.overall_signal === 'Bearish' ? <TrendingDown size={14} /> :
               <Activity size={14} />}
              {' '}{technicals.overall_signal || 'Neutral'}
            </span>
          </div>
          <div className="indicators-grid">
            {/* RSI */}
            {technicals.rsi != null && (
              <div className="indicator-card">
                <h4><Gauge size={14} /> RSI (14)</h4>
                <div className="indicator-value">{technicals.rsi?.toFixed(1)}</div>
                <div className="rsi-bar">
                  <div className="rsi-marker" style={{ left: `${Math.min(Math.max(technicals.rsi, 0), 100)}%` }} />
                </div>
                <div className="indicator-sub">
                  {technicals.rsi > 70 ? 'Overbought Zone (>70)' :
                   technicals.rsi < 30 ? 'Oversold Zone (<30)' :
                   'Neutral Zone (30-70)'}
                </div>
                <span className={`indicator-signal ${
                  technicals.rsi > 70 ? 'bearish' : technicals.rsi < 30 ? 'bullish' : 'neutral'
                }`}>
                  {technicals.rsi > 70 ? 'Overbought' : technicals.rsi < 30 ? 'Oversold' : 'Neutral'}
                </span>
              </div>
            )}

            {/* MACD */}
            {technicals.macd != null && (
              <div className="indicator-card">
                <h4><BarChart2 size={14} /> MACD</h4>
                <div className="indicator-value" style={{ color: technicals.macd?.macd >= 0 ? '#00c853' : '#ff5252' }}>
                  {technicals.macd?.macd?.toFixed(2)}
                </div>
                <div className="indicator-sub">
                  Signal: {technicals.macd?.signal?.toFixed(2)} | Histogram: {technicals.macd?.histogram?.toFixed(2)}
                </div>
                <div className="macd-histogram">
                  {technicals.macd?.histogram_bars?.map((bar, i) => (
                    <div key={i} style={{
                      flex: 1,
                      height: `${Math.min(Math.abs(bar) * 100, 100)}%`,
                      background: bar >= 0 ? 'rgba(0,200,83,0.6)' : 'rgba(255,82,82,0.6)',
                      borderRadius: 2,
                      alignSelf: bar >= 0 ? 'flex-end' : 'flex-end',
                    }} />
                  ))}
                </div>
                <span className={`indicator-signal ${
                  technicals.macd?.histogram > 0 ? 'bullish' :
                  technicals.macd?.histogram < 0 ? 'bearish' : 'neutral'
                }`}>
                  {technicals.macd?.histogram > 0 ? 'Bullish' :
                   technicals.macd?.histogram < 0 ? 'Bearish' : 'Neutral'}
                </span>
              </div>
            )}

            {/* Bollinger Bands */}
            {technicals.bollinger != null && (
              <div className="indicator-card">
                <h4><Activity size={14} /> Bollinger Bands</h4>
                <div className="indicator-value">
                  {technicals.bollinger?.position != null
                    ? `${(technicals.bollinger.position * 100).toFixed(0)}%`
                    : 'N/A'}
                </div>
                <div className="indicator-sub">
                  Upper: {technicals.bollinger?.upper?.toFixed(2)} | Middle: {technicals.bollinger?.middle?.toFixed(2)} | Lower: {technicals.bollinger?.lower?.toFixed(2)}
                </div>
                <div style={{ width: '100%', height: 8, background: '#222', borderRadius: 4, position: 'relative', marginTop: 8 }}>
                  <div style={{
                    position: 'absolute', top: -4, width: 16, height: 16, background: '#7c8cf8',
                    borderRadius: '50%', transform: 'translateX(-50%)',
                    left: `${Math.min(Math.max((technicals.bollinger?.position || 0.5) * 100, 0), 100)}%`,
                    boxShadow: '0 0 6px rgba(124,140,248,0.5)',
                  }} />
                </div>
                <span className={`indicator-signal ${
                  (technicals.bollinger?.position || 0.5) > 0.8 ? 'bearish' :
                  (technicals.bollinger?.position || 0.5) < 0.2 ? 'bullish' : 'neutral'
                }`}>
                  {(technicals.bollinger?.position || 0.5) > 0.8 ? 'Near Upper Band' :
                   (technicals.bollinger?.position || 0.5) < 0.2 ? 'Near Lower Band' : 'Mid Range'}
                </span>
              </div>
            )}

            {/* Moving Averages */}
            {technicals.moving_averages != null && (
              <div className="indicator-card">
                <h4><TrendingUp size={14} /> Moving Averages</h4>
                <div className="ma-comparison">
                  <div className="ma-item">
                    <span className="ma-label">SMA 50</span>
                    <span className="ma-value">{technicals.moving_averages?.sma50?.toFixed(2)}</span>
                  </div>
                  <div className="ma-item">
                    <span className="ma-label">SMA 200</span>
                    <span className="ma-value">{technicals.moving_averages?.sma200?.toFixed(2)}</span>
                  </div>
                  <div className="ma-item">
                    <span className="ma-label">EMA 50</span>
                    <span className="ma-value">{technicals.moving_averages?.ema50?.toFixed(2)}</span>
                  </div>
                  <div className="ma-item">
                    <span className="ma-label">EMA 200</span>
                    <span className="ma-value">{technicals.moving_averages?.ema200?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="indicator-sub" style={{ marginTop: 8 }}>
                  {technicals.moving_averages?.sma50 > technicals.moving_averages?.sma200
                    ? 'Golden Cross (SMA50 > SMA200) - Bullish'
                    : 'Death Cross (SMA50 < SMA200) - Bearish'}
                </div>
                <span className={`indicator-signal ${
                  technicals.moving_averages?.sma50 > technicals.moving_averages?.sma200 ? 'bullish' : 'bearish'
                }`}>
                  {technicals.moving_averages?.sma50 > technicals.moving_averages?.sma200
                    ? 'Golden Cross' : 'Death Cross'}
                </span>
              </div>
            )}

            {/* Stochastic Oscillator */}
            {technicals.stochastic != null && (
              <div className="indicator-card">
                <h4><Gauge size={14} /> Stochastic Oscillator</h4>
                <div className="indicator-value">
                  %K: {technicals.stochastic?.k?.toFixed(1)}
                </div>
                <div className="indicator-sub">
                  %D: {technicals.stochastic?.d?.toFixed(1)}
                </div>
                <div className="rsi-bar" style={{ marginTop: 8 }}>
                  <div className="rsi-marker" style={{ left: `${Math.min(Math.max(technicals.stochastic?.k || 50, 0), 100)}%` }} />
                </div>
                <span className={`indicator-signal ${
                  technicals.stochastic?.k > 80 ? 'bearish' :
                  technicals.stochastic?.k < 20 ? 'bullish' : 'neutral'
                }`}>
                  {technicals.stochastic?.k > 80 ? 'Overbought' :
                   technicals.stochastic?.k < 20 ? 'Oversold' : 'Neutral'}
                </span>
              </div>
            )}

            {/* ATR */}
            {technicals.atr != null && (
              <div className="indicator-card">
                <h4><BarChart2 size={14} /> ATR (Average True Range)</h4>
                <div className="indicator-value">{technicals.atr?.toFixed(2)}</div>
                <div className="indicator-sub">
                  Measures market volatility. Higher ATR = more volatile.
                </div>
                <span className="indicator-signal neutral">Volatility Indicator</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trade Calculator */}
      <div className="trade-calculator-section">
        <button className="calculator-toggle" onClick={() => {
          setShowCalculator(!showCalculator);
          if (!calcEntry && stock?.price) setCalcEntry(stock.price.toFixed(2));
        }}>
          <Calculator size={18} /> Trade Calculator
          <ChevronDown size={16} style={{ transform: showCalculator ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showCalculator && (
          <div className="calculator-panel">
            <div className="calc-inputs">
              <div className="calc-input-group">
                <label>Entry Price ($)</label>
                <input type="number" value={calcEntry} onChange={e => setCalcEntry(e.target.value)} placeholder="0.00" step="0.01" />
              </div>
              <div className="calc-input-group">
                <label>Target Price ($)</label>
                <input type="number" value={calcTarget} onChange={e => setCalcTarget(e.target.value)} placeholder="0.00" step="0.01" />
              </div>
              <div className="calc-input-group">
                <label>Stop Loss ($)</label>
                <input type="number" value={calcStop} onChange={e => setCalcStop(e.target.value)} placeholder="0.00" step="0.01" />
              </div>
              <div className="calc-input-group">
                <label>Max Risk ($)</label>
                <input type="number" value={calcRisk} onChange={e => setCalcRisk(e.target.value)} placeholder="1000" />
              </div>
            </div>

            {(() => {
              const r = calcResults();
              if (!r) return <p className="calc-hint">Enter entry price and stop loss to calculate position size.</p>;
              return (
                <div className="calc-results">
                  <div className="calc-result-row">
                    <span className="calc-label">Position Size</span>
                    <span className="calc-value">{r.shares} shares</span>
                  </div>
                  <div className="calc-result-row">
                    <span className="calc-label">Total Cost</span>
                    <span className="calc-value">${r.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="calc-result-row">
                    <span className="calc-label">Risk per Share</span>
                    <span className="calc-value" style={{color:'#ff5252'}}>${r.riskPerShare.toFixed(2)}</span>
                  </div>
                  <div className="calc-result-row">
                    <span className="calc-label">Potential Loss</span>
                    <span className="calc-value" style={{color:'#ff5252'}}>-${r.potentialLoss.toLocaleString()}</span>
                  </div>
                  {r.potentialGain > 0 && (
                    <>
                      <div className="calc-result-row">
                        <span className="calc-label">Potential Gain</span>
                        <span className="calc-value" style={{color:'#00c853'}}>+${r.potentialGain.toLocaleString()}</span>
                      </div>
                      <div className="calc-result-row highlight">
                        <span className="calc-label">Risk/Reward Ratio</span>
                        <span className="calc-value" style={{color: parseFloat(r.riskReward) >= 2 ? '#00c853' : parseFloat(r.riskReward) >= 1 ? '#ffc107' : '#ff5252', fontWeight: 800, fontSize: 20}}>
                          1:{r.riskReward}
                        </span>
                      </div>
                    </>
                  )}
                  {/* Visual risk/reward bar */}
                  {r.potentialGain > 0 && r.potentialLoss > 0 && (
                    <div className="risk-reward-bar">
                      <div className="rr-loss" style={{flex: r.potentialLoss}}>
                        <span>{r.stopPercent}%</span>
                      </div>
                      <div className="rr-entry">&#9650;</div>
                      <div className="rr-gain" style={{flex: r.potentialGain}}>
                        <span>+{r.targetPercent}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
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
        {analysis && <div className="ai-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }} />}
      </div>

      {/* Peer Comparison */}
      <div className="peer-section">
        <button className="peer-load-btn" onClick={async () => {
          setPeersLoading(true);
          try {
            const res = await getStockPeers(ticker);
            setPeers(res.data);
          } catch {}
          finally { setPeersLoading(false); }
        }} disabled={peersLoading}>
          {peersLoading ? 'Loading Peers...' : 'Compare with Sector Peers'}
        </button>

        {peers && peers.peers.length > 0 && (
          <div className="peer-table-wrapper">
            <h3>Peer Comparison — {peers.sector}</h3>
            <div style={{overflowX: 'auto'}}>
              <table className="peer-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Price</th>
                    <th>Mkt Cap</th>
                    <th>P/E</th>
                    <th>Fwd P/E</th>
                    <th>P/B</th>
                    <th>Div Yield</th>
                    <th>Profit Margin</th>
                    <th>Rev Growth</th>
                    <th>ROE</th>
                    <th>Beta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="peer-current">
                    <td><strong>{peers.current.ticker}</strong></td>
                    <td>${peers.current.price?.toFixed(2)}</td>
                    <td>{peers.current.marketCap ? (peers.current.marketCap / 1e9).toFixed(1) + 'B' : '—'}</td>
                    <td>{peers.current.pe?.toFixed(1) || '—'}</td>
                    <td>{peers.current.forwardPE?.toFixed(1) || '—'}</td>
                    <td>{peers.current.pb?.toFixed(1) || '—'}</td>
                    <td>{peers.current.dividendYield ? (peers.current.dividendYield * 100).toFixed(2) + '%' : '—'}</td>
                    <td>{peers.current.profitMargin ? (peers.current.profitMargin * 100).toFixed(1) + '%' : '—'}</td>
                    <td style={{color: peers.current.revenueGrowth > 0 ? '#00c853' : '#ff5252'}}>{peers.current.revenueGrowth ? (peers.current.revenueGrowth * 100).toFixed(1) + '%' : '—'}</td>
                    <td>{peers.current.roe ? (peers.current.roe * 100).toFixed(1) + '%' : '—'}</td>
                    <td>{peers.current.beta?.toFixed(2) || '—'}</td>
                  </tr>
                  {peers.peers.map(p => (
                    <tr key={p.ticker} className="peer-row" onClick={() => window.location.href = '/stock/' + p.ticker} style={{cursor:'pointer'}}>
                      <td>{p.ticker}</td>
                      <td>${p.price?.toFixed(2)}</td>
                      <td>{p.marketCap ? (p.marketCap / 1e9).toFixed(1) + 'B' : '—'}</td>
                      <td>{p.pe?.toFixed(1) || '—'}</td>
                      <td>{p.forwardPE?.toFixed(1) || '—'}</td>
                      <td>{p.pb?.toFixed(1) || '—'}</td>
                      <td>{p.dividendYield ? (p.dividendYield * 100).toFixed(2) + '%' : '—'}</td>
                      <td>{p.profitMargin ? (p.profitMargin * 100).toFixed(1) + '%' : '—'}</td>
                      <td style={{color: p.revenueGrowth > 0 ? '#00c853' : '#ff5252'}}>{p.revenueGrowth ? (p.revenueGrowth * 100).toFixed(1) + '%' : '—'}</td>
                      <td>{p.roe ? (p.roe * 100).toFixed(1) + '%' : '—'}</td>
                      <td>{p.beta?.toFixed(2) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

      {/* News */}
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
          <p style={{ color: '#666', fontSize: 14 }}>No recent news available for {ticker}.</p>
        )}
      </div>
    </div>
  );
}
