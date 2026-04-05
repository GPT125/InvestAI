import { useState, useEffect } from 'react';
import { SECTORS, SUMMARY_FREQUENCIES, DEFAULT_SETTINGS } from '../utils/constants';
import { updateMarketSummarySettings } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Bell, Clock, CheckCircle, User, Mail, Edit3, Palette } from 'lucide-react';

const THEMES = [
  {
    id: 'dark', label: 'Dark',
    bg: '#0f0f1a', card: '#16162a', primary: '#7c8cf8', primaryRgb: '124, 140, 248',
    border: '#28284a', hover: '#1e1e38', text: '#e8e8f2', textSecondary: '#b0b0cc', muted: '#7878a0',
  },
  {
    id: 'midnight', label: 'Midnight',
    bg: '#060d1a', card: '#0d1b30', primary: '#60a5fa', primaryRgb: '96, 165, 250',
    border: '#1a2e48', hover: '#122040', text: '#d8eafc', textSecondary: '#90b8e0', muted: '#6090b8',
  },
  {
    id: 'forest', label: 'Forest',
    bg: '#080f09', card: '#0e1c10', primary: '#4ade80', primaryRgb: '74, 222, 128',
    border: '#1c3020', hover: '#122018', text: '#d4f0da', textSecondary: '#8ec89a', muted: '#5a9068',
  },
  {
    id: 'sunset', label: 'Sunset',
    bg: '#100906', card: '#1c100a', primary: '#fb923c', primaryRgb: '251, 146, 60',
    border: '#38200c', hover: '#241508', text: '#f2dcc8', textSecondary: '#c8a080', muted: '#9a7050',
  },
  {
    id: 'purple', label: 'Violet',
    bg: '#0c0a1a', card: '#14112a', primary: '#a78bfa', primaryRgb: '167, 139, 250',
    border: '#2c2050', hover: '#1a1538', text: '#e2d8ff', textSecondary: '#a890d8', muted: '#8068b0',
  },
  {
    id: 'rose', label: 'Rose',
    bg: '#100a0d', card: '#1c1018', primary: '#f472b6', primaryRgb: '244, 114, 182',
    border: '#381528', hover: '#241018', text: '#f5d0e4', textSecondary: '#c090a8', muted: '#906878',
  },
];

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-card', theme.card);
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-rgb', theme.primaryRgb);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-hover', theme.hover);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-text-secondary', theme.textSecondary);
  root.style.setProperty('--color-muted', theme.muted);
  document.body.style.background = theme.bg;
  document.body.style.color = theme.text;
}

export default function Settings() {
  const { user, saveSettings, updateProfile } = useAuth();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('stockai-settings');
      // Merge with DEFAULT_SETTINGS — guards against null/missing keys (e.g. sectors:null) that crash .includes()
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
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
    setSettings((s) => {
      const sectors = s.sectors || [];
      return {
        ...s,
        sectors: sectors.includes(sector)
          ? sectors.filter((x) => x !== sector)
          : [...sectors, sector],
      };
    });
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
            <button key={s} className={`sector-chip ${(settings.sectors || []).includes(s) ? 'active' : ''}`} onClick={() => toggleSector(s)}>
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
