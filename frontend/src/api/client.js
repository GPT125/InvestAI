import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

// Market
export const getMarketOverview = () => api.get('/market/overview');
export const getSectors = () => api.get('/market/sectors');
export const getMarketSummary = () => api.get('/market/summary');
export const getMarketSummarySettings = () => api.get('/market/summary/settings');
export const updateMarketSummarySettings = (settings) => api.post('/market/summary/settings', settings);

// Stocks
export const searchStocks = (q) => api.get(`/stocks/search?q=${q}`);
export const getStock = (ticker) => api.get(`/stocks/${ticker}`);
export const getStockHistory = (ticker, period = '1y') => api.get(`/stocks/${ticker}/history?period=${period}`);
export const getExtendedHours = (ticker) => api.get(`/stocks/${ticker}/extended`);
export const getExtendedHoursHistory = (ticker) => api.get(`/stocks/${ticker}/extended-history`);
export const getETFHoldings = (ticker) => api.get(`/stocks/${ticker}/holdings`);
export const getStockEarnings = (ticker) => api.get(`/stocks/${ticker}/earnings`);
export const getFinancialStats = (ticker) => api.get(`/stocks/${ticker}/financial-stats`);
export const getAnalystData = (ticker) => api.get(`/stocks/${ticker}/analyst`);
export const getPerformanceComparison = (ticker) => api.get(`/stocks/${ticker}/performance`);

// Financials (FMP multi-source)
export const getIncomeStatement = (ticker, period = 'quarter') => api.get(`/financials/${ticker}/income-statement?period=${period}`);
export const getBalanceSheet = (ticker, period = 'quarter') => api.get(`/financials/${ticker}/balance-sheet?period=${period}`);
export const getCashFlow = (ticker, period = 'quarter') => api.get(`/financials/${ticker}/cash-flow?period=${period}`);
export const getEarnings = (ticker) => api.get(`/financials/${ticker}/earnings`);
export const getKeyMetrics = (ticker) => api.get(`/financials/${ticker}/key-metrics`);
export const getRatios = (ticker) => api.get(`/financials/${ticker}/ratios`);
export const getTechnicalIndicator = (ticker, indicator = 'SMA', timePeriod = 50) => api.get(`/financials/${ticker}/technical/${indicator}?time_period=${timePeriod}`);
export const getSentiment = (ticker) => api.get(`/financials/${ticker}/sentiment`);
export const getPeers = (ticker) => api.get(`/financials/${ticker}/peers`);
export const getComprehensiveData = (ticker) => api.get(`/financials/${ticker}/comprehensive`);
export const getMacroData = () => api.get('/financials/macro/dashboard');

// Compare
export const compareStocks = (tickers) => api.get(`/compare/?tickers=${tickers}`);
export const compareHistory = (tickers, period = '1y') => api.get(`/compare/history?tickers=${tickers}&period=${period}`);
export const compareAIAnalysis = (tickers) => api.get(`/compare/ai-analysis?tickers=${tickers}`);

// Scoring & Screener
export const getStockScore = (ticker) => api.get(`/scoring/${ticker}`);
export const getTopStocks = (limit = 20, sector = '') => api.get(`/scoring/top/ranked?limit=${limit}${sector ? `&sector=${sector}` : ''}`);
export const filterStocks = (filters) => api.post('/screener/filter', filters);

// News
export const getStockNews = (ticker) => api.get(`/news/stock/${ticker}`);
export const getMarketNews = () => api.get('/news/market');

// AI
export const analyzeStock = (ticker) => api.post('/ai/analyze', { ticker });
export const chatWithAI = (message, history) => api.post('/ai/chat', { message, history });

// Portfolio
export const getPortfolio = () => api.get('/portfolio');
export const addHolding = (ticker, shares, avg_cost) => api.post('/portfolio/holdings', { ticker, shares, avg_cost });
export const updateHolding = (ticker, shares, avg_cost) => api.put(`/portfolio/holdings/${ticker}`, { shares, avg_cost });
export const removeHolding = (ticker) => api.delete(`/portfolio/holdings/${ticker}`);
export const importHoldings = (holdings) => api.post('/portfolio/import', { holdings });
export const getPortfolioAnalysis = () => api.get('/portfolio/analysis');

export default api;
