from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import stocks, market, scoring, screener, news, ai, portfolio, financials, compare

app = FastAPI(title="Stock Analysis Platform", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(market.router)
app.include_router(scoring.router)
app.include_router(screener.router)
app.include_router(news.router)
app.include_router(ai.router)
app.include_router(portfolio.router)
app.include_router(financials.router)
app.include_router(compare.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
