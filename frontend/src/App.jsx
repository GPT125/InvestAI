import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import AISidebar from './components/AISidebar';
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
import SectorRotation from './pages/SectorRotation';
import VolatilityWeather from './pages/VolatilityWeather';
import PortfolioXray from './pages/PortfolioXray';
import DividendCalendar from './pages/DividendCalendar';
import StressTest from './pages/StressTest';
import TimeMachine from './pages/TimeMachine';
import Insights from './pages/Insights';
import InvestorQuiz from './pages/InvestorQuiz';
import Pricing from './pages/Pricing';
import { Bot } from 'lucide-react';
import './App.css';

// ServerStatusBanner removed — API client now silently retries cold-starts
// on 502/503/504 and network errors, so the banner is no longer needed.

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
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);

  return (
    <div className="app">
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

          {/* Pro / premium feature pages */}
          <Route path="/rotation" element={<ProtectedRoute><SectorRotation /></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><VolatilityWeather /></ProtectedRoute>} />
          <Route path="/xray" element={<ProtectedRoute><PortfolioXray /></ProtectedRoute>} />
          <Route path="/dividends" element={<ProtectedRoute><DividendCalendar /></ProtectedRoute>} />
          <Route path="/stress-test" element={<ProtectedRoute><StressTest /></ProtectedRoute>} />
          <Route path="/time-machine" element={<ProtectedRoute><TimeMachine /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><InvestorQuiz /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />

          {/* Redirects */}
          <Route path="/screener" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* AI Sidebar — floating button + panel, available on all pages */}
      {!isLoginPage && (
        <>
          <button
            className={`ai-fab ${aiSidebarOpen ? 'hidden' : ''}`}
            onClick={() => setAiSidebarOpen(true)}
            title="AI Study Assistant"
          >
            <Bot size={22} />
          </button>
          <AISidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />
        </>
      )}
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
