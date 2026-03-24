export const SECTORS = [
  'Technology', 'Healthcare', 'Financials', 'Consumer Discretionary',
  'Consumer Staples', 'Energy', 'Industrials', 'Materials',
  'Real Estate', 'Utilities', 'Communication Services',
];

export const PERIODS = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
  { label: '5Y', value: '5y' },
  { label: '10Y', value: '10y' },
  { label: 'Max', value: 'max' },
];

export const SUMMARY_FREQUENCIES = [
  { label: 'Real-time', value: 'realtime' },
  { label: 'Every Hour', value: 'hourly' },
  { label: 'Every Day', value: 'daily' },
  { label: 'Every Week', value: 'weekly' },
  { label: 'Every Month', value: 'monthly' },
];

export const DEFAULT_SETTINGS = {
  maxBudget: 500,
  sectors: [],
  riskTolerance: 'moderate',
  minScore: 0,
  summaryFrequency: 'daily',
  includeGovernment: true,
  includeRecommendations: true,
};
