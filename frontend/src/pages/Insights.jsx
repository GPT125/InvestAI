import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, BarChart3, Activity, Users, Target, Grid3x3, Search } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const Insights = () => {
  const [activeTab, setActiveTab] = useState('fear-greed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabConfig = [
    { id: 'fear-greed', label: 'Fear & Greed Index', icon: AlertCircle },
    { id: 'sector-heatmap', label: 'Sector Heatmap', icon: Grid3x3 },
    { id: 'stock-dna', label: 'Stock DNA', icon: Activity },
    { id: 'earnings', label: 'Earnings Tracker', icon: BarChart3 },
    { id: 'insider', label: 'Insider Activity', icon: Users },
    { id: 'price-targets', label: 'Price Targets', icon: Target },
    { id: 'compatibility', label: 'Portfolio Compatibility', icon: TrendingUp },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0d1a', color: '#e0e0e0', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#f0f0f0', marginBottom: '8px' }}>Market Insights</h1>
        <p style={{ fontSize: '14px', color: '#9999bb' }}>Deep analysis and market intelligence</p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '32px',
        borderBottom: '1px solid #2a2a4a',
        paddingBottom: '16px',
      }}>
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: isActive ? '#7c8cf8' : 'transparent',
                color: isActive ? '#0d0d1a' : '#9999bb',
                transition: 'all 0.3s ease',
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'fear-greed' && <FearGreedTab />}
      {activeTab === 'sector-heatmap' && <SectorHeatmapTab />}
      {activeTab === 'stock-dna' && <StockDNATab />}
      {activeTab === 'earnings' && <EarningsTab />}
      {activeTab === 'insider' && <InsiderTab />}
      {activeTab === 'price-targets' && <PriceTargetsTab />}
      {activeTab === 'compatibility' && <CompatibilityTab />}
    </div>
  );
};

// ====================== Fear & Greed Index Tab ======================
const FearGreedTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/insights/fear-greed`);
        setData(response.data);
        setError('');
      } catch (err) {
        setError(err.message);
        // Mock data for demo
        setData({
          composite_score: 68,
          sentiment: 'Greed',
          signals: [
            { name: 'VIX', score: 45, label: 'Fear' },
            { name: 'Market Momentum', score: 72, label: 'Greed' },
            { name: 'Breadth', score: 75, label: 'Greed' },
            { name: 'Safe Haven', score: 55, label: 'Neutral' },
            { name: 'Junk Bond', score: 68, label: 'Greed' },
          ],
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;

  const getSentimentColor = (score) => {
    if (score < 25) return '#ef4444';
    if (score < 45) return '#f97316';
    if (score < 55) return '#eab308';
    if (score < 75) return '#84cc16';
    return '#22c55e';
  };

  const getSentimentLabel = (score) => {
    if (score < 25) return 'Extreme Fear';
    if (score < 45) return 'Fear';
    if (score < 55) return 'Neutral';
    if (score < 75) return 'Greed';
    return 'Extreme Greed';
  };

  const compositeScore = data.composite_score || 50;
  const sentimentLabel = getSentimentLabel(compositeScore);
  const sentimentColor = getSentimentColor(compositeScore);

  return (
    <div>
      {/* Main Gauge */}
      <div style={{
        backgroundColor: '#16162a',
        border: '1px solid #2a2a4a',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '14px', color: '#9999bb', marginBottom: '16px' }}>Market Sentiment</div>

        {/* Semi-circular gauge */}
        <div style={{
          position: 'relative',
          width: '280px',
          height: '140px',
          marginBottom: '24px',
        }}>
          {/* Background gauge */}
          <svg width="280" height="140" style={{ position: 'absolute', top: 0, left: 0 }}>
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <path
              d="M 20 140 A 120 120 0 0 1 260 140"
              stroke="url(#gaugeGradient)"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 20 140 A 120 120 0 0 1 260 140"
              stroke="#2a2a4a"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          </svg>

          {/* Needle */}
          <svg width="280" height="140" style={{ position: 'absolute', top: 0, left: 0 }}>
            <line
              x1="140"
              y1="140"
              x2="140"
              y2="30"
              stroke={sentimentColor}
              strokeWidth="3"
              style={{
                transformOrigin: '140px 140px',
                transform: `rotate(${(compositeScore / 100) * 180}deg)`,
                transition: 'transform 0.5s ease',
              }}
            />
            <circle cx="140" cy="140" r="8" fill={sentimentColor} />
          </svg>
        </div>

        {/* Score display */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: sentimentColor, marginBottom: '8px' }}>
            {compositeScore}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: sentimentColor, marginBottom: '8px' }}>
            {sentimentLabel}
          </div>
          <div style={{ fontSize: '12px', color: '#9999bb' }}>
            Updated {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* Labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '280px',
          fontSize: '11px',
          color: '#9999bb',
          marginBottom: '16px',
        }}>
          <span>Extreme Fear</span>
          <span>Fear</span>
          <span>Neutral</span>
          <span>Greed</span>
          <span>Extreme Greed</span>
        </div>
      </div>

      {/* Individual Signals */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#f0f0f0' }}>
          Component Signals
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {data.signals?.map((signal, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#16162a',
                border: '1px solid #2a2a4a',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#e0e0e0' }}>{signal.name}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: getSentimentColor(signal.score) }}>
                  {signal.score}
                </span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#2a2a4a',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${signal.score}%`,
                  backgroundColor: getSentimentColor(signal.score),
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#9999bb', marginTop: '8px', textAlign: 'right' }}>
                {signal.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ====================== Sector Heatmap Tab ======================
const SectorHeatmapTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('1m');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/insights/sector-volatility`);
        setData(response.data);
        setError('');
      } catch (err) {
        setError(err.message);
        // Mock data for demo
        setData([
          { sector: 'Technology', etf: 'XLK', volatility: 18.5, returns: { '1d': 2.3, '1w': 5.1, '1m': 8.2, '3m': 15.4 } },
          { sector: 'Healthcare', etf: 'XLV', volatility: 12.3, returns: { '1d': -0.5, '1w': 2.1, '1m': 3.5, '3m': 7.2 } },
          { sector: 'Financials', etf: 'XLF', volatility: 15.8, returns: { '1d': 1.2, '1w': 3.5, '1m': 6.1, '3m': 10.8 } },
          { sector: 'Energy', etf: 'XLE', volatility: 22.1, returns: { '1d': -1.8, '1w': -2.3, '1m': -5.4, '3m': -8.2 } },
          { sector: 'Consumer Disc.', etf: 'XLY', volatility: 16.4, returns: { '1d': 0.8, '1w': 4.2, '1m': 7.8, '3m': 12.5 } },
          { sector: 'Consumer Staples', etf: 'XLP', volatility: 11.2, returns: { '1d': 0.2, '1w': 1.3, '1m': 2.4, '3m': 4.1 } },
          { sector: 'Industrials', etf: 'XLI', volatility: 14.7, returns: { '1d': 1.5, '1w': 4.8, '1m': 9.2, '3m': 16.3 } },
          { sector: 'Materials', etf: 'XLB', volatility: 17.2, returns: { '1d': -0.3, '1w': 3.1, '1m': 5.7, '3m': 8.9 } },
          { sector: 'Real Estate', etf: 'XLRE', volatility: 13.5, returns: { '1d': -0.8, '1w': 0.5, '1m': -1.2, '3m': 3.4 } },
          { sector: 'Utilities', etf: 'XLU', volatility: 10.3, returns: { '1d': 0.1, '1w': 0.8, '1m': 1.5, '3m': 2.1 } },
          { sector: 'Comm. Services', etf: 'XLC', volatility: 19.8, returns: { '1d': 1.9, '1w': 6.2, '1m': 11.4, '3m': 18.7 } },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingState />;
  if (error && !data.length) return <ErrorState message={error} />;

  const getReturnColor = (value) => {
    if (value > 10) return '#22c55e';
    if (value > 5) return '#84cc16';
    if (value > 0) return '#10b981';
    if (value > -5) return '#f97316';
    return '#ef4444';
  };

  const sortedData = [...data].sort((a, b) => b.returns[sortBy] - a.returns[sortBy]);

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        {['1d', '1w', '1m', '3m'].map((period) => (
          <button
            key={period}
            onClick={() => setSortBy(period)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #2a2a4a',
              borderRadius: '6px',
              backgroundColor: sortBy === period ? '#7c8cf8' : '#16162a',
              color: sortBy === period ? '#0d0d1a' : '#9999bb',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {period.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {sortedData.map((sector, idx) => {
          const returnValue = sector.returns[sortBy];
          const returnColor = getReturnColor(returnValue);

          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#16162a',
                border: `2px solid ${returnColor}`,
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#f0f0f0', marginBottom: '4px' }}>
                  {sector.sector}
                </h4>
                <p style={{ fontSize: '12px', color: '#9999bb' }}>Ticker: {sector.etf}</p>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: '#0d0d1a',
                borderRadius: '6px',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9999bb', marginBottom: '4px' }}>Volatility</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#e0e0e0' }}>
                    {sector.volatility.toFixed(1)}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#9999bb', marginBottom: '4px' }}>
                    {sortBy.toUpperCase()} Return
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: returnColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                  }}>
                    {returnValue > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {returnValue > 0 ? '+' : ''}{returnValue.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                {['1d', '1w', '1m', '3m'].map((period) => (
                  <div key={period} style={{
                    padding: '8px',
                    backgroundColor: '#0d0d1a',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ color: '#9999bb' }}>{period.toUpperCase()}</span>
                    <span style={{
                      fontWeight: '600',
                      color: getReturnColor(sector.returns[period]),
                    }}>
                      {sector.returns[period] > 0 ? '+' : ''}{sector.returns[period].toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ====================== Stock DNA Tab ======================
const StockDNATab = () => {
  const [ticker, setTicker] = useState('');
  const [secondTicker, setSecondTicker] = useState('');
  const [data, setData] = useState(null);
  const [secondData, setSecondData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDNA = async (tickerValue) => {
    if (!tickerValue.trim()) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/insights/stock-dna/${tickerValue.toUpperCase()}`);
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.message);
      // Mock data
      setData({
        ticker: tickerValue.toUpperCase(),
        dimensions: [
          { name: 'Stability', value: 72 },
          { name: 'Growth', value: 68 },
          { name: 'Value', value: 55 },
          { name: 'Momentum', value: 78 },
          { name: 'Income', value: 42 },
          { name: 'Size', value: 88 },
          { name: 'Quality', value: 81 },
          { name: 'Resilience', value: 65 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSecondDNA = async (tickerValue) => {
    if (!tickerValue.trim()) {
      setSecondData(null);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE}/insights/stock-dna/${tickerValue.toUpperCase()}`);
      setSecondData(response.data);
    } catch (err) {
      // Mock data
      setSecondData({
        ticker: tickerValue.toUpperCase(),
        dimensions: [
          { name: 'Stability', value: 65 },
          { name: 'Growth', value: 75 },
          { name: 'Value', value: 68 },
          { name: 'Momentum', value: 62 },
          { name: 'Income', value: 55 },
          { name: 'Size', value: 72 },
          { name: 'Quality', value: 74 },
          { name: 'Resilience', value: 58 },
        ],
      });
    }
  };

  const handleSearch = () => fetchDNA(ticker);
  const handleSecondSearch = () => fetchSecondDNA(secondTicker);

  const radarData = data?.dimensions?.map((dim) => ({
    ...dim,
    ...(secondData && {
      compare: secondData.dimensions?.find((d) => d.name === dim.name)?.value || 0,
    }),
  })) || [];

  return (
    <div>
      {/* Search inputs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e0e0e0' }}>
            Stock Ticker
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., AAPL"
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '14px',
                backgroundColor: '#16162a',
                border: '1px solid #2a2a4a',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '10px 16px',
                backgroundColor: '#7c8cf8',
                color: '#0d0d1a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e0e0e0' }}>
            Compare (Optional)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={secondTicker}
              onChange={(e) => setSecondTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSecondSearch()}
              placeholder="e.g., MSFT"
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '14px',
                backgroundColor: '#16162a',
                border: '1px solid #2a2a4a',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            />
            <button
              onClick={handleSecondSearch}
              style={{
                padding: '10px 16px',
                backgroundColor: '#7c8cf8',
                color: '#0d0d1a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && data === null && <ErrorState message={error} />}

      {data && (
        <div style={{
          backgroundColor: '#16162a',
          border: '1px solid #2a2a4a',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', color: '#f0f0f0' }}>
            {data.ticker} {secondData && `vs ${secondData.ticker}`} Stock DNA Profile
          </h3>

          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid stroke="#2a2a4a" />
              <PolarAngleAxis dataKey="name" stroke="#9999bb" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#2a2a4a" />
              <Radar name={data.ticker} dataKey="value" stroke="#7c8cf8" fill="#7c8cf8" fillOpacity={0.5} />
              {secondData && (
                <Radar name={secondData.ticker} dataKey="compare" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
              )}
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16162a',
                  border: '1px solid #2a2a4a',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Dimension Details */}
          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {radarData.map((dim, idx) => (
              <div key={idx} style={{
                padding: '12px',
                backgroundColor: '#0d0d1a',
                borderRadius: '8px',
                borderLeft: `3px solid #7c8cf8`,
              }}>
                <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>
                  {dim.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height: '6px',
                      backgroundColor: '#2a2a4a',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${dim.value}%`,
                        backgroundColor: '#7c8cf8',
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#7c8cf8', minWidth: '30px', textAlign: 'right' }}>
                    {dim.value}
                  </span>
                </div>
                {secondData && dim.compare !== undefined && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#22c55e' }}>
                    vs {dim.compare} ({dim.compare > dim.value ? '+' : ''}{(dim.compare - dim.value).toFixed(0)})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ====================== Earnings Tracker Tab ======================
const EarningsTab = () => {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEarnings = async (tickerValue) => {
    if (!tickerValue.trim()) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/insights/earnings-surprises/${tickerValue.toUpperCase()}`);
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.message);
      // Mock data
      setData({
        ticker: tickerValue.toUpperCase(),
        beat_rate: 75,
        current_streak: 3,
        avg_surprise: 3.2,
        quarters: [
          { quarter: 'Q4 2024', actual: 2.15, estimate: 1.98, beat: true, surprise: 8.6 },
          { quarter: 'Q3 2024', actual: 1.95, estimate: 1.87, beat: true, surprise: 4.3 },
          { quarter: 'Q2 2024', actual: 1.88, estimate: 1.92, beat: false, surprise: -2.1 },
          { quarter: 'Q1 2024', actual: 2.08, estimate: 2.01, beat: true, surprise: 3.5 },
          { quarter: 'Q4 2023', actual: 1.92, estimate: 1.86, beat: true, surprise: 3.2 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchEarnings(ticker);

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '32px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter ticker (e.g., AAPL)"
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '14px',
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '6px',
            color: '#e0e0e0',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '10px 16px',
            backgroundColor: '#7c8cf8',
            color: '#0d0d1a',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <Search size={18} />
        </button>
      </div>

      {loading && <LoadingState />}
      {error && data === null && <ErrorState message={error} />}

      {data && (
        <div>
          {/* Stats cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <div style={{
              backgroundColor: '#16162a',
              border: '1px solid #2a2a4a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Beat Rate</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>
                {data.beat_rate}%
              </div>
              <div style={{ fontSize: '12px', color: '#9999bb', marginTop: '4px' }}>
                {data.quarters.filter((q) => q.beat).length} of {data.quarters.length} beats
              </div>
            </div>

            <div style={{
              backgroundColor: '#16162a',
              border: '1px solid #2a2a4a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Current Streak</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#7c8cf8' }}>
                {data.current_streak}
              </div>
              <div style={{ fontSize: '12px', color: '#9999bb', marginTop: '4px' }}>
                consecutive beats
              </div>
            </div>

            <div style={{
              backgroundColor: '#16162a',
              border: '1px solid #2a2a4a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Avg Surprise</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>
                +{data.avg_surprise}%
              </div>
              <div style={{ fontSize: '12px', color: '#9999bb', marginTop: '4px' }}>
                average upside
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#f0f0f0' }}>
              EPS: Actual vs Estimate
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.quarters} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="quarter" stroke="#9999bb" />
                <YAxis stroke="#9999bb" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16162a',
                    border: '1px solid #2a2a4a',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                  }}
                />
                <Legend />
                <Bar dataKey="estimate" fill="#2a2a4a" name="Estimate" />
                <Bar dataKey="actual" fill="#7c8cf8" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quarters Table */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a4a', backgroundColor: '#0d0d1a' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9999bb', fontWeight: '600' }}>Quarter</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#9999bb', fontWeight: '600' }}>Estimate</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#9999bb', fontWeight: '600' }}>Actual</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#9999bb', fontWeight: '600' }}>Result</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#9999bb', fontWeight: '600' }}>Surprise</th>
                </tr>
              </thead>
              <tbody>
                {data.quarters.map((quarter, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < data.quarters.length - 1 ? '1px solid #2a2a4a' : 'none' }}>
                    <td style={{ padding: '12px 16px', color: '#e0e0e0', fontWeight: '500' }}>{quarter.quarter}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#9999bb' }}>${quarter.estimate.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#e0e0e0', fontWeight: '600' }}>${quarter.actual.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: quarter.beat ? '#22c55e' : '#ef4444',
                        fontWeight: '600',
                      }}>
                        {quarter.beat ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {quarter.beat ? 'Beat' : 'Miss'}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: quarter.beat ? '#22c55e' : '#ef4444',
                      fontWeight: '600',
                    }}>
                      {quarter.beat ? '+' : ''}{quarter.surprise.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================== Insider Activity Tab ======================
const InsiderTab = () => {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInsider = async (tickerValue) => {
    if (!tickerValue.trim()) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/insights/insider/${tickerValue.toUpperCase()}`);
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.message);
      // Mock data
      const mockTransactions = [
        { name: 'Tim Cook', title: 'CEO', date: '2024-03-15', type: 'SELL', shares: 5000, price: 182.5, value: 912500, sentiment: 'Neutral' },
        { name: 'Luca Maestri', title: 'CFO', date: '2024-03-12', type: 'BUY', shares: 10000, price: 180.2, value: 1802000, sentiment: 'Bullish' },
        { name: 'Craig Federighi', title: 'SVP', date: '2024-03-08', type: 'BUY', shares: 8000, price: 179.8, value: 1438400, sentiment: 'Bullish' },
        { name: 'Deirdre O\'Brien', title: 'SVP', date: '2024-03-01', type: 'SELL', shares: 3000, price: 178.5, value: 535500, sentiment: 'Neutral' },
        { name: 'Katherine Adams', title: 'General Counsel', date: '2024-02-28', type: 'BUY', shares: 5000, price: 177.0, value: 885000, sentiment: 'Bullish' },
      ];
      setData({
        ticker: tickerValue.toUpperCase(),
        total_buys: 3,
        total_sells: 2,
        net_sentiment: 'Bullish',
        transactions: mockTransactions,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchInsider(ticker);

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '32px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter ticker (e.g., AAPL)"
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '14px',
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '6px',
            color: '#e0e0e0',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '10px 16px',
            backgroundColor: '#7c8cf8',
            color: '#0d0d1a',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <Search size={18} />
        </button>
      </div>

      {loading && <LoadingState />}
      {error && data === null && <ErrorState message={error} />}

      {data && (
        <div>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <div style={{
              backgroundColor: '#16162a',
              border: '1px solid #2a2a4a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Insider Buys</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>
                {data.total_buys}
              </div>
              <div style={{ fontSize: '12px', color: '#9999bb', marginTop: '4px' }}>
                in last 30 days
              </div>
            </div>

            <div style={{
              backgroundColor: '#16162a',
              border: '1px solid #2a2a4a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Insider Sells</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
                {data.total_sells}
              </div>
              <div style={{ fontSize: '12px', color: '#9999bb', marginTop: '4px' }}>
                in last 30 days
              </div>
            </div>

            <div style={{
              backgroundColor: '#16162a',
              border: '1px solid #2a2a4a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Net Sentiment</div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: data.net_sentiment === 'Bullish' ? '#22c55e' : '#ef4444',
              }}>
                {data.net_sentiment}
              </div>
              <div style={{ fontSize: '12px', color: '#9999bb', marginTop: '4px' }}>
                based on recent activity
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a4a', backgroundColor: '#0d0d1a' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9999bb', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9999bb', fontWeight: '600' }}>Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9999bb', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#9999bb', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#9999bb', fontWeight: '600' }}>Shares</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#9999bb', fontWeight: '600' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < data.transactions.length - 1 ? '1px solid #2a2a4a' : 'none' }}>
                    <td style={{ padding: '12px 16px', color: '#e0e0e0', fontWeight: '500' }}>{tx.name}</td>
                    <td style={{ padding: '12px 16px', color: '#9999bb', fontSize: '13px' }}>{tx.title}</td>
                    <td style={{ padding: '12px 16px', color: '#9999bb', fontSize: '13px' }}>
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: tx.type === 'BUY' ? '#0d2a0d' : '#2a0d0d',
                        color: tx.type === 'BUY' ? '#22c55e' : '#ef4444',
                        fontWeight: '600',
                        fontSize: '12px',
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#e0e0e0', fontWeight: '500' }}>
                      {tx.shares.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#e0e0e0', fontWeight: '500' }}>
                      ${(tx.value / 1000000).toFixed(2)}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================== Price Targets Tab ======================
const PriceTargetsTab = () => {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPriceTargets = async (tickerValue) => {
    if (!tickerValue.trim()) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/insights/price-targets/${tickerValue.toUpperCase()}`);
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.message);
      // Mock data
      setData({
        ticker: tickerValue.toUpperCase(),
        current_price: 185.5,
        target_low: 160,
        target_mean: 195,
        target_high: 230,
        upside: 24.4,
        downside: -13.8,
        distribution: [
          { range: '$160-170', count: 3 },
          { range: '$170-180', count: 5 },
          { range: '$180-190', count: 12 },
          { range: '$190-200', count: 18 },
          { range: '$200-210', count: 14 },
          { range: '$210-220', count: 6 },
          { range: '$220-230', count: 4 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchPriceTargets(ticker);

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '32px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter ticker (e.g., AAPL)"
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '14px',
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '6px',
            color: '#e0e0e0',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '10px 16px',
            backgroundColor: '#7c8cf8',
            color: '#0d0d1a',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <Search size={18} />
        </button>
      </div>

      {loading && <LoadingState />}
      {error && data === null && <ErrorState message={error} />}

      {data && (
        <div>
          {/* Price Range Visualization */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', color: '#f0f0f0' }}>
              Analyst Price Targets
            </h3>

            {/* Price scale visualization */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                height: '40px',
                backgroundColor: '#0d0d1a',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '16px',
              }}>
                {/* Range bars */}
                <div style={{
                  position: 'absolute',
                  height: '100%',
                  backgroundColor: '#ef4444',
                  opacity: 0.3,
                  left: '0%',
                  width: `${((data.target_low - data.target_low) / (data.target_high - data.target_low)) * 100}%`,
                }} />

                {/* Mean bar */}
                <div style={{
                  position: 'absolute',
                  height: '100%',
                  backgroundColor: '#22c55e',
                  opacity: 0.5,
                  left: `${((data.target_mean - data.target_low) / (data.target_high - data.target_low)) * 100 - 5}%`,
                  width: '10%',
                }} />

                {/* Current price marker */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: `${((data.current_price - data.target_low) / (data.target_high - data.target_low)) * 100}%`,
                  width: '2px',
                  height: '120%',
                  backgroundColor: '#7c8cf8',
                  boxShadow: '0 0 8px rgba(124, 140, 248, 0.5)',
                }} />

                {/* Labels positioned absolutely */}
                <div style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#ef4444',
                  zIndex: 1,
                }}>
                  ${data.target_low}
                </div>

                <div style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#22c55e',
                  zIndex: 1,
                }}>
                  ${data.target_high}
                </div>
              </div>

              {/* Legend */}
              <div style={{
                display: 'flex',
                gap: '24px',
                fontSize: '12px',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
                  <span style={{ color: '#9999bb' }}>Low Target: ${data.target_low}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '2px' }} />
                  <span style={{ color: '#9999bb' }}>Mean Target: ${data.target_mean}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#7c8cf8', borderRadius: '2px' }} />
                  <span style={{ color: '#9999bb' }}>Current Price: ${data.current_price}</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#0d0d1a',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Current Price</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#7c8cf8' }}>
                  ${data.current_price.toFixed(2)}
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#0d0d1a',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Upside Potential</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                  +{data.upside.toFixed(1)}%
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#0d0d1a',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: '#9999bb', marginBottom: '8px' }}>Downside Risk</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                  {data.downside.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Chart */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#f0f0f0' }}>
              Target Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.distribution} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="range" stroke="#9999bb" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9999bb" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16162a',
                    border: '1px solid #2a2a4a',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                  }}
                />
                <Bar dataKey="count" fill="#7c8cf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================== Portfolio Compatibility Tab ======================
const CompatibilityTab = () => {
  const [ticker, setTicker] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCompatibility = async () => {
    if (!ticker.trim() || !portfolio.trim()) return;
    try {
      setLoading(true);
      const portfolioTickers = portfolio.split(',').map((t) => t.trim().toUpperCase()).join(',');
      const response = await axios.get(`${API_BASE}/insights/compatibility?ticker=${ticker.toUpperCase()}&portfolio_tickers=${portfolioTickers}`);
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.message);
      // Mock data
      setData({
        ticker: ticker.toUpperCase(),
        portfolio_tickers: portfolio.split(',').map((t) => t.trim().toUpperCase()),
        diversification_score: 78,
        recommendation: 'Strong diversification benefit with low correlation to existing holdings.',
        correlations: [
          { ticker: ticker.toUpperCase(), compare: 'AAPL', correlation: -0.15 },
          { ticker: ticker.toUpperCase(), compare: 'MSFT', correlation: 0.22 },
          { ticker: ticker.toUpperCase(), compare: 'GOOGL', correlation: 0.18 },
        ],
        sector_overlap: 'Tech (15%)',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchCompatibility();

  const getCorrelationColor = (value) => {
    if (value < -0.5) return '#22c55e'; // Strong negative
    if (value < -0.2) return '#84cc16'; // Weak negative
    if (value < 0.2) return '#eab308'; // Neutral
    if (value < 0.5) return '#f97316'; // Weak positive
    return '#ef4444'; // Strong positive
  };

  return (
    <div>
      {/* Search inputs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e0e0e0' }}>
            New Ticker to Add
          </label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., TSLA"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              backgroundColor: '#16162a',
              border: '1px solid #2a2a4a',
              borderRadius: '6px',
              color: '#e0e0e0',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e0e0e0' }}>
            Current Portfolio (comma-separated)
          </label>
          <input
            type="text"
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., AAPL,MSFT,GOOGL"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              backgroundColor: '#16162a',
              border: '1px solid #2a2a4a',
              borderRadius: '6px',
              color: '#e0e0e0',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleSearch}
        style={{
          padding: '10px 16px',
          backgroundColor: '#7c8cf8',
          color: '#0d0d1a',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '32px',
        }}
      >
        Analyze Compatibility
      </button>

      {loading && <LoadingState />}
      {error && data === null && <ErrorState message={error} />}

      {data && (
        <div>
          {/* Recommendation */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '28px' }}>💡</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f0', marginBottom: '8px' }}>
                  Recommendation
                </h3>
                <p style={{ fontSize: '14px', color: '#9999bb', lineHeight: '1.6' }}>
                  {data.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Diversification Score */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#f0f0f0' }}>
              Portfolio Diversification Score
            </h3>

            {/* Circular gauge */}
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
              <svg width="200" height="200" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="divGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="90" fill="none" stroke="#2a2a4a" strokeWidth="8" />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#divGradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(data.diversification_score / 100) * 565} 565`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '48px', fontWeight: '700', color: '#22c55e' }}>
                  {data.diversification_score}
                </div>
                <div style={{ fontSize: '12px', color: '#9999bb', marginTop: '4px' }}>
                  Excellent
                </div>
              </div>
            </div>
          </div>

          {/* Sector Overlap */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#f0f0f0' }}>
              Sector Overlap
            </h3>
            <div style={{
              padding: '16px',
              backgroundColor: '#0d0d1a',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#e0e0e0',
            }}>
              {data.sector_overlap}
            </div>
          </div>

          {/* Correlation Matrix */}
          <div style={{
            backgroundColor: '#16162a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#f0f0f0' }}>
              Correlation with Portfolio Holdings
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', minWidth: '400px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a4a', backgroundColor: '#0d0d1a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9999bb', fontWeight: '600' }}>
                      {data.ticker} vs
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#9999bb', fontWeight: '600' }}>
                      Correlation
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9999bb', fontWeight: '600' }}>
                      Relationship
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.correlations.map((corr, idx) => {
                    const color = getCorrelationColor(corr.correlation);
                    let relationship = '';
                    if (corr.correlation < -0.5) relationship = 'Strong Negative';
                    else if (corr.correlation < -0.2) relationship = 'Weak Negative';
                    else if (corr.correlation < 0.2) relationship = 'Neutral';
                    else if (corr.correlation < 0.5) relationship = 'Weak Positive';
                    else relationship = 'Strong Positive';

                    return (
                      <tr key={idx} style={{ borderBottom: idx < data.correlations.length - 1 ? '1px solid #2a2a4a' : 'none' }}>
                        <td style={{ padding: '12px 16px', color: '#e0e0e0', fontWeight: '500' }}>
                          {corr.compare}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            backgroundColor: color + '20',
                            borderRadius: '4px',
                            color: color,
                            fontWeight: '600',
                          }}>
                            {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9999bb', fontSize: '13px' }}>
                          {relationship}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#0d0d1a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#9999bb',
              lineHeight: '1.6',
            }}>
              <strong style={{ color: '#e0e0e0' }}>Correlation Guide:</strong><br />
              -1.0 to -0.5: Strong Negative (Good diversification) | -0.5 to -0.2: Weak Negative<br />
              -0.2 to 0.2: Neutral (No clear relationship) | 0.2 to 0.5: Weak Positive<br />
              0.5 to 1.0: Strong Positive (Similar movements)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================== Helper Components ======================
const LoadingState = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    color: '#9999bb',
    fontSize: '16px',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #2a2a4a',
        borderTopColor: '#7c8cf8',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px',
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      Loading data...
    </div>
  </div>
);

const ErrorState = ({ message }) => (
  <div style={{
    backgroundColor: '#16162a',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    color: '#ef4444',
  }}>
    <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '4px' }} />
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#ef4444' }}>
        Unable to Load Data
      </h3>
      <p style={{ fontSize: '13px', color: '#9999bb' }}>
        {message || 'An error occurred while fetching data. Using demo data instead.'}
      </p>
    </div>
  </div>
);

export default Insights;
