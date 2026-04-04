import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routers import stocks, market, scoring, news, ai, portfolio, financials, compare, auth, watchlist, timemachine, stresstest, dividends, insights, momentum, rotation, battle, weather, macro, xray, patterns

app = FastAPI(title="Stock Analysis Platform", version="3.0.0")

# CORS — allow local dev and production URLs
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    allowed_origins.append(frontend_url)
render_url = os.getenv("RENDER_EXTERNAL_URL", "")
if render_url:
    allowed_origins.append(render_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers (must be registered before static files catch-all)
app.include_router(stocks.router)
app.include_router(market.router)
app.include_router(scoring.router)
app.include_router(news.router)
app.include_router(ai.router)
app.include_router(portfolio.router)
app.include_router(financials.router)
app.include_router(compare.router)
app.include_router(auth.router)
app.include_router(watchlist.router)
app.include_router(timemachine.router)
app.include_router(stresstest.router)
app.include_router(dividends.router)
app.include_router(insights.router)
app.include_router(momentum.router)
app.include_router(rotation.router)
app.include_router(battle.router)
app.include_router(weather.router)
app.include_router(macro.router)
app.include_router(xray.router)
app.include_router(patterns.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve React frontend in production
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="static-assets")

    # Serve other static files at root (favicon, etc.)
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Serve React SPA — falls back to index.html for client-side routing."""
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIR / "index.html"))
