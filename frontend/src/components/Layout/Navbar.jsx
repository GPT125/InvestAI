import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Search, MessageSquare, Settings, TrendingUp, PieChart,
  GitCompare, SlidersHorizontal, User, LogOut, X, Eye, Zap, Swords,
  Activity, Scan, Trophy, ChevronDown,
} from 'lucide-react';
import { searchStocks } from '../../api/client';
import { formatCurrency, getChangeColor } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { SECTORS } from '../../utils/constants';

// Grouped navigation — each group has a label + sub-items
const navGroups = [
  {
    label: 'Markets',
    items: [
      { path: '/',          label: 'Dashboard',  icon: BarChart3,  desc: 'Live market overview & indices' },
      { path: '/momentum',  label: 'Momentum',   icon: Zap,        desc: 'Trending movers & velocity' },
      { path: '/macro',     label: 'Macro',      icon: Activity,   desc: 'Economic indicators & pulse' },
    ],
  },
  {
    label: 'Research',
    items: [
      { path: '/patterns',  label: 'Patterns',   icon: Scan,       desc: 'Chart pattern recognition' },
      { path: '/compare',   label: 'Compare',    icon: GitCompare, desc: 'Side-by-side stock analysis' },
      { path: '/chat',      label: 'AI Chat',    icon: MessageSquare, desc: 'Ask AI about any stock' },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { path: '/portfolio', label: 'Portfolio',  icon: PieChart,   desc: 'Holdings & performance' },
      { path: '/watchlist', label: 'Watchlist',  icon: Eye,        desc: 'Stocks you\'re tracking' },
    ],
  },
  {
    label: 'Games',
    items: [
      { path: '/battle',        label: 'Battle',    icon: Swords,  desc: 'Stock vs stock showdown' },
      { path: '/competitions',  label: 'Compete',   icon: Trophy,  desc: 'Prediction competitions' },
    ],
  },
];

// Paths that belong to each group (for active-group detection)
const groupPaths = navGroups.reduce((acc, g) => {
  g.items.forEach(item => { acc[item.path] = g.label; });
  return acc;
}, {});

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
  const [openGroup, setOpenGroup] = useState(null);

  const filterRef = useRef(null);
  const dropdownRefs = useRef({});
  const closeTimer = useRef(null);

  // Close filter on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleGroupEnter = (label) => {
    clearTimeout(closeTimer.current);
    setOpenGroup(label);
  };

  const handleGroupLeave = () => {
    closeTimer.current = setTimeout(() => setOpenGroup(null), 120);
  };

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length >= 1) {
      try {
        const res = await searchStocks(q);
        let data = res.data || [];
        if (filterSector) data = data.filter(r => r.sector === filterSector);
        if (filterType)   data = data.filter(r => r.quoteType === filterType);
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

  const activeGroup = groupPaths[location.pathname];

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <TrendingUp size={22} />
        <span>StockAI</span>
      </Link>

      {/* Grouped nav links */}
      <div className="nav-links">
        {navGroups.map((group) => {
          const isOpen   = openGroup === group.label;
          const isActive = activeGroup === group.label;

          return (
            <div
              key={group.label}
              className={`nav-group ${isActive ? 'active' : ''} ${isOpen ? 'open' : ''}`}
              onMouseEnter={() => handleGroupEnter(group.label)}
              onMouseLeave={handleGroupLeave}
              ref={el => { dropdownRefs.current[group.label] = el; }}
            >
              {/* Top-level tab */}
              <button className="nav-group-btn">
                <span>{group.label}</span>
                <ChevronDown size={13} className="nav-chevron" />
              </button>

              {/* Dropdown panel */}
              {isOpen && (
                <div className="nav-dropdown">
                  {group.items.map(({ path, label, icon: Icon, desc }) => (
                    <Link
                      key={path}
                      to={path}
                      className={`nav-dropdown-item ${location.pathname === path ? 'active' : ''}`}
                      onClick={() => setOpenGroup(null)}
                    >
                      <div className="nav-dropdown-icon">
                        <Icon size={16} />
                      </div>
                      <div className="nav-dropdown-text">
                        <span className="nav-dropdown-label">{label}</span>
                        <span className="nav-dropdown-desc">{desc}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Settings — standalone */}
        <Link
          to="/settings"
          className={`nav-link nav-settings-link ${location.pathname === '/settings' ? 'active' : ''}`}
          title="Settings"
        >
          <Settings size={16} />
        </Link>
      </div>

      {/* Search */}
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
    </nav>
  );
}
