import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatChangePercent, getChangeColor, getScoreColor } from '../../utils/formatters';

export default function StockCard({ stock }) {
  const navigate = useNavigate();

  return (
    <div className="stock-card" onClick={() => navigate(`/stock/${stock.ticker}`)}>
      <div className="stock-card-header">
        <div>
          <h3 className="stock-ticker">{stock.ticker}</h3>
          <p className="stock-name">{stock.name}</p>
        </div>
        {stock.composite != null && (
          <div className="score-badge" style={{ backgroundColor: getScoreColor(stock.composite) }}>
            {stock.composite}
          </div>
        )}
      </div>
      <div className="stock-card-body">
        <span className="stock-price">{formatCurrency(stock.price)}</span>
        <span className="stock-change" style={{ color: getChangeColor(stock.changePercent) }}>
          {formatChangePercent(stock.changePercent)}
        </span>
      </div>
      {stock.sector && stock.sector !== 'N/A' && (
        <span className="stock-sector">{stock.sector}</span>
      )}
      {stock.rating && <span className="stock-rating">{stock.rating}</span>}
    </div>
  );
}
