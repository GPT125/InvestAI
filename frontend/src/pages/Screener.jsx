import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filterStocks } from '../api/client';
import { formatCurrency, formatChangePercent, formatLargeNumber, getChangeColor, getScoreColor } from '../utils/formatters';
import { SECTORS } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export default function Screener() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    sectors: [],
    min_market_cap: '',
    min_score: '',
    sort_by: 'score',
    sort_order: 'desc',
    limit: 50,
  });
  const [sortCol, setSortCol] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');

  const handleFilter = async () => {
    setLoading(true);
    try {
      const body = {
        ...filters,
        min_price: filters.min_price ? Number(filters.min_price) : null,
        max_price: filters.max_price ? Number(filters.max_price) : null,
        min_market_cap: filters.min_market_cap ? Number(filters.min_market_cap) : null,
        min_score: filters.min_score ? Number(filters.min_score) : null,
        sectors: filters.sectors.length > 0 ? filters.sectors : null,
      };
      const res = await filterStocks(body);
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSector = (sector) => {
    setFilters((f) => ({
      ...f,
      sectors: f.sectors.includes(sector)
        ? f.sectors.filter((s) => s !== sector)
        : [...f.sectors, sector],
    }));
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const va = a[sortCol] ?? 0;
    const vb = b[sortCol] ?? 0;
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  return (
    <div className="screener">
      <h1><SlidersHorizontal size={24} /> Stock Screener</h1>

      <div className="filter-panel">
        <div className="filter-row">
          <div className="filter-group">
            <label>Min Price ($)</label>
            <input type="number" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })} placeholder="0" />
          </div>
          <div className="filter-group">
            <label>Max Price ($)</label>
            <input type="number" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} placeholder="Any" />
          </div>
          <div className="filter-group">
            <label>Min Market Cap ($)</label>
            <input type="number" value={filters.min_market_cap} onChange={(e) => setFilters({ ...filters, min_market_cap: e.target.value })} placeholder="0" />
          </div>
          <div className="filter-group">
            <label>Min Score</label>
            <input type="number" value={filters.min_score} onChange={(e) => setFilters({ ...filters, min_score: e.target.value })} placeholder="0" min="0" max="100" />
          </div>
        </div>

        <div className="filter-group">
          <label>Sectors</label>
          <div className="sector-chips">
            {SECTORS.map((s) => (
              <button
                key={s}
                className={`sector-chip ${filters.sectors.includes(s) ? 'active' : ''}`}
                onClick={() => toggleSector(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button className="search-btn" onClick={handleFilter} disabled={loading}>
          <Search size={16} /> {loading ? 'Searching...' : 'Search Stocks'}
        </button>
      </div>

      {loading && <LoadingSpinner message="Scanning stocks... This may take a moment." />}

      {!loading && results.length > 0 && (
        <div className="results-table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                {[
                  { key: 'ticker', label: 'Ticker' },
                  { key: 'price', label: 'Price' },
                  { key: 'changePercent', label: 'Change' },
                  { key: 'composite', label: 'Score' },
                  { key: 'rating', label: 'Rating' },
                  { key: 'sector', label: 'Sector' },
                  { key: 'marketCap', label: 'Market Cap' },
                  { key: 'pe', label: 'P/E' },
                ].map((col) => (
                  <th key={col.key} onClick={() => handleSort(col.key)} className="sortable-th">
                    {col.label} <ArrowUpDown size={12} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((s) => (
                <tr key={s.ticker} onClick={() => navigate(`/stock/${s.ticker}`)} className="clickable-row">
                  <td><strong>{s.ticker}</strong><br /><small>{s.name}</small></td>
                  <td>{formatCurrency(s.price)}</td>
                  <td style={{ color: getChangeColor(s.changePercent) }}>{formatChangePercent(s.changePercent)}</td>
                  <td><span className="inline-score" style={{ backgroundColor: getScoreColor(s.composite) }}>{s.composite}</span></td>
                  <td>{s.rating}</td>
                  <td>{s.sector}</td>
                  <td>{formatLargeNumber(s.marketCap)}</td>
                  <td>{s.pe?.toFixed(1) || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && results.length === 0 && (
        <p className="empty-state">Use the filters above and click "Search Stocks" to find opportunities.</p>
      )}
    </div>
  );
}
