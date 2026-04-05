import os
import threading
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routers import stocks, market, scoring, news, ai, portfolio, financials, compare, auth, watchlist, timemachine, stresstest, dividends, insights, momentum, rotation, battle, weather, macro, xray, patterns, competitions, global_markets


def _warm_cache():
    """Pre-fetch slow endpoints in background so first user hits cached data."""
    import time
    import urllib.request
    time.sleep(8)  # wait for server to fully start
    endpoints = [
        "http://localhost:8000/api/market/overview",
        "http://localhost:8000/api/market/sectors",
        "http://localhost:8000/api/market/summary",
        "http://localhost:8000/api/momentum/radar?limit=30",
        "http://localhost:8000/api/patterns/scan?limit=30",
        "http://localhost:8000/api/macro/pulse",
    ]
    for url in endpoints:
        try:
            urllib.request.urlopen(url, timeout=60)
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm cache in background thread — non-blocking
    t = threading.Thread(target=_warm_cache, daemon=True)
    t.start()
    yield


app = FastAPI(title="Stock Analysis Platform", version="3.0.0", lifespan=lifespan)

# CORS — allow local dev + all Vercel previews + any configured origin
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://stockai-pro.vercel.app",
]
for _env_key in ("FRONTEND_URL", "RENDER_EXTERNAL_URL", "VERCEL_URL"):
    _val = os.getenv(_env_key, "")
    if _val:
        if not _val.startswith("http"):
            _val = f"https://{_val}"
        if _val not in allowed_origins:
            allowed_origins.append(_val)

# On Vercel, the frontend and backend share the same origin — allow all
_on_vercel = bool(os.getenv("VERCEL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _on_vercel else allowed_origins,
    allow_credentials=not _on_vercel,
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
app.include_router(competitions.router)
app.include_router(global_markets.router)


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
