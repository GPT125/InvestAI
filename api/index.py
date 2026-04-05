"""
Vercel Serverless entry point for the StockAI FastAPI backend.
Vercel routes all /api/* requests here via vercel.json rewrites.
"""
import sys
import os

# Put the project root on sys.path so `backend` is importable
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

# On Vercel, /tmp is the only writable directory
if os.getenv("VERCEL"):
    os.environ.setdefault("DATA_DIR", "/tmp/stockai-data")

# Import the FastAPI app — Vercel calls it via the ASGI handler
from backend.main import app  # noqa: F401, E402
