import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

// --- Auto-retry on Render cold starts (502/503/504 or network error) ---
// Render's free tier spins down after inactivity; the first request after a
// cold start typically returns 502 for a few seconds while the server boots.
// We silently retry up to 5 times with a short backoff so the user never sees it.
const RETRY_STATUSES = new Set([502, 503, 504]);
const MAX_RETRIES = 5;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config.__noRetry) return Promise.reject(error);

    const status = error.response?.status;
    const isNetwork = !error.response; // ECONNRESET / timeout / CORS
    const shouldRetry = isNetwork || RETRY_STATUSES.has(status);

    if (!shouldRetry) return Promise.reject(error);

    config.__retryCount = (config.__retryCount || 0) + 1;
    if (config.__retryCount > MAX_RETRIES) return Promise.reject(error);

    // Backoff: 1.5s, 3s, 4.5s, 6s, 7.5s — covers ~22s total for cold start
    const delay = 1500 * config.__retryCount;
    await new Promise((r) => setTimeout(r, delay));
    return api(config);
  }
);

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
export const getTechnicals = (ticker) => api.get(`/stocks/${ticker}/technicals`);
export const getStockPeers = (ticker) => api.get(`/stocks/${ticker}/peers`);

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
export const getCorrelation = (tickers, period) => api.post('/compare/correlation', { tickers, period });

// Scoring
export const getStockScore = (ticker) => api.get(`/scoring/${ticker}`);
export const getTopStocks = (limit = 20, sector = '') => api.get(`/scoring/top/ranked?limit=${limit}${sector ? `&sector=${sector}` : ''}`);

// News
export const getStockNews = (ticker) => api.get(`/news/stock/${ticker}`);
export const getMarketNews = () => api.get('/news/market');

// AI
export const analyzeStock = (ticker) => api.post('/ai/analyze', { ticker });
export const chatWithAI = (message, history) => api.post('/ai/chat', { message, history });

// Chat History
export const getConversations = () => api.get('/ai/conversations');
export const createConversation = (title) => api.post('/ai/conversations', { title });
export const getConversationMessages = (convoId) => api.get(`/ai/conversations/${convoId}`);
export const renameConversation = (convoId, title) => api.put(`/ai/conversations/${convoId}`, { title });
export const deleteConversation = (convoId) => api.delete(`/ai/conversations/${convoId}`);
export const chatInConversation = (convoId, message, history) => api.post(`/ai/conversations/${convoId}/chat`, { message, history });

// Portfolio
export const getPortfolio = () => api.get('/portfolio');
export const addHolding = (ticker, shares, avg_cost) => api.post('/portfolio/holdings', { ticker, shares, avg_cost });
export const updateHolding = (ticker, shares, avg_cost) => api.put(`/portfolio/holdings/${ticker}`, { shares, avg_cost });
export const removeHolding = (ticker) => api.delete(`/portfolio/holdings/${ticker}`);
export const importHoldings = (holdings) => api.post('/portfolio/import', { holdings });
export const getPortfolioAnalysis = () => api.get('/portfolio/analysis');

// Watchlist
export const getWatchlist = () => api.get('/watchlist/');
export const addToWatchlist = (ticker, alertType, alertValue, notes) => api.post('/watchlist/', { ticker, alertType, alertValue, notes });
export const removeFromWatchlist = (ticker) => api.delete(`/watchlist/${ticker}`);

// Momentum
export const getMomentumRadar = (limit = 30) => api.get(`/momentum/radar?limit=${limit}`);
export const getUnusualVolume = (limit = 20) => api.get(`/momentum/unusual-volume?limit=${limit}`);
export const getBreakouts = (limit = 15) => api.get(`/momentum/breakouts?limit=${limit}`);

// Sector Rotation
export const getSectorRotation = (period = '6mo') => api.get(`/rotation/flow?period=${period}`);
export const getRelativeRotation = () => api.get('/rotation/rrg');

// Battle Arena
export const stockBattle = (a, b) => api.get(`/battle/fight?ticker_a=${a}&ticker_b=${b}`);

// Market Weather
export const getWeatherForecast = () => api.get('/weather/forecast');

// Macro Pulse
export const getMacroPulse = () => api.get('/macro/pulse');

// Portfolio X-Ray
export const portfolioXray = (holdings) => api.post('/xray/analyze', { holdings });

// Smart Patterns
export const scanPatterns = (limit = 30) => api.get(`/patterns/scan?limit=${limit}`);
export const getStockPatterns = (ticker) => api.get(`/patterns/stock/${ticker}`);

export default api;
