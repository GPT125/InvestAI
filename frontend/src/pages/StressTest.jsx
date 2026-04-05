import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Play, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const StressTest = () => {
  const THEME = {
    background: '#0d0d1a',
    card: '#16162a',
    border: '#2a2a4a',
    accent: 'var(--color-primary, #7c8cf8)',
    green: '#22c55e',
    red: '#ef4444',
    text: '#e5e5e9',
    textMuted: '#a0a0ac',
  };

  const SCENARIO_PRESETS = [
    { id: 'dotcom', name: 'Dot-Com Crash (2000)', year: 2000 },
    { id: 'financial-crisis', name: '2008 Financial Crisis', year: 2008 },
    { id: 'covid', name: 'COVID-19 Crash', year: 2020 },
    { id: 'flash-crash', name: '2010 Flash Crash', year: 2010 },
    { id: 'inflation-bear', name: '2022 Inflation Bear', year: 2022 },
    { id: 'brexit', name: 'Brexit Vote', year: 2016 },
    { id: 'q4-selloff', name: '2018 Q4 Selloff', year: 2018 },
  ];

  // State management
  const [holdings, setHoldings] = useState([]);
  const [tickerInput, setTickerInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [volatilityProfile, setVolatilityProfile] = useState(null);
  const [error, setError] = useState('');

  // Add stock to holdings
  const handleAddStock = () => {
    if (!tickerInput.trim() || !weightInput.trim()) {
      setError('Please enter both ticker and weight/shares');
      return;
    }

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      setError('Weight must be a positive number');
      return;
    }

    setHoldings([
      ...holdings,
      {
        id: Date.now(),
        ticker: tickerInput.toUpperCase(),
        weight: weight,
      },
    ]);

    setTickerInput('');
    setWeightInput('');
    setError('');
  };

  // Remove stock from holdings
  const handleRemoveStock = (id) => {
    setHoldings(holdings.filter((h) => h.id !== id));
  };

  // Toggle scenario selection
  const handleToggleScenario = (scenarioId) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((s) => s !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  // Fetch volatility profile
  const fetchVolatilityProfile = async (tickers) => {
    try {
      const tickerList = tickers.join(',');
      const response = await axios.get(`/api/stresstest/volatility-profile?tickers=${tickerList}`);
      setVolatilityProfile(response.data);
    } catch (err) {
      console.error('Error fetching volatility profile:', err);
    }
  };

  // Run stress test
  const handleRunStressTest = async () => {
    if (holdings.length === 0) {
      setError('Please add at least one stock to your portfolio');
      return;
    }

    if (selectedScenarios.length === 0) {
      setError('Please select at least one scenario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        holdings: holdings.map((h) => ({
          ticker: h.ticker,
          weight: h.weight,
        })),
        scenarios: selectedScenarios,
      };

      const response = await axios.post('/api/stresstest/run', payload);
      setResults(response.data);

      // Fetch volatility profile for the selected stocks
      const tickers = holdings.map((h) => h.ticker);
      await fetchVolatilityProfile(tickers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run stress test. Please try again.');
      console.error('Stress test error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!results || !results.scenarios) return [];

    return results.scenarios.map((scenario) => ({
      name: scenario.name.split(' ')[0], // Use first word for chart space
      portfolio: scenario.portfolioReturn,
      benchmark: scenario.benchmarkReturn,
    }));
  };

  // Get color based on value
  const getColor = (value) => (value >= 0 ? THEME.green : THEME.red);

  // Format percentage
  const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;

  // Format number
  const formatNumber = (value) => {
    if (!value) return '0';
    return value.toFixed(2);
  };

  return (
    <div
      style={{
        backgroundColor: THEME.background,
        color: THEME.text,
        minHeight: '100vh',
        padding: '32px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          Portfolio Stress Test
        </h1>
        <p style={{ color: THEME.textMuted, margin: 0 }}>
          Analyze how your portfolio performs under historical crisis scenarios
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            backgroundColor: `${THEME.red}15`,
            border: `1px solid ${THEME.red}40`,
            color: THEME.red,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left Column: Input & Configuration */}
        <div>
          {/* Add Stock Card */}
          <div
            style={{
              backgroundColor: THEME.card,
              border: `1px solid ${THEME.border}`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
              Add Stocks to Portfolio
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Ticker (e.g., AAPL)"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStock()}
                style={{
                  backgroundColor: THEME.background,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.text,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="Weight/Shares"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStock()}
                style={{
                  backgroundColor: THEME.background,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.text,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleAddStock}
              style={{
                backgroundColor: THEME.accent,
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#6a7ce0')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = THEME.accent)}
            >
              <Plus size={16} />
              Add Stock
            </button>
          </div>

          {/* Holdings List */}
          <div
            style={{
              backgroundColor: THEME.card,
              border: `1px solid ${THEME.border}`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
              Portfolio ({holdings.length} stocks)
            </h2>

            {holdings.length === 0 ? (
              <p style={{ color: THEME.textMuted, margin: 0 }}>No stocks added yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {holdings.map((holding) => (
                  <div
                    key={holding.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: THEME.background,
                      padding: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${THEME.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{holding.ticker}</div>
                      <div style={{ color: THEME.textMuted, fontSize: '13px' }}>
                        {holding.weight} shares/weight
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStock(holding.id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: THEME.red,
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove stock"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scenarios Selection */}
          <div
            style={{
              backgroundColor: THEME.card,
              border: `1px solid ${THEME.border}`,
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
              Select Scenarios ({selectedScenarios.length} selected)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SCENARIO_PRESETS.map((scenario) => (
                <label
                  key={scenario.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${THEME.border}40`)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={selectedScenarios.includes(scenario.id)}
                    onChange={() => handleToggleScenario(scenario.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: THEME.accent,
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>{scenario.name}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleRunStressTest}
              disabled={loading || holdings.length === 0 || selectedScenarios.length === 0}
              style={{
                backgroundColor:
                  loading || holdings.length === 0 || selectedScenarios.length === 0
                    ? `${THEME.accent}60`
                    : THEME.accent,
                color: '#fff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading || holdings.length === 0 || selectedScenarios.length === 0 ? 'not-allowed' : 'pointer',
                marginTop: '16px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!(loading || holdings.length === 0 || selectedScenarios.length === 0)) {
                  e.target.style.backgroundColor = '#6a7ce0';
                }
              }}
              onMouseLeave={(e) => {
                if (!(loading || holdings.length === 0 || selectedScenarios.length === 0)) {
                  e.target.style.backgroundColor = THEME.accent;
                }
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: `2px solid rgba(255,255,255,0.3)`,
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Stress Test
                </>
              )}
            </button>

            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>

        {/* Right Column: Results */}
        <div>
          {!results ? (
            <div
              style={{
                backgroundColor: THEME.card,
                border: `1px solid ${THEME.border}`,
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div>
                <BarChart3 size={48} style={{ color: THEME.textMuted, margin: '0 auto 16px' }} />
                <p style={{ color: THEME.textMuted, margin: 0 }}>
                  {loading ? 'Running stress test analysis...' : 'Configure your portfolio and run the stress test to see results'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Results Chart */}
              {results.scenarios && results.scenarios.length > 0 && (
                <div
                  style={{
                    backgroundColor: THEME.card,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
                    Portfolio vs Benchmark Returns
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={THEME.border}
                      />
                      <XAxis dataKey="name" stroke={THEME.textMuted} style={{ fontSize: '12px' }} />
                      <YAxis stroke={THEME.textMuted} style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: THEME.background,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: '6px',
                          color: THEME.text,
                        }}
                        formatter={(value) => formatPercent(value)}
                      />
                      <Legend />
                      <Bar dataKey="portfolio" fill={THEME.accent} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="benchmark" fill={THEME.textMuted} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Scenario Results */}
              {results.scenarios && results.scenarios.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
                    Scenario Results
                  </h2>
                  {results.scenarios.map((scenario, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: THEME.card,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                          {scenario.name}
                        </h3>
                      </div>

                      {/* Key Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                            Portfolio Return
                          </p>
                          <p
                            style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              margin: 0,
                              color: getColor(scenario.portfolioReturn),
                            }}
                          >
                            {formatPercent(scenario.portfolioReturn)}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                            Benchmark Return
                          </p>
                          <p
                            style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              margin: 0,
                              color: getColor(scenario.benchmarkReturn),
                            }}
                          >
                            {formatPercent(scenario.benchmarkReturn)}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                            Max Drawdown
                          </p>
                          <p
                            style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              margin: 0,
                              color: getColor(-Math.abs(scenario.maxDrawdown)),
                            }}
                          >
                            {formatPercent(-Math.abs(scenario.maxDrawdown))}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                            Relative Performance
                          </p>
                          <p
                            style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              margin: 0,
                              color: getColor(scenario.portfolioReturn - scenario.benchmarkReturn),
                            }}
                          >
                            {formatPercent(scenario.portfolioReturn - scenario.benchmarkReturn)}
                          </p>
                        </div>
                      </div>

                      {/* Individual Stock Returns */}
                      {scenario.stocks && scenario.stocks.length > 0 && (
                        <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: '16px' }}>
                          <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 8px 0' }}>
                            Individual Stock Returns
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {scenario.stocks.map((stock, stockIdx) => (
                              <div
                                key={stockIdx}
                                style={{
                                  backgroundColor: THEME.background,
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: `1px solid ${THEME.border}`,
                                }}
                              >
                                <div style={{ fontSize: '12px', fontWeight: '500' }}>
                                  {stock.ticker}
                                </div>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: getColor(stock.return),
                                  }}
                                >
                                  {formatPercent(stock.return)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Volatility Profile */}
              {volatilityProfile && (
                <div
                  style={{
                    backgroundColor: THEME.card,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Activity size={18} style={{ color: THEME.accent }} />
                    <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      Volatility Profile
                    </h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                        Portfolio Volatility
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: THEME.accent }}>
                        {formatNumber(volatilityProfile.portfolioVolatility)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                        Sharpe Ratio
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: THEME.green }}>
                        {formatNumber(volatilityProfile.sharpeRatio)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                        Beta (vs S&P 500)
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: THEME.textMuted }}>
                        {formatNumber(volatilityProfile.beta)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: THEME.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                        Correlation
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: THEME.textMuted }}>
                        {formatNumber(volatilityProfile.correlation)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StressTest;
