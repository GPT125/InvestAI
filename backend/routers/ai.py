from fastapi import APIRouter, HTTPException
from backend.models.stock import ChatRequest, AnalyzeRequest
from backend.services import ai_service, stock_data, news_service
from backend.services.scoring_engine import compute_score

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/analyze")
def analyze(req: AnalyzeRequest):
    ticker = req.ticker.upper()
    detail = stock_data.get_detailed_stock(ticker)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")

    info = stock_data.get_stock_info(ticker)
    history = stock_data.get_price_history(ticker, "1y")
    score = compute_score(info, history)

    # Gather additional context
    hist_summary = stock_data.get_historical_summary(ticker)
    news = news_service.get_stock_news(ticker)
    etf_data = stock_data.get_etf_holdings(ticker) if detail.get("isETF") else None

    analysis = ai_service.analyze_stock(ticker, detail, score, hist_summary, news, etf_data)
    return {"ticker": ticker, "analysis": analysis}


@router.post("/chat")
def chat(req: ChatRequest):
    response = ai_service.chat(req.message, req.history)
    return {"response": response}
