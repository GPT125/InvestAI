from fastapi import APIRouter
from backend.services import news_service, stock_data

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/stock/{ticker}")
def stock_news(ticker: str):
    ticker = ticker.upper()
    info = stock_data.get_stock_info(ticker)
    company_name = info.get("shortName", "") if info else ""
    return news_service.get_stock_news(ticker, company_name)


@router.get("/market")
def market_news():
    return news_service.get_market_news()
