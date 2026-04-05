import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  AlertCircle,
  Loader,
} from 'lucide-react';

const api = axios.create({
  baseURL: '/api',
});

const DividendCalendar = () => {
  const [stocks, setStocks] = useState([]);
  const [newTicker, setNewTicker] = useState('');
  const [newShares, setNewShares] = useState('');
  const [activeTab, setActiveTab] = useState('calendar');
  const [calendarData, setCalendarData] = useState(null);
  const [incomeProjection, setIncomeProjection] = useState(null);
  const [growthData, setGrowthData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bgStyle = { backgroundColor: '#0d0d1a', color: '#e0e0e0' };
  const cardStyle = {
    backgroundColor: '#16162a',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    padding: '16px',
  };
  const accentColor = 'var(--color-primary, #7c8cf8)';
  const successColor = '#22c55e';
  const dangerColor = '#ef4444';

  const handleAddStock = () => {
    if (newTicker.trim() && newShares.trim()) {
      const ticker = newTicker.toUpperCase();
      setStocks([...stocks, { ticker, shares: parseFloat(newShares) }]);
      setNewTicker('');
      setNewShares('');
      setError(null);
    }
  };

  const handleRemoveStock = (index) => {
    setStocks(stocks.filter((_, i) => i !== index));
  };

  const fetchAllData = useCallback(async () => {
    if (stocks.length === 0) {
      setError('Please add at least one stock');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tickers = stocks.map((s) => s.ticker).join(',');
      const sharesMap = Object.fromEntries(
        stocks.map((s) => [s.ticker, s.shares])
      );

      const [calendarRes, incomeRes] = await Promise.all([
        api.get('/dividends/calendar', { params: { tickers } }),
        api.get('/dividends/income-projection', {
          params: { tickers, shares: JSON.stringify(sharesMap) },
        }),
      ]);

      setCalendarData(calendarRes.data);
      setIncomeProjection(incomeRes.data);

      // Fetch growth data for each stock
      const growthResults = {};
      for (const stock of stocks) {
        try {
          const growthRes = await api.get('/dividends/growth', {
            params: { ticker: stock.ticker },
          });
          growthResults[stock.ticker] = growthRes.data;
        } catch (err) {
          console.error(`Failed to fetch growth data for ${stock.ticker}`);
        }
      }
      setGrowthData(growthResults);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to fetch dividend data. Please check the API connection.'
      );
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  const summaryStats = useMemo(() => {
    if (!incomeProjection) return null;

    const totalAnnual = incomeProjection.projections?.reduce(
      (sum, proj) => sum + (proj.annualIncome || 0),
      0
    ) || 0;
    const totalMonthly = totalAnnual / 12;
    const avgYield =
      incomeProjection.portfolioStats?.averageYield || 0;

    return {
      totalAnnual,
      totalMonthly,
      avgYield,
      yieldOnCost: incomeProjection.portfolioStats?.yieldOnCost || 0,
    };
  }, [incomeProjection]);

  return (
    <div style={bgStyle} className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#e0e0e0',
            }}
          >
            Dividend Calendar & Income Projector
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
            Track dividends and project your portfolio income
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            style={{
              ...cardStyle,
              backgroundColor: '#2a1a1a',
              borderColor: dangerColor,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle color={dangerColor} size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Section */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Add Stocks
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Ticker (e.g., AAPL)"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddStock()}
              style={{
                backgroundColor: '#0d0d1a',
                border: `1px solid #2a2a4a`,
                color: '#e0e0e0',
                padding: '8px 12px',
                borderRadius: '6px',
                flex: '1',
                minWidth: '120px',
              }}
            />
            <input
              type="number"
              placeholder="Number of shares"
              value={newShares}
              onChange={(e) => setNewShares(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddStock()}
              style={{
                backgroundColor: '#0d0d1a',
                border: `1px solid #2a2a4a`,
                color: '#e0e0e0',
                padding: '8px 12px',
                borderRadius: '6px',
                flex: '1',
                minWidth: '120px',
              }}
            />
            <button
              onClick={handleAddStock}
              style={{
                backgroundColor: accentColor,
                color: '#0d0d1a',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              <Plus size={18} />
              Add Stock
            </button>
          </div>

          {/* Stock List */}
          {stocks.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {stocks.map((stock, idx) => (
                <div
                  key={idx}
                  style={{
                    ...cardStyle,
                    backgroundColor: '#1a1a2e',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{stock.ticker}</div>
                    <div style={{ color: '#a0a0b0', fontSize: '12px' }}>
                      {stock.shares} shares
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStock(idx)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: dangerColor,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Fetch Button */}
          {stocks.length > 0 && (
            <button
              onClick={fetchAllData}
              disabled={loading}
              style={{
                backgroundColor: successColor,
                color: '#0d0d1a',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? <Loader size={18} /> : <TrendingUp size={18} />}
              {loading ? 'Loading...' : 'Fetch Dividend Data'}
            </button>
          )}
        </div>

        {/* Summary Stats */}
        {summaryStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={18} color={successColor} />
                <span style={{ color: '#a0a0b0', fontSize: '12px' }}>Annual Income</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                ${summaryStats.totalAnnual.toFixed(2)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={18} color={accentColor} />
                <span style={{ color: '#a0a0b0', fontSize: '12px' }}>Monthly Income</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                ${summaryStats.totalMonthly.toFixed(2)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Percent size={18} color={accentColor} />
                <span style={{ color: '#a0a0b0', fontSize: '12px' }}>Average Yield</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {(summaryStats.avgYield * 100).toFixed(2)}%
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={18} color={successColor} />
                <span style={{ color: '#a0a0b0', fontSize: '12px' }}>Yield on Cost</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {(summaryStats.yieldOnCost * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: `2px solid #2a2a4a` }}>
            {['calendar', 'projector', 'growth'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: activeTab === tab ? accentColor : '#a0a0b0',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? `2px solid ${accentColor}` : 'none',
                  marginBottom: '-2px',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div>
            {calendarData ? (
              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Timeline */}
                <div style={cardStyle}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                    Dividend Payment Timeline
                  </h3>
                  {calendarData.events && calendarData.events.length > 0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gap: '12px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                      }}
                    >
                      {calendarData.events
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((event, idx) => (
                          <div
                            key={idx}
                            style={{
                              ...cardStyle,
                              backgroundColor: '#1a1a2e',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Calendar color={accentColor} size={18} />
                              <div>
                                <div style={{ fontWeight: '600' }}>{event.ticker}</div>
                                <div style={{ color: '#a0a0b0', fontSize: '12px' }}>
                                  {new Date(event.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  fontWeight: '600',
                                  color: successColor,
                                  fontSize: '16px',
                                }}
                              >
                                ${event.amount.toFixed(2)}
                              </div>
                              <div style={{ color: '#a0a0b0', fontSize: '12px' }}>
                                ${event.perShare.toFixed(3)}/share
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p style={{ color: '#a0a0b0' }}>No dividend events found</p>
                  )}
                </div>

                {/* Dividend Growth Chart */}
                {calendarData.dividendHistory && calendarData.dividendHistory.length > 0 && (
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                      Historical Dividend Growth
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={calendarData.dividendHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                        <XAxis dataKey="year" stroke="#a0a0b0" />
                        <YAxis stroke="#a0a0b0" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#16162a',
                            border: `1px solid #2a2a4a`,
                            borderRadius: '6px',
                          }}
                          labelStyle={{ color: '#e0e0e0' }}
                        />
                        <Legend />
                        {stocks.map((stock, idx) => (
                          <Bar
                            key={idx}
                            dataKey={stock.ticker}
                            fill={idx % 2 === 0 ? accentColor : successColor}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Earnings Surprise History */}
                {calendarData.earningSurprises && calendarData.earningSurprises.length > 0 && (
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                      Earnings Surprise History
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '14px',
                        }}
                      >
                        <thead>
                          <tr style={{ borderBottom: `1px solid #2a2a4a` }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                              Date
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                              Ticker
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                              Surprise %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {calendarData.earningSurprises.map((surprise, idx) => (
                            <tr key={idx} style={{ borderBottom: `1px solid #2a2a4a` }}>
                              <td style={{ padding: '12px' }}>
                                {new Date(surprise.date).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '12px' }}>{surprise.ticker}</td>
                              <td
                                style={{
                                  padding: '12px',
                                  textAlign: 'right',
                                  color:
                                    surprise.surprisePercent >= 0 ? successColor : dangerColor,
                                  fontWeight: '600',
                                }}
                              >
                                {surprise.surprisePercent >= 0 ? '+' : ''}
                                {surprise.surprisePercent.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...cardStyle, textAlign: 'center', color: '#a0a0b0' }}>
                Add stocks and click "Fetch Dividend Data" to see the calendar
              </div>
            )}
          </div>
        )}

        {/* Income Projector Tab */}
        {activeTab === 'projector' && (
          <div>
            {incomeProjection ? (
              <div style={cardStyle}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  Annual & Monthly Income Projection
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px',
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: `2px solid #2a2a4a` }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                          Ticker
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          Shares
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          Annual Dividend
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          Monthly Income
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          Yield
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          Annual Income
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeProjection.projections &&
                        incomeProjection.projections.map((proj, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid #2a2a4a` }}>
                            <td
                              style={{
                                padding: '12px',
                                fontWeight: '600',
                                color: accentColor,
                              }}
                            >
                              {proj.ticker}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {proj.shares}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              ${proj.annualDividend.toFixed(3)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              ${(proj.monthlyIncome || proj.annualIncome / 12).toFixed(2)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: successColor }}>
                              {(proj.yield * 100).toFixed(2)}%
                            </td>
                            <td
                              style={{
                                padding: '12px',
                                textAlign: 'right',
                                fontWeight: '600',
                                color: successColor,
                              }}
                            >
                              ${proj.annualIncome.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Portfolio Totals */}
                {incomeProjection.portfolioStats && (
                  <div
                    style={{
                      marginTop: '24px',
                      paddingTop: '16px',
                      borderTop: `1px solid #2a2a4a`,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ color: '#a0a0b0', fontSize: '12px', marginBottom: '4px' }}>
                        Total Annual Income
                      </div>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: successColor,
                        }}
                      >
                        ${incomeProjection.portfolioStats.totalAnnualIncome?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#a0a0b0', fontSize: '12px', marginBottom: '4px' }}>
                        Total Monthly Income
                      </div>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: accentColor,
                        }}
                      >
                        ${(incomeProjection.portfolioStats.totalAnnualIncome / 12)?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...cardStyle, textAlign: 'center', color: '#a0a0b0' }}>
                Add stocks and click "Fetch Dividend Data" to see income projections
              </div>
            )}
          </div>
        )}

        {/* Growth Tab */}
        {activeTab === 'growth' && (
          <div>
            {Object.keys(growthData).length > 0 ? (
              <div style={{ display: 'grid', gap: '24px' }}>
                {stocks.map((stock) => {
                  const growth = growthData[stock.ticker];
                  if (!growth) return null;

                  return (
                    <div key={stock.ticker} style={cardStyle}>
                      <h3
                        style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          marginBottom: '16px',
                          color: accentColor,
                        }}
                      >
                        {stock.ticker} - Dividend Growth Analysis
                      </h3>

                      {/* Growth Stats */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '16px',
                          marginBottom: '24px',
                        }}
                      >
                        <div
                          style={{
                            ...cardStyle,
                            backgroundColor: '#1a1a2e',
                          }}
                        >
                          <div style={{ color: '#a0a0b0', fontSize: '12px', marginBottom: '4px' }}>
                            CAGR
                          </div>
                          <div
                            style={{
                              fontSize: '20px',
                              fontWeight: 'bold',
                              color: successColor,
                            }}
                          >
                            {growth.cagr ? `${growth.cagr.toFixed(2)}%` : 'N/A'}
                          </div>
                        </div>
                        <div
                          style={{
                            ...cardStyle,
                            backgroundColor: '#1a1a2e',
                          }}
                        >
                          <div style={{ color: '#a0a0b0', fontSize: '12px', marginBottom: '4px' }}>
                            Consecutive Growth Years
                          </div>
                          <div
                            style={{
                              fontSize: '20px',
                              fontWeight: 'bold',
                              color: accentColor,
                            }}
                          >
                            {growth.consecutiveGrowthYears || 0}
                          </div>
                        </div>
                        <div
                          style={{
                            ...cardStyle,
                            backgroundColor: '#1a1a2e',
                          }}
                        >
                          <div style={{ color: '#a0a0b0', fontSize: '12px', marginBottom: '4px' }}>
                            Dividend Rate
                          </div>
                          <div
                            style={{
                              fontSize: '20px',
                              fontWeight: 'bold',
                              color: successColor,
                            }}
                          >
                            ${growth.currentDividend?.toFixed(3) || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Annual Dividend History Chart */}
                      {growth.annualHistory && growth.annualHistory.length > 0 && (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={growth.annualHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                            <XAxis dataKey="year" stroke="#a0a0b0" />
                            <YAxis stroke="#a0a0b0" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#16162a',
                                border: `1px solid #2a2a4a`,
                                borderRadius: '6px',
                              }}
                              labelStyle={{ color: '#e0e0e0' }}
                            />
                            <Bar
                              dataKey="dividend"
                              fill={accentColor}
                              name="Annual Dividend"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ ...cardStyle, textAlign: 'center', color: '#a0a0b0' }}>
                Add stocks and click "Fetch Dividend Data" to see growth analysis
              </div>
            )}
          </div>
        )}

        {/* Stock Info Cards */}
        {calendarData && stocks.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Stock Information
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px',
              }}
            >
              {calendarData.stockInfo &&
                calendarData.stockInfo.map((info, idx) => (
                  <div key={idx} style={cardStyle}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '12px',
                        color: accentColor,
                      }}
                    >
                      {info.ticker}
                    </div>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#a0a0b0' }}>Dividend Rate:</span>
                        <span style={{ color: successColor, fontWeight: '600' }}>
                          ${info.dividendRate?.toFixed(3) || 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#a0a0b0' }}>Yield:</span>
                        <span style={{ color: successColor, fontWeight: '600' }}>
                          {info.yield ? `${(info.yield * 100).toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#a0a0b0' }}>Frequency:</span>
                        <span style={{ fontWeight: '600' }}>
                          {info.frequency || 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#a0a0b0' }}>Payout Ratio:</span>
                        <span
                          style={{
                            color:
                              info.payoutRatio && info.payoutRatio < 0.6
                                ? successColor
                                : info.payoutRatio && info.payoutRatio > 0.8
                                  ? dangerColor
                                  : accentColor,
                            fontWeight: '600',
                          }}
                        >
                          {info.payoutRatio
                            ? `${(info.payoutRatio * 100).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DividendCalendar;
