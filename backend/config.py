import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
FINNHUB_WEBHOOK_SECRET = os.getenv("FINNHUB_WEBHOOK_SECRET", "")
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")
FMP_API_KEY = os.getenv("FMP_API_KEY", "")
EOD_API_KEY = os.getenv("EOD_API_KEY", "")
FRED_API_KEY = os.getenv("FRED_API_KEY", "")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
MARKETAUX_API_KEY = os.getenv("MARKETAUX_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")

# Cache TTLs in seconds
CACHE_TTL_STOCK_INFO = 900
CACHE_TTL_PRICE_HISTORY = 300
CACHE_TTL_MARKET = 300
CACHE_TTL_SCORING = 1800
CACHE_TTL_NEWS = 3600
CACHE_TTL_AI_ANALYSIS = 7200
CACHE_TTL_FINANCIALS = 3600
CACHE_TTL_MACRO = 7200
