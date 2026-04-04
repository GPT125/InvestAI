import { useState, useEffect } from 'react';
import axios from 'axios';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Tornado, CloudSun, Thermometer, BarChart3, Eye } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

const WEATHER_ICONS = {
  sun: Sun, 'cloud-sun': CloudSun, cloud: Cloud, 'cloud-rain': CloudRain,
  'cloud-lightning': CloudLightning, wind: Wind, tornado: Tornado,
};

const WEATHER_GRADIENTS = {
  Sunny: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  'Partly Cloudy': 'linear-gradient(135deg, #60a5fa, #fbbf24)',
  Overcast: 'linear-gradient(135deg, #6b7280, #9ca3af)',
  Rainy: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  Stormy: 'linear-gradient(135deg, #7c3aed, #dc2626)',
  Hurricane: 'linear-gradient(135deg, #dc2626, #991b1b)',
  Breezy: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
};

const TEMP_COLORS = { Hot: '#ef4444', Warm: '#f59e0b', Mild: '#6b7280', Moderate: '#3b82f6', Cool: '#06b6d4', Cold: '#60a5fa', Freezing: '#93c5fd' };

export default function VolatilityWeather() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadForecast(); }, []);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get('/weather/forecast');
      setForecast(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Checking market conditions...</p></div>;
  if (!forecast) return <div className="feature-card"><p>Unable to load forecast</p></div>;

  const WeatherIcon = WEATHER_ICONS[forecast.icon] || Cloud;
  const cond = forecast.conditions || {};

  return (
    <div className="weather-page">
      <div className="page-header-row">
        <div>
          <h1><Cloud size={28} /> Market Weather Map</h1>
          <p className="page-subtitle">Market conditions translated into an intuitive weather forecast</p>
        </div>
        <button className="refresh-btn" onClick={loadForecast}><Eye size={16} /> Refresh</button>
      </div>

      {/* Hero Weather Card */}
      <div className="weather-hero" style={{ background: WEATHER_GRADIENTS[forecast.weather] || WEATHER_GRADIENTS.Breezy }}>
        <div className="weather-hero-icon">
          <WeatherIcon size={80} color="white" />
        </div>
        <div className="weather-hero-info">
          <h2>{forecast.weather}</h2>
          <p className="weather-desc">{forecast.description}</p>
          <div className="weather-temp">
            <Thermometer size={18} />
            <span style={{ color: TEMP_COLORS[forecast.temperature] || '#fff' }}>{forecast.temperature}</span>
          </div>
        </div>
      </div>

      {/* Condition Cards */}
      <div className="weather-conditions-grid">
        {/* VIX */}
        {cond.vix && (
          <div className="weather-cond-card">
            <h4><Thermometer size={18} /> Volatility (VIX)</h4>
            <div className="cond-value">{cond.vix.current}</div>
            <div className="cond-label">{cond.vix.label}</div>
            {cond.vix.avg3m && <div className="cond-detail">3M Avg: {cond.vix.avg3m}</div>}
            {cond.vix.trend != null && <div className={`cond-trend ${cond.vix.trend > 0 ? 'negative' : 'positive'}`}>
              Trend: {cond.vix.trend > 0 ? '↑ Rising' : '↓ Falling'} ({cond.vix.trend > 0 ? '+' : ''}{cond.vix.trend})
            </div>}
            <div className="vix-gauge">
              <div className="vix-gauge-fill" style={{ width: `${Math.min(100, (cond.vix.current / 50) * 100)}%`, background: cond.vix.current < 15 ? '#22c55e' : cond.vix.current < 20 ? '#84cc16' : cond.vix.current < 25 ? '#f59e0b' : cond.vix.current < 35 ? '#f97316' : '#ef4444' }} />
            </div>
            <div className="vix-scale"><span>0 (Calm)</span><span>50 (Extreme)</span></div>
          </div>
        )}

        {/* Trend */}
        {cond.trend && (
          <div className="weather-cond-card">
            <h4><BarChart3 size={18} /> Market Trend</h4>
            <div className="cond-value">{cond.trend.direction}</div>
            <div className="cond-detail-row">
              <span>1W: <span className={cond.trend.return1w >= 0 ? 'positive' : 'negative'}>{cond.trend.return1w >= 0 ? '+' : ''}{cond.trend.return1w}%</span></span>
              <span>1M: <span className={cond.trend.return1m >= 0 ? 'positive' : 'negative'}>{cond.trend.return1m >= 0 ? '+' : ''}{cond.trend.return1m}%</span></span>
            </div>
            <div className="sma-indicators">
              <span className={cond.trend.aboveSma20 ? 'above' : 'below'}>SMA20: {cond.trend.aboveSma20 ? 'Above ✓' : 'Below ✗'}</span>
              <span className={cond.trend.aboveSma50 ? 'above' : 'below'}>SMA50: {cond.trend.aboveSma50 ? 'Above ✓' : 'Below ✗'}</span>
            </div>
          </div>
        )}

        {/* Breadth */}
        {cond.breadth && (
          <div className="weather-cond-card">
            <h4><BarChart3 size={18} /> Market Breadth</h4>
            <div className="cond-value">{cond.breadth.pressure} Pressure</div>
            <div className="breadth-bar">
              <div className="breadth-adv" style={{ width: `${(cond.breadth.advancing / Math.max(cond.breadth.total, 1)) * 100}%` }}>
                {cond.breadth.advancing} ↑
              </div>
              <div className="breadth-dec" style={{ width: `${(cond.breadth.declining / Math.max(cond.breadth.total, 1)) * 100}%` }}>
                {cond.breadth.declining} ↓
              </div>
            </div>
            <div className="cond-detail">A/D Ratio: {cond.breadth.adRatio}</div>
          </div>
        )}

        {/* Sector Dispersion */}
        {cond.dispersion && (
          <div className="weather-cond-card">
            <h4><Wind size={18} /> Sector Dispersion</h4>
            <div className="cond-value">{cond.dispersion.label}</div>
            <div className="cond-detail">StdDev: {cond.dispersion.stdDev}%</div>
            <div className="dispersion-sectors">
              {cond.dispersion.sectors?.map(s => (
                <div key={s.sector} className="dispersion-item">
                  <span>{s.sector}</span>
                  <span className={s.return >= 0 ? 'positive' : 'negative'}>{s.return >= 0 ? '+' : ''}{s.return}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Forecast Interpretation */}
      <div className="feature-card">
        <h3>What This Means For You</h3>
        <div className="weather-interpretation">
          {forecast.weather === 'Sunny' && <p>Markets are calm with strong upward momentum. This is generally a good environment for growth stocks and risk-on strategies. However, extended calm can precede sudden volatility spikes — consider maintaining some hedge positions.</p>}
          {forecast.weather === 'Partly Cloudy' && <p>Conditions are mostly favorable with some uncertainty. The trend is positive but watch for developing headwinds. A balanced approach between growth and defensive positions is appropriate.</p>}
          {forecast.weather === 'Overcast' && <p>The market is in a holding pattern. Direction is unclear, so patience is key. Consider tightening stop losses and avoiding large new positions until a clearer trend emerges.</p>}
          {forecast.weather === 'Rainy' && <p>Bearish pressure is building. Consider reducing risk exposure, moving toward defensive sectors (utilities, healthcare, consumer staples) and increasing cash positions. Quality and value tend to outperform in these conditions.</p>}
          {forecast.weather === 'Stormy' && <p>Significant volatility and downward pressure. Prioritize capital preservation — reduce position sizes, hedge with puts or inverse ETFs, and focus on high-quality dividend payers. Avoid catching falling knives.</p>}
          {forecast.weather === 'Hurricane' && <p>Extreme market stress. This is not the time for hero trades. Focus on survival: reduce leverage, ensure you have adequate cash reserves, and avoid panic selling quality holdings at distressed prices.</p>}
          {forecast.weather === 'Breezy' && <p>Mixed conditions with light directional bias. Stay diversified and nimble. Look for sector rotation opportunities and maintain a watchlist for breakout setups in either direction.</p>}
        </div>
      </div>
    </div>
  );
}
