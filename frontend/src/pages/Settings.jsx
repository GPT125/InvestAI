import { useState, useEffect } from 'react';
import { SECTORS, SUMMARY_FREQUENCIES, DEFAULT_SETTINGS } from '../utils/constants';
import { updateMarketSummarySettings } from '../api/client';
import { Settings as SettingsIcon, Save, Bell, Clock } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('stockai-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    localStorage.setItem('stockai-settings', JSON.stringify(settings));
    // Also save summary settings to backend
    try {
      await updateMarketSummarySettings({
        frequency: settings.summaryFrequency,
        includeGovernment: settings.includeGovernment,
        includeRecommendations: settings.includeRecommendations,
      });
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleSector = (sector) => {
    setSettings((s) => ({
      ...s,
      sectors: s.sectors.includes(sector)
        ? s.sectors.filter((x) => x !== sector)
        : [...s.sectors, sector],
    }));
  };

  return (
    <div className="settings-page">
      <h1><SettingsIcon size={24} /> Settings</h1>

      <div className="settings-card">
        <h3><Bell size={18} /> Market Summary Updates</h3>
        <p className="settings-desc">How often should the market summary update when you open the app?</p>
        <div className="frequency-options">
          {SUMMARY_FREQUENCIES.map((f) => (
            <label
              key={f.value}
              className={`frequency-option ${settings.summaryFrequency === f.value ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="frequency"
                value={f.value}
                checked={settings.summaryFrequency === f.value}
                onChange={() => setSettings({ ...settings, summaryFrequency: f.value })}
              />
              <Clock size={14} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
        <div className="summary-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.includeGovernment !== false}
              onChange={(e) => setSettings({ ...settings, includeGovernment: e.target.checked })}
            />
            <span>Include government & policy updates</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.includeRecommendations !== false}
              onChange={(e) => setSettings({ ...settings, includeRecommendations: e.target.checked })}
            />
            <span>Include stock/ETF buy recommendations based on your portfolio</span>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3>Budget</h3>
        <p className="settings-desc">Maximum price per share you're willing to pay.</p>
        <div className="settings-input-row">
          <span>$</span>
          <input
            type="number"
            value={settings.maxBudget}
            onChange={(e) => setSettings({ ...settings, maxBudget: Number(e.target.value) })}
            min={0}
          />
        </div>
      </div>

      <div className="settings-card">
        <h3>Preferred Sectors</h3>
        <p className="settings-desc">Select sectors to focus on. Leave empty for all sectors.</p>
        <div className="sector-chips">
          {SECTORS.map((s) => (
            <button
              key={s}
              className={`sector-chip ${settings.sectors.includes(s) ? 'active' : ''}`}
              onClick={() => toggleSector(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h3>Risk Tolerance</h3>
        <div className="risk-options">
          {['conservative', 'moderate', 'aggressive'].map((r) => (
            <label key={r} className={`risk-option ${settings.riskTolerance === r ? 'active' : ''}`}>
              <input
                type="radio"
                name="risk"
                value={r}
                checked={settings.riskTolerance === r}
                onChange={() => setSettings({ ...settings, riskTolerance: r })}
              />
              <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h3>Minimum Score Filter</h3>
        <p className="settings-desc">Only show stocks scoring above this threshold in the dashboard.</p>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.minScore}
          onChange={(e) => setSettings({ ...settings, minScore: Number(e.target.value) })}
        />
        <span className="range-value">{settings.minScore}</span>
      </div>

      <button className="save-btn" onClick={handleSave}>
        <Save size={16} /> {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
