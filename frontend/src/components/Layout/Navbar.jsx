import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Search, MessageSquare, Settings, TrendingUp, PieChart, GitCompare, SlidersHorizontal, User, LogOut, X, Eye, Zap, RotateCcw, Swords, Cloud, Activity, Scan, SearchIcon, Brain } from 'lucide-react';
import { searchStocks } from '../../api/client';
import { formatCurrency, getChangeColor } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { SECTORS } from '../../utils/constants';

const navItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/momentum', label: 'Momentum', icon: Zap },
  { path: '/patterns', label: 'Patterns', icon: Scan },
  { path: '/battle', label: 'Battle', icon: Swords },
  { path: '/weather', label: 'Weather', icon: Cloud },
  { path: '/rotation', label: 'Rotation', icon: RotateCcw },
  { path: '/macro', label: 'Macro', icon: Activity },
  { path: '/screener', label: 'Screener', icon: SlidersHorizontal },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/portfolio', label: 'Portfolio', icon: PieChart },
  { path: '/xray', label: 'X-Ray', icon: Search },
  { path: '/watchlist', label: 'Watchlist', icon: Eye },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/quiz', label: 'Quiz', icon: Brain },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSector, setFilterSector] = useState('');
  const [filterType, setFilterType] = useState('');
  const filterRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length >= 1) {
      try {
        const res = await searchStocks(q);
        let data = res.data || [];
        // Apply filters
        if (filterSector) {
          data = data.filter(r => r.sector === filterSector);
        }
        if (filterType) {
          data = data.filter(r => r.quoteType === filterType);
        }
        setResults(data);
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
        <TrendingUp size={22} />
        <span>StockAI</span>
      </Link>

      {/* Global Search with Filter */}
      <div className="nav-search-wrapper">
        <div className="nav-search">
          <Search size={15} className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search stocks, ETFs..."
            value={query}
            onChange={(e) => handleSearch(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="nav-search-input"
          />
          <button
            className={`nav-filter-btn ${showFilters || filterSector || filterType ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filter"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="nav-filter-dropdown" ref={filterRef}>
            <div className="filter-dropdown-header">
              <span>Filters</span>
              {(filterSector || filterType) && (
                <button className="clear-filters" onClick={() => { setFilterSector(''); setFilterType(''); }}>
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div className="filter-dropdown-section">
              <label>Type</label>
              <div className="filter-chips">
                <button className={`filter-chip ${filterType === '' ? 'active' : ''}`} onClick={() => setFilterType('')}>All</button>
                <button className={`filter-chip ${filterType === 'EQUITY' ? 'active' : ''}`} onClick={() => setFilterType('EQUITY')}>Stocks</button>
                <button className={`filter-chip ${filterType === 'ETF' ? 'active' : ''}`} onClick={() => setFilterType('ETF')}>ETFs</button>
              </div>
            </div>
            <div className="filter-dropdown-section">
              <label>Sector</label>
              <div className="filter-chips">
                <button className={`filter-chip ${filterSector === '' ? 'active' : ''}`} onClick={() => setFilterSector('')}>All</button>
                {SECTORS.slice(0, 8).map(s => (
                  <button key={s} className={`filter-chip ${filterSector === s ? 'active' : ''}`} onClick={() => setFilterSector(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showResults && results.length > 0 && (
          <div className="nav-search-results">
            {results.slice(0, 10).map((r) => (
              <div
                key={r.ticker}
                className="nav-search-item"
                onMouseDown={() => handleSelect(r.ticker)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ color: '#e0e0e0' }}>{r.ticker}</strong>
                  {r.quoteType === 'ETF' && <span className="search-etf-tag">ETF</span>}
                  <span style={{ color: '#666', fontSize: 12 }}>{r.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500 }}>{formatCurrency(r.price)}</span>
                  <span style={{ color: getChangeColor(r.changePercent), fontSize: 12, fontWeight: 600 }}>
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
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}

        {/* Auth */}
        {user ? (
          <div className="nav-user">
            <Link to="/settings" className="nav-user-profile" title="Account Settings">
              <div className="nav-user-avatar">{(user.name || user.email)[0].toUpperCase()}</div>
              <span className="nav-user-name">{user.name || user.email.split('@')[0]}</span>
            </Link>
            <button className="nav-link nav-logout-btn" onClick={logout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="nav-link nav-login-btn">
            <User size={16} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
