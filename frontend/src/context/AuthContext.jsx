import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

/**
 * Per-user localStorage helpers.
 *
 * We key settings by user id so switching accounts doesn't mix preferences,
 * and we treat localStorage as the source of truth because Render's free-tier
 * filesystem is ephemeral and can wipe the server-side DB on cold-starts.
 */
const settingsKey = (userId) => `investai-settings-${userId || 'guest'}`;

function loadLocalSettings(userId) {
  try {
    const raw = localStorage.getItem(settingsKey(userId));
    if (raw) return JSON.parse(raw);
    // Back-compat: older builds used a single shared key
    const legacy = localStorage.getItem('stockai-settings');
    return legacy ? JSON.parse(legacy) : null;
  } catch {
    return null;
  }
}

function saveLocalSettings(userId, settings) {
  try {
    localStorage.setItem(settingsKey(userId), JSON.stringify(settings || {}));
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stockai-token');
    const isGuest = localStorage.getItem('stockai-guest');

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(res => {
          if (res.data && !res.data.error) {
            const me = res.data;
            // Prefer local settings (survives server wipes); fall back to server
            const localSettings = loadLocalSettings(me.id);
            const mergedSettings = { ...(me.settings || {}), ...(localSettings || {}) };
            me.settings = mergedSettings;
            saveLocalSettings(me.id, mergedSettings);
            setUser(me);
          } else {
            localStorage.removeItem('stockai-token');
            delete api.defaults.headers.common['Authorization'];
          }
        })
        .catch(() => {
          // Backend unreachable — still try to restore a session from cache
          localStorage.removeItem('stockai-token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else if (isGuest) {
      // Restore guest session
      const guestSettings = loadLocalSettings('guest') || {};
      setUser({
        id: 'guest',
        email: 'guest@investai.local',
        name: 'Guest',
        isGuest: true,
        settings: guestSettings,
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const _handleAuthResponse = (res) => {
    if (res.data.error) throw new Error(res.data.error);
    if (res.data.pending_verification) {
      return res.data;
    }
    const { token, user: userData, settings } = res.data;
    localStorage.setItem('stockai-token', token);
    localStorage.removeItem('stockai-guest'); // Clear guest mode on real login
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Merge server settings with any local settings already saved for this user
    const localSettings = loadLocalSettings(userData.id);
    const mergedSettings = { ...(settings || {}), ...(localSettings || {}) };
    saveLocalSettings(userData.id, mergedSettings);
    setUser({ ...userData, settings: mergedSettings });
    return userData;
  };

  const _handleAuthError = (err) => {
    const msg = err.response?.data?.error || err.message || 'Something went wrong';
    throw new Error(msg);
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      return _handleAuthResponse(res);
    } catch (err) { _handleAuthError(err); }
  };

  const register = async (email, password, name) => {
    try {
      const res = await api.post('/auth/register', { email, password, name });
      return _handleAuthResponse(res);
    } catch (err) { _handleAuthError(err); }
  };

  const verifyEmail = async (email, code) => {
    try {
      const res = await api.post('/auth/verify-email', { email, code });
      return _handleAuthResponse(res);
    } catch (err) { _handleAuthError(err); }
  };

  const resendVerification = async (email) => {
    try {
      const res = await api.post('/auth/resend-verification', { email });
      if (res.data.error) throw new Error(res.data.error);
      return res.data;
    } catch (err) { _handleAuthError(err); }
  };

  const googleLogin = async (credential) => {
    try {
      const res = await api.post('/auth/google', { credential });
      return _handleAuthResponse(res);
    } catch (err) { _handleAuthError(err); }
  };

  const continueAsGuest = () => {
    const guestSettings = loadLocalSettings('guest') || {};
    const guestUser = {
      id: 'guest',
      email: 'guest@investai.local',
      name: 'Guest',
      isGuest: true,
      settings: guestSettings,
    };
    localStorage.setItem('stockai-guest', 'true');
    setUser(guestUser);
    return guestUser;
  };

  const logout = () => {
    localStorage.removeItem('stockai-token');
    localStorage.removeItem('stockai-guest');
    // NOTE: we intentionally keep per-user settings/chats in localStorage so
    // they're restored next time the same account logs in.
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (name) => {
    if (!user || user.isGuest) return;
    try {
      await api.put('/auth/profile', { name });
    } catch {}
    // Always update local state so it's visible immediately
    setUser(prev => ({ ...prev, name }));
  };

  const saveSettings = async (settings) => {
    // 1. Persist locally FIRST (source of truth)
    saveLocalSettings(user?.id, settings);
    setUser(prev => (prev ? { ...prev, settings } : prev));

    // 2. Best-effort sync to backend so other devices can pull it later
    if (user && !user.isGuest) {
      try {
        await api.put('/auth/settings', { settings });
      } catch {}
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, verifyEmail, resendVerification,
      googleLogin, continueAsGuest, logout, updateProfile, saveSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
