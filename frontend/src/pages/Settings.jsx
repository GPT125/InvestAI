import { useState, useEffect } from 'react';
import { SECTORS, SUMMARY_FREQUENCIES, DEFAULT_SETTINGS } from '../utils/constants';
import { updateMarketSummarySettings } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Bell, Clock, CheckCircle, User, Mail, Edit3, Palette } from 'lucide-react';

const THEMES = [
  {
    id: 'dark', label: 'Dark',
    bg: '#0f0f1a', card: '#16162a', primary: '#7c8cf8',
    border: '#2a2a4a', hover: '#1e1e3a', text: '#e0e0e0', muted: '#888',
  },
  {
    id: 'midnight', label: 'Midnight',
    bg: '#070d1a', card: '#0d1a2e', primary: '#60a5fa',
    border: '#1a2a45', hover: '#0f2040', text: '#dce8f8', muted: '#7a95b8',
  },
  {
    id: 'forest', label: 'Forest',
    bg: '#060f0a', card: '#0a1a0f', primary: '#4ade80',
    border: '#1a3025', hover: '#0e2018', text: '#d4f0db', muted: '#6a9e78',
  },
  {
    id: 'sunset', label: 'Sunset',
    bg: '#0f0905', card: '#1a100a', primary: '#f97316',
    border: '#3a1f0a', hover: '#221408', text: '#f5dcc8', muted: '#a07050',
  },
  {
    id: 'purple', label: 'Violet',
    bg: '#0d0a1a', card: '#160f2a', primary: '#a78bfa',
    border: '#2e1f50', hover: '#1c1435', text: '#e4d8ff', muted: '#8870b8',
  },
  {
    id: 'rose', label: 'Rose',
    bg: '#110a0e', card: '#1e0f14', primary: '#fb7185',
    border: '#3a1520', hover: '#221018', text: '#f8d0d8', muted: '#a06070',
  },
];

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-card', theme.card);
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-hover', theme.hover);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-muted', theme.muted);
  document.body.style.background = theme.bg;
  document.body.style.color = theme.text;
}

export default function Settings() {
  const { user, saveSettings, updateProfile } = useAuth();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('stockai-settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [saved, setSaved] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [editingName, setEditingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('stockai-theme') || 'dark');

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
  }, [user]);

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('stockai-theme', themeId);
    applyTheme(themeId);
  };

  const handleSave = async () => {
    localStorage.setItem('stockai-settings', JSON.stringify(settings));
    if (saveSettings) await saveSettings(settings);
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

  const handleSaveName = async () => {
    if (profileName.trim() && updateProfile) {
      await updateProfile(profileName.trim());
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  };

  const toggleSector = (sector) => {
    setSettings((s) => ({
      ...s,
      sectors: s.sectors.includes(sector)
        ? s.sectors.filter((x) => x !== sector)
        : [...s.sectors, sector],
    }));
  };

  const getInitials = (name, email) => {
    if (name && name.includes(' ')) {
      const parts = name.split(' ');
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name || email || '?')[0].toUpperCase();
  };

  return (
    <div className="settings-page">
      <h1><SettingsIcon size={24} /> Settings</h1>

      {user ? (
        <div className="settings-card profile-card">
          <div className="profile-section">
            <div className="profile-avatar-large">
              {getInitials(user.name, user.email)}
            </div>
            <div className="profile-details">
              {editingName ? (
                <div className="profile-edit-row">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your full name"
                    className="profile-name-input"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button className="profile-save-btn" onClick={handleSaveName}>
                    <CheckCircle size={14} /> Save
                  </button>
                  <button className="profile-cancel-btn" onClick={() => { setEditingName(false); setProfileName(user.name || ''); }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="profile-name-row">
                  <h2 className="profile-display-name">{user.name || 'Set your name'}</h2>
                  <button className="profile-edit-btn" onClick={() => setEditingName(true)} title="Edit name">
                    <Edit3 size={13} />
                  </button>
                  {nameSaved && <span className="profile-saved-badge"><CheckCircle size={12} /> Updated</span>}
                </div>
              )}
              <div className="profile-email"><Mail size={13} /><span>{user.email}</span></div>
              <span className="profile-badge"><User size={11} /> Member</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="settings-card profile-card">
          <div className="profile-section profile-guest">
            <div className="profile-avatar-large guest">?</div>
            <div className="profile-details">
              <h2 className="profile-display-name">Guest</h2>
              <p className="profile-guest-hint">Sign in to save your settings and sync across devices</p>
            </div>
          </div>
        </div>
      )}

      {/* Color Theme */}
      <div className="settings-card">
        <h3><Palette size={18} /> Color Theme</h3>
        <p className="settings-desc">Choose a platform color theme.</p>
        <div className="theme-grid">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme.id)}
            >
              <div className="theme-preview-swatches">
                <div style={{ background: theme.bg, flex: 2 }} />
                <div style={{ background: theme.card, flex: 2 }} />
                <div style={{ background: theme.primary, flex: 1 }} />
              </div>
              <span className="theme-label">{theme.label}</span>
              {currentTheme === theme.id && <span className="theme-active-dot" />}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h3><Bell size={18} /> Market Summary Updates</h3>
        <p className="settings-desc">How often should the market summary update?</p>
        <div className="frequency-options">
          {SUMMARY_FREQUENCIES.map((f) => (
            <label key={f.value} className={`frequency-option ${settings.summaryFrequency === f.value ? 'active' : ''}`}>
              <input type="radio" name="frequency" value={f.value} checked={settings.summaryFrequency === f.value} onChange={() => setSettings({ ...settings, summaryFrequency: f.value })} />
              <Clock size={14} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
        <div className="summary-options">
          <label className="checkbox-label">
            <input type="checkbox" checked={settings.includeGovernment !== false} onChange={(e) => setSettings({ ...settings, includeGovernment: e.target.checked })} />
            <span>Include government & policy updates</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={settings.includeRecommendations !== false} onChange={(e) => setSettings({ ...settings, includeRecommendations: e.target.checked })} />
            <span>Include stock/ETF buy recommendations</span>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3>Budget</h3>
        <p className="settings-desc">Maximum price per share you're willing to pay.</p>
        <div className="settings-input-row">
          <span>$</span>
          <input type="number" value={settings.maxBudget} onChange={(e) => setSettings({ ...settings, maxBudget: Number(e.target.value) })} min={0} />
        </div>
      </div>

      <div className="settings-card">
        <h3>Preferred Sectors</h3>
        <p className="settings-desc">Select sectors to focus on. Leave empty for all sectors.</p>
        <div className="sector-chips">
          {SECTORS.map((s) => (
            <button key={s} className={`sector-chip ${settings.sectors.includes(s) ? 'active' : ''}`} onClick={() => toggleSector(s)}>
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
              <input type="radio" name="risk" value={r} checked={settings.riskTolerance === r} onChange={() => setSettings({ ...settings, riskTolerance: r })} />
              <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h3>Minimum Score Filter</h3>
        <p className="settings-desc">Only show stocks scoring above this threshold.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input type="range" min={0} max={100} value={settings.minScore} onChange={(e) => setSettings({ ...settings, minScore: Number(e.target.value) })} style={{ flex: 1 }} />
          <span className="range-value">{settings.minScore}</span>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave}>
        {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
      </button>
    </div>
  );
}
