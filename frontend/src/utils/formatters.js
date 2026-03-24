export const formatCurrency = (value) => {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export const formatLargeNumber = (value) => {
  if (value == null) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
};

export const formatPercent = (value) => {
  if (value == null) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};

export const formatChange = (value) => {
  if (value == null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
};

export const formatChangePercent = (value) => {
  if (value == null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const getChangeColor = (value) => {
  if (value == null || value === 0) return '#888';
  return value > 0 ? '#22c55e' : '#ef4444';
};

export const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#84cc16';
  if (score >= 45) return '#eab308';
  if (score >= 25) return '#f97316';
  return '#ef4444';
};
