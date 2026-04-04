import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Calendar,
  DollarSign,
  Zap,
  AlertCircle,
} from 'lucide-react';

const TimeMachine = () => {
  // Form state
  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState(10000);
  const [startDate, setStartDate] = useState('');
  const [includeDividends, setIncludeDividends] = useState(false);

  // Results state
  const [results, setResults] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState([]);

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0d0d1a',
      color: '#ffffff',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    },
    wrapper: {
      maxWidth: '1400px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '40px',
      textAlign: 'center',
    },
    title: {
      fontSize: '42px',
      fontWeight: '700',
      marginBottom: '10px',
      background: 'linear-gradient(135deg, #7c8cf8 0%, #a8b5ff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    subtitle: {
      fontSize: '16px',
      color: '#b0b8d4',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    card: {
      backgroundColor: '#16162a',
      border: '1px solid #2a2a4a',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '20px',
      color: '#a8b5ff',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '8px',
      color: '#b0b8d4',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      backgroundColor: '#0d0d1a',
      border: '1px solid #2a2a4a',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '14px',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s ease',
    },
    inputFocus: {
      borderColor: '#7c8cf8',
      outline: 'none',
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer',
      accentColor: '#7c8cf8',
    },
    checkboxLabel: {
      fontSize: '14px',
      color: '#b0b8d4',
      cursor: 'pointer',
      fontWeight: '500',
    },
    button: {
      width: '100%',
      padding: '12px 24px',
      backgroundColor: '#7c8cf8',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    buttonHover: {
      backgroundColor: '#6b7de8',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(124, 140, 248, 0.3)',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    resultsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    resultCard: {
      backgroundColor: '#0d0d1a',
      border: '1px solid #2a2a4a',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center',
    },
    resultLabel: {
      fontSize: '12px',
      color: '#7c8cf8',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
      fontWeight: '600',
    },
    resultValue: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '8px',
    },
    resultSubtext: {
      fontSize: '12px',
      color: '#b0b8d4',
    },
    positive: {
      color: '#22c55e',
    },
    negative: {
      color: '#ef4444',
    },
    comparisonGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    },
    comparisonCard: {
      backgroundColor: '#16162a',
      border: '1px solid #2a2a4a',
      borderRadius: '12px',
      padding: '20px',
    },
    comparisonTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#a8b5ff',
    },
    comparisonRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
      paddingBottom: '12px',
      borderBottom: '1px solid #2a2a4a',
    },
    comparisonLabel: {
      fontSize: '13px',
      color: '#b0b8d4',
    },
    comparisonValue: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
    },
    chartContainer: {
      backgroundColor: '#16162a',
      border: '1px solid #2a2a4a',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '32px',
    },
    milestonesSection: {
      backgroundColor: '#16162a',
      border: '1px solid #2a2a4a',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '32px',
    },
    milestoneItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #2a2a4a',
    },
    milestoneDate: {
      fontSize: '13px',
      color: '#7c8cf8',
      fontWeight: '600',
    },
    milestonePrice: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#ffffff',
    },
    errorContainer: {
      backgroundColor: '#1a1a2e',
      border: '1px solid #ef4444',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      marginBottom: '24px',
    },
    errorText: {
      color: '#ef4444',
      fontSize: '14px',
      lineHeight: '1.5',
    },
    spinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '3px solid #2a2a4a',
      borderTopColor: '#7c8cf8',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#b0b8d4',
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!ticker.trim()) {
        setError('Please enter a stock ticker');
        setLoading(false);
        return;
      }
      if (amount <= 0) {
        setError('Investment amount must be greater than 0');
        setLoading(false);
        return;
      }
      if (!startDate) {
        setError('Please select a start date');
        setLoading(false);
        return;
      }

      // Call simulation API
      const simulationResponse = await axios.get(
        `/api/timemachine/simulate`,
        {
          params: {
            ticker: ticker.toUpperCase(),
            amount: amount,
            start_date: startDate,
            include_dividends: includeDividends,
          },
        }
      );

      const simulationData = simulationResponse.data;
      setResults(simulationData);

      // Prepare chart data
      if (simulationData.timeline) {
        const chartData = simulationData.timeline.map((point) => ({
          date: new Date(point.date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          stock: parseFloat(point.stock_value.toFixed(2)),
          sp500: parseFloat(point.sp500_value.toFixed(2)),
        }));
        setChartData(chartData);
      }

      // Call milestones API
      try {
        const milestonesResponse = await axios.get(
          `/api/timemachine/milestones`,
          {
            params: {
              ticker: ticker.toUpperCase(),
            },
          }
        );
        setMilestones(milestonesResponse.data.milestones || []);
      } catch (err) {
        console.warn('Could not load milestones:', err.message);
        setMilestones([]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch simulation data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          input:focus {
            ${styles.inputFocus.borderColor ? `border-color: ${styles.inputFocus.borderColor};` : ''}
            outline: none;
          }
          button:hover:not(:disabled) {
            background-color: #6b7de8;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(124, 140, 248, 0.3);
          }
          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}
      </style>

      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Investment Time Machine</h1>
          <p style={styles.subtitle}>
            Explore what could have been: visualize your investment journey
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.errorContainer}>
            <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div style={styles.errorText}>{error}</div>
          </div>
        )}

        {/* Input Form */}
        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <Zap size={20} />
              Simulation Parameters
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Stock Ticker</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g., AAPL, MSFT, TSLA"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Investment Amount (USD)</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="10000"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  min="1"
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date</label>
                <input
                  style={styles.input}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div style={styles.checkboxContainer}>
                <input
                  style={styles.checkbox}
                  type="checkbox"
                  id="dividends"
                  checked={includeDividends}
                  onChange={(e) => setIncludeDividends(e.target.checked)}
                  disabled={loading}
                />
                <label
                  htmlFor="dividends"
                  style={styles.checkboxLabel}
                >
                  Include Dividends
                </label>
              </div>

              <button
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div style={styles.spinner} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} />
                    Run Simulation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Section */}
        {results && !loading && (
          <>
            {/* Key Metrics */}
            <div style={styles.resultsGrid}>
              <div style={styles.resultCard}>
                <div style={styles.resultLabel}>Initial Investment</div>
                <div style={styles.resultValue}>
                  {formatCurrency(results.initial_investment)}
                </div>
              </div>

              <div style={styles.resultCard}>
                <div style={styles.resultLabel}>Final Value</div>
                <div
                  style={{
                    ...styles.resultValue,
                    color: results.final_value >= results.initial_investment ? '#22c55e' : '#ef4444',
                  }}
                >
                  {formatCurrency(results.final_value)}
                </div>
              </div>

              <div style={styles.resultCard}>
                <div style={styles.resultLabel}>Total Return</div>
                <div
                  style={{
                    ...styles.resultValue,
                    color: results.total_return >= 0 ? '#22c55e' : '#ef4444',
                  }}
                >
                  {formatPercent(results.total_return)}
                </div>
                <div style={styles.resultSubtext}>
                  {formatCurrency(results.final_value - results.initial_investment)}
                </div>
              </div>

              <div style={styles.resultCard}>
                <div style={styles.resultLabel}>Annualized Return</div>
                <div
                  style={{
                    ...styles.resultValue,
                    color: results.annualized_return >= 0 ? '#22c55e' : '#ef4444',
                  }}
                >
                  {formatPercent(results.annualized_return)}
                </div>
              </div>

              {includeDividends && (
                <div style={styles.resultCard}>
                  <div style={styles.resultLabel}>Dividends Earned</div>
                  <div style={{ ...styles.resultValue, color: '#22c55e' }}>
                    {formatCurrency(results.dividends_earned || 0)}
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Section */}
            <div style={styles.comparisonGrid}>
              {/* Stock Performance */}
              <div style={styles.comparisonCard}>
                <div style={styles.comparisonTitle}>
                  {ticker.toUpperCase()} Performance
                </div>
                <div style={styles.comparisonRow}>
                  <span style={styles.comparisonLabel}>Initial Value</span>
                  <span style={styles.comparisonValue}>
                    {formatCurrency(results.initial_investment)}
                  </span>
                </div>
                <div style={styles.comparisonRow}>
                  <span style={styles.comparisonLabel}>Final Value</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      color: results.final_value >= results.initial_investment ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {formatCurrency(results.final_value)}
                  </span>
                </div>
                <div style={styles.comparisonRow}>
                  <span style={styles.comparisonLabel}>Total Return</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      color: results.total_return >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {formatPercent(results.total_return)}
                  </span>
                </div>
                <div
                  style={{
                    ...styles.comparisonRow,
                    borderBottom: 'none',
                    paddingBottom: 0,
                  }}
                >
                  <span style={styles.comparisonLabel}>Ann. Return</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      color: results.annualized_return >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {formatPercent(results.annualized_return)}
                  </span>
                </div>
              </div>

              {/* S&P 500 Comparison */}
              <div style={styles.comparisonCard}>
                <div style={styles.comparisonTitle}>S&P 500 Comparison</div>
                <div style={styles.comparisonRow}>
                  <span style={styles.comparisonLabel}>Initial Value</span>
                  <span style={styles.comparisonValue}>
                    {formatCurrency(results.sp500_initial)}
                  </span>
                </div>
                <div style={styles.comparisonRow}>
                  <span style={styles.comparisonLabel}>Final Value</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      color: results.sp500_final >= results.sp500_initial ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {formatCurrency(results.sp500_final)}
                  </span>
                </div>
                <div style={styles.comparisonRow}>
                  <span style={styles.comparisonLabel}>Total Return</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      color: results.sp500_return >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {formatPercent(results.sp500_return)}
                  </span>
                </div>
                <div
                  style={{
                    ...styles.comparisonRow,
                    borderBottom: 'none',
                    paddingBottom: 0,
                  }}
                >
                  <span style={styles.comparisonLabel}>Ann. Return</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      color: results.sp500_annualized >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {formatPercent(results.sp500_annualized)}
                  </span>
                </div>
              </div>

              {/* Outperformance */}
              <div style={styles.comparisonCard}>
                <div style={styles.comparisonTitle}>Outperformance</div>
                <div style={styles.comparisonRow}>
                  <span style={styles.comparisonLabel}>Return Difference</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      color:
                        results.total_return >= results.sp500_return
                          ? '#22c55e'
                          : '#ef4444',
                    }}
                  >
                    {formatPercent(results.total_return - results.sp500_return)}
                  </span>
                </div>
                <div style={styles.comparisonRow}>
                  <span style={styles.comparisonLabel}>Dollar Difference</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      color:
                        results.final_value >= results.sp500_final
                          ? '#22c55e'
                          : '#ef4444',
                    }}
                  >
                    {formatCurrency(results.final_value - results.sp500_final)}
                  </span>
                </div>
                <div
                  style={{
                    ...styles.comparisonRow,
                    borderBottom: 'none',
                    paddingBottom: 0,
                  }}
                >
                  <span style={styles.comparisonLabel}>Performance</span>
                  <span
                    style={{
                      ...styles.comparisonValue,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color:
                        results.total_return >= results.sp500_return
                          ? '#22c55e'
                          : '#ef4444',
                    }}
                  >
                    {results.total_return >= results.sp500_return ? (
                      <>
                        <ArrowUpRight size={16} /> Outperformed
                      </>
                    ) : (
                      <>
                        <ArrowDownRight size={16} /> Underperformed
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div style={styles.chartContainer}>
                <h2 style={styles.cardTitle}>
                  <TrendingUp size={20} />
                  Growth Comparison Over Time
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                    <XAxis
                      dataKey="date"
                      stroke="#7c8cf8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#7c8cf8" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#16162a',
                        border: '1px solid #2a2a4a',
                        borderRadius: '8px',
                        color: '#ffffff',
                      }}
                      formatter={(value) => formatCurrency(value)}
                      labelStyle={{ color: '#ffffff' }}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '20px',
                        color: '#b0b8d4',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stock"
                      stroke="#7c8cf8"
                      strokeWidth={2}
                      dot={false}
                      name={`${ticker.toUpperCase()} Investment`}
                    />
                    <Line
                      type="monotone"
                      dataKey="sp500"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name="S&P 500 Investment"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Milestones Section */}
            {milestones.length > 0 && (
              <div style={styles.milestonesSection}>
                <h2 style={styles.cardTitle}>
                  <Calendar size={20} />
                  Price Milestones
                </h2>
                {milestones.map((milestone, index) => (
                  <div key={index} style={styles.milestoneItem}>
                    <span style={styles.milestoneDate}>
                      {new Date(milestone.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span style={styles.milestonePrice}>
                      {formatCurrency(milestone.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
            }}
          >
            <div
              style={{
                ...styles.spinner,
                width: '40px',
                height: '40px',
                borderWidth: '4px',
                margin: '0 auto 20px',
              }}
            />
            <p style={{ color: '#b0b8d4', fontSize: '16px' }}>
              Running your time machine simulation...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeMachine;
