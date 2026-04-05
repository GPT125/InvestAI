import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Portfolio from './pages/Portfolio';
import Compare from './pages/Compare';
import Financials from './pages/Financials';
import Login from './pages/Login';
import Watchlist from './pages/Watchlist';
import MomentumRadar from './pages/MomentumRadar';
import BattleArena from './pages/BattleArena';
import MacroPulse from './pages/MacroPulse';
import SmartPatterns from './pages/SmartPatterns';
import Competitions from './pages/Competitions';
import CompetitionDetail from './pages/CompetitionDetail';
import GlobalMarkets from './pages/GlobalMarkets';
import Academy from './pages/Academy';
import AcademyModule from './pages/AcademyModule';
import AcademyLesson from './pages/AcademyLesson';
import './App.css';

/** Polls /api/health and shows a banner if the server is cold-starting. */
function ServerStatusBanner() {
  const [status, setStatus] = useState('checking');
  const retryRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const slowTimer = setTimeout(() => { if (mounted && status === 'checking') setStatus('slow'); }, 4000);

    async function ping() {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(8000) });
        if (res.ok && mounted) { setStatus('ok'); clearTimeout(slowTimer); return; }
      } catch {}
      if (mounted) retryRef.current = setTimeout(ping, 5000);
    }
    ping();
    return () => { mounted = false; clearTimeout(slowTimer); clearTimeout(retryRef.current); };
  }, []);

  if (status !== 'slow') return null;
  return (
    <div className="server-banner">
      <span className="server-banner-spinner" />
      <span>Server is starting up — data will load shortly.</span>
    </div>
  );
}

/** Redirects to /login if not authenticated. While auth is loading shows nothing. */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null; // wait for auth check before redirecting
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/** Background prefetch of heavy pages once user is logged in */
function Prefetcher() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    // Kick off slow endpoints silently after login so they're cached
    const prefetch = async () => {
      try { await fetch('/api/momentum/radar?limit=30'); } catch {}
      try { await fetch('/api/patterns/scan?limit=30'); } catch {}
      try { await fetch('/api/market/sectors'); } catch {}
      try { await fetch('/api/macro/pulse'); } catch {}
    };
    const t = setTimeout(prefetch, 1500); // slight delay so login page renders first
    return () => clearTimeout(t);
  }, [user]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app">
      <ServerStatusBanner />
      <Prefetcher />
      {!isLoginPage && <Navbar />}
      <main className={isLoginPage ? '' : 'main-content'}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — redirect to /login if not signed in */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/stock/:ticker" element={<ProtectedRoute><StockDetail /></ProtectedRoute>} />
          <Route path="/stock/:ticker/financials" element={<ProtectedRoute><Financials /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
          <Route path="/momentum" element={<ProtectedRoute><MomentumRadar /></ProtectedRoute>} />
          <Route path="/battle" element={<ProtectedRoute><BattleArena /></ProtectedRoute>} />
          <Route path="/macro" element={<ProtectedRoute><MacroPulse /></ProtectedRoute>} />
          <Route path="/patterns" element={<ProtectedRoute><SmartPatterns /></ProtectedRoute>} />
          <Route path="/competitions" element={<ProtectedRoute><Competitions /></ProtectedRoute>} />
          <Route path="/competitions/:id" element={<ProtectedRoute><CompetitionDetail /></ProtectedRoute>} />
          <Route path="/global" element={<ProtectedRoute><GlobalMarkets /></ProtectedRoute>} />
          <Route path="/academy" element={<ProtectedRoute><Academy /></ProtectedRoute>} />
          <Route path="/academy/:moduleId" element={<ProtectedRoute><AcademyModule /></ProtectedRoute>} />
          <Route path="/academy/:moduleId/:lessonId" element={<ProtectedRoute><AcademyLesson /></ProtectedRoute>} />

          {/* Redirects */}
          <Route path="/screener" element={<Navigate to="/" replace />} />
          <Route path="/rotation" element={<Navigate to="/" replace />} />
          <Route path="/weather" element={<Navigate to="/" replace />} />
          <Route path="/xray" element={<Navigate to="/portfolio" replace />} />
          <Route path="/quiz" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
