import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Search, MessageSquare, Settings, TrendingUp, PieChart, GitCompare } from 'lucide-react';
import { searchStocks } from '../../api/client';
import { formatCurrency, getChangeColor } from '../../utils/formatters';

const navItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/screener', label: 'Screener', icon: Search },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/portfolio', label: 'Portfolio', icon: PieChart },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length >= 1) {
      try {
        const res = await searchStocks(q);
        setResults(res.data || []);
        setShowResults(true);
      } catch {
        setResults([]);
      }
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelect = (ticker) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    navigate(`/stock/${ticker}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSelect(query.trim().toUpperCase());
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <TrendingUp size={24} />
        <span>StockAI</span>
      </Link>

      {/* Global Search */}
      <div className="nav-search-wrapper">
        <div className="nav-search">
          <Search size={16} className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search any stock or ETF..."
            value={query}
            onChange={(e) => handleSearch(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="nav-search-input"
          />
        </div>
        {showResults && results.length > 0 && (
          <div className="nav-search-results">
            {results.slice(0, 10).map((r) => (
              <div
                key={r.ticker}
                className="nav-search-item"
                onMouseDown={() => handleSelect(r.ticker)}
              >
                <div>
                  <strong style={{ color: '#e0e0e0' }}>{r.ticker}</strong>
                  <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>{r.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{formatCurrency(r.price)}</span>
                  <span style={{ color: getChangeColor(r.changePercent), fontSize: 12 }}>
                    {r.changePercent >= 0 ? '+' : ''}{r.changePercent?.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="nav-links">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`nav-link ${location.pathname === path ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
