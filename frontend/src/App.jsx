import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import Screener from './pages/Screener';
import MomentumRadar from './pages/MomentumRadar';
import SectorRotation from './pages/SectorRotation';
import BattleArena from './pages/BattleArena';
import VolatilityWeather from './pages/VolatilityWeather';
import MacroPulse from './pages/MacroPulse';
import SmartPatterns from './pages/SmartPatterns';
import PortfolioXray from './pages/PortfolioXray';
import InvestorQuiz from './pages/InvestorQuiz';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app">
      {!isLoginPage && <Navbar />}
      <main className={isLoginPage ? '' : 'main-content'}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/stock/:ticker/financials" element={<Financials />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/momentum" element={<MomentumRadar />} />
          <Route path="/rotation" element={<SectorRotation />} />
          <Route path="/battle" element={<BattleArena />} />
          <Route path="/weather" element={<VolatilityWeather />} />
          <Route path="/macro" element={<MacroPulse />} />
          <Route path="/patterns" element={<SmartPatterns />} />
          <Route path="/xray" element={<PortfolioXray />} />
          <Route path="/quiz" element={<InvestorQuiz />} />
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
