import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { getIncomeStatement, getBalanceSheet, getCashFlow, getEarnings, getStock } from '../api/client';
import { formatCurrency, formatLargeNumber } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DollarSign, ArrowLeft, TrendingUp } from 'lucide-react';

const TABS = ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Earnings'];

export default function Financials() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Income Statement');
  const [period, setPeriod] = useState('quarter');
  const [incomeData, setIncomeData] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stockRes] = await Promise.all([
          getStock(ticker).catch(() => ({ data: null })),
        ]);
        setStock(stockRes.data);

        // Load active tab data
        await loadTabData(activeTab);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticker]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, period]);

  const loadTabData = async (tab) => {
    try {
      switch (tab) {
        case 'Income Statement':
          if (!incomeData || incomeData._period !== period) {
            const res = await getIncomeStatement(ticker, period);
            setIncomeData({ data: Array.isArray(res.data) ? res.data : [], _period: period });
          }
          break;
        case 'Balance Sheet':
          if (!balanceData || balanceData._period !== period) {
            const res = await getBalanceSheet(ticker, period);
            setBalanceData({ data: Array.isArray(res.data) ? res.data : [], _period: period });
          }
          break;
        case 'Cash Flow':
          if (!cashFlowData || cashFlowData._period !== period) {
            const res = await getCashFlow(ticker, period);
            setCashFlowData({ data: Array.isArray(res.data) ? res.data : [], _period: period });
          }
          break;
        case 'Earnings':
          if (!earningsData) {
            const res = await getEarnings(ticker);
            setEarningsData(res.data);
          }
          break;
      }
    } catch {
      // Data unavailable
    }
  };

  const fmtVal = (v) => {
    if (v == null) return '\u2014';
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toLocaleString();
  };

  const fmtPct = (v) => {
    if (v == null) return '\u2014';
    return `${(v * 100).toFixed(2)}%`;
  };

  const renderIncomeStatement = () => {
    const data = incomeData?.data;
    if (!data || data.length === 0) return <p style={{ color: '#666' }}>No income statement data available.</p>;

    // Reverse so most recent is on the right
    const rows = data.slice(0, 8).reverse();

    // Chart data
    const chartData = rows.map(r => ({
      period: r.date?.slice(0, 7) || r.calendarYear || '',
      revenue: r.revenue,
      netIncome: r.netIncome,
    }));

    const fields = [
      ['Revenue', 'revenue'], ['Cost of Goods Sold', 'costOfRevenue'], ['Gross Profit', 'grossProfit'],
      ['R&D Expenses', 'researchAndDevelopmentExpenses'], ['SG&A Expenses', 'sellingGeneralAndAdministrativeExpenses'],
      ['Operating Expenses', 'operatingExpenses'], ['Operating Income', 'operatingIncome'],
      ['Interest Expense', 'interestExpense'], ['Income Before Tax', 'incomeBeforeTax'],
      ['Income Tax Expense', 'incomeTaxExpense'], ['Net Income', 'netIncome'],
      ['EPS', 'eps'], ['EPS Diluted', 'epsdiluted'],
      ['Net Profit Margin', 'netIncomeRatio'], ['EBITDA', 'ebitda'],
    ];

    return (
      <>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="period" tick={{ fill: '#888', fontSize: 11 }} />
            <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={fmtVal} />
            <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }} formatter={(v) => fmtVal(v)} />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#7c8cf8" />
            <Bar dataKey="netIncome" name="Net Income" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
        <div className="results-table-wrapper" style={{ marginTop: 16 }}>
          <table className="results-table financial-table">
            <thead>
              <tr>
                <th>All values in USD</th>
                {rows.map((r) => (
                  <th key={r.date}>{r.date?.slice(0, 7) || ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map(([label, key]) => (
                <tr key={key}>
                  <td style={{ color: '#888' }}>{label}</td>
                  {rows.map((r) => (
                    <td key={r.date + key}>
                      {key === 'netIncomeRatio' ? fmtPct(r[key]) : fmtVal(r[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderBalanceSheet = () => {
    const data = balanceData?.data;
    if (!data || data.length === 0) return <p style={{ color: '#666' }}>No balance sheet data available.</p>;

    const rows = data.slice(0, 8).reverse();
    const fields = [
      ['Cash & Equivalents', 'cashAndCashEquivalents'], ['Short-Term Investments', 'shortTermInvestments'],
      ['Accounts Receivable', 'netReceivables'], ['Inventory', 'inventory'],
      ['Total Current Assets', 'totalCurrentAssets'], ['Total Assets', 'totalAssets'],
      ['Accounts Payable', 'accountPayables'], ['Short-Term Debt', 'shortTermDebt'],
      ['Total Current Liabilities', 'totalCurrentLiabilities'], ['Long-Term Debt', 'longTermDebt'],
      ['Total Liabilities', 'totalLiabilities'], ['Total Equity', 'totalStockholdersEquity'],
      ['Total Debt', 'totalDebt'], ['Net Debt', 'netDebt'],
    ];

    return (
      <div className="results-table-wrapper">
        <table className="results-table financial-table">
          <thead>
            <tr>
              <th>All values in USD</th>
              {rows.map((r) => (
                <th key={r.date}>{r.date?.slice(0, 7) || ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map(([label, key]) => (
              <tr key={key}>
                <td style={{ color: '#888' }}>{label}</td>
                {rows.map((r) => (
                  <td key={r.date + key}>{fmtVal(r[key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCashFlow = () => {
    const data = cashFlowData?.data;
    if (!data || data.length === 0) return <p style={{ color: '#666' }}>No cash flow data available.</p>;

    const rows = data.slice(0, 8).reverse();
    const fields = [
      ['Net Income', 'netIncome'], ['Depreciation & Amortization', 'depreciationAndAmortization'],
      ['Stock-Based Compensation', 'stockBasedCompensation'],
      ['Operating Cash Flow', 'operatingCashFlow'],
      ['Capital Expenditure', 'capitalExpenditure'],
      ['Free Cash Flow', 'freeCashFlow'],
      ['Acquisitions', 'acquisitionsNet'],
      ['Investing Cash Flow', 'netCashUsedForInvestingActivites'],
      ['Debt Repayment', 'debtRepayment'], ['Share Repurchases', 'commonStockRepurchased'],
      ['Dividends Paid', 'dividendsPaid'],
      ['Financing Cash Flow', 'netCashUsedProvidedByFinancingActivities'],
    ];

    const chartData = rows.map(r => ({
      period: r.date?.slice(0, 7) || '',
      operating: r.operatingCashFlow,
      investing: r.netCashUsedForInvestingActivites,
      financing: r.netCashUsedProvidedByFinancingActivities,
    }));

    return (
      <>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="period" tick={{ fill: '#888', fontSize: 11 }} />
            <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={fmtVal} />
            <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }} formatter={(v) => fmtVal(v)} />
            <Legend />
            <Bar dataKey="operating" name="Operating" fill="#22c55e" />
            <Bar dataKey="investing" name="Investing" fill="#ef4444" />
            <Bar dataKey="financing" name="Financing" fill="#7c8cf8" />
          </BarChart>
        </ResponsiveContainer>
        <div className="results-table-wrapper" style={{ marginTop: 16 }}>
          <table className="results-table financial-table">
            <thead>
              <tr>
                <th>All values in USD</th>
                {rows.map((r) => (
                  <th key={r.date}>{r.date?.slice(0, 7) || ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map(([label, key]) => (
                <tr key={key}>
                  <td style={{ color: '#888' }}>{label}</td>
                  {rows.map((r) => (
                    <td key={r.date + key}>{fmtVal(r[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderEarnings = () => {
    let data = earningsData;
    if (!data) return <p style={{ color: '#666' }}>No earnings data available.</p>;

    // Handle both FMP and yfinance formats
    let earningsRows = [];
    if (data.source === 'fmp' && Array.isArray(data.data)) {
      earningsRows = data.data.slice(0, 12).reverse().map(e => ({
        date: e.date || '',
        epsActual: e.eps,
        epsEstimate: e.epsEstimated,
        revenue: e.revenue,
        revenueEstimate: e.revenueEstimated,
      }));
    } else if (data.data?.eps_history) {
      earningsRows = data.data.eps_history.reverse().map(e => ({
        date: e.date || e.quarter || '',
        epsActual: e.epsActual,
        epsEstimate: e.epsEstimate,
        surprise: e.surprise,
      }));
    }

    if (earningsRows.length === 0) return <p style={{ color: '#666' }}>No earnings data available.</p>;

    const chartData = earningsRows.map(e => ({
      period: e.date?.slice(0, 7) || '',
      actual: e.epsActual,
      estimate: e.epsEstimate,
    }));

    return (
      <>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="period" tick={{ fill: '#888', fontSize: 11 }} />
            <YAxis tick={{ fill: '#888', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="actual" name="EPS Actual" fill="#22c55e" />
            <Bar dataKey="estimate" name="EPS Estimate" fill="#7c8cf8" />
          </BarChart>
        </ResponsiveContainer>
        <div className="results-table-wrapper" style={{ marginTop: 16 }}>
          <table className="results-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>EPS Actual</th>
                <th>EPS Estimate</th>
                {earningsRows[0]?.revenue != null && <th>Revenue</th>}
                {earningsRows[0]?.revenueEstimate != null && <th>Rev. Estimate</th>}
              </tr>
            </thead>
            <tbody>
              {earningsRows.map((e, i) => {
                const beat = e.epsActual != null && e.epsEstimate != null && e.epsActual > e.epsEstimate;
                return (
                  <tr key={i}>
                    <td style={{ color: '#888' }}>{e.date}</td>
                    <td style={{ color: beat ? '#22c55e' : e.epsActual < e.epsEstimate ? '#ef4444' : '#ccc', fontWeight: 600 }}>
                      {e.epsActual != null ? `$${e.epsActual.toFixed(2)}` : '\u2014'}
                    </td>
                    <td>{e.epsEstimate != null ? `$${e.epsEstimate.toFixed(2)}` : '\u2014'}</td>
                    {e.revenue != null && <td>{fmtVal(e.revenue)}</td>}
                    {e.revenueEstimate != null && <td>{fmtVal(e.revenueEstimate)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  if (loading) return <LoadingSpinner message={`Loading financials for ${ticker}...`} />;

  return (
    <div className="financials-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(`/stock/${ticker}`)} className="period-btn" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <h1 style={{ margin: 0 }}>
          <DollarSign size={24} /> {ticker} {stock ? `\u2014 ${stock.name}` : ''} Financials
        </h1>
      </div>

      {/* Tabs */}
      <div className="financials-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`financials-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Period Toggle (not for earnings) */}
      {activeTab !== 'Earnings' && (
        <div className="period-buttons" style={{ marginBottom: 16 }}>
          <button className={`period-btn ${period === 'quarter' ? 'active' : ''}`} onClick={() => setPeriod('quarter')}>
            Quarterly
          </button>
          <button className={`period-btn ${period === 'annual' ? 'active' : ''}`} onClick={() => setPeriod('annual')}>
            Annual
          </button>
        </div>
      )}

      {/* Content */}
      <div className="financials-content">
        {activeTab === 'Income Statement' && renderIncomeStatement()}
        {activeTab === 'Balance Sheet' && renderBalanceSheet()}
        {activeTab === 'Cash Flow' && renderCashFlow()}
        {activeTab === 'Earnings' && renderEarnings()}
      </div>
    </div>
  );
}
