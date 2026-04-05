"""Competition service — virtual stock trading competitions."""
import os
import json
import sqlite3
import uuid
import time
from typing import Optional, List, Dict
import yfinance as yf

_DEFAULT_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
_DATA_DIR = os.getenv('DATA_DIR', _DEFAULT_DATA_DIR)
DB_PATH = os.path.join(_DATA_DIR, 'users.db')


def _get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Create competitions table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS competitions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            starting_budget REAL DEFAULT 10000,
            duration_days INTEGER DEFAULT 30,
            include_ai INTEGER DEFAULT 0,
            start_date REAL,
            end_date REAL,
            created_at REAL DEFAULT (strftime('%s','now'))
        )
    """)
    # Create participants table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS competition_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competition_id TEXT NOT NULL,
            user_id INTEGER,
            is_ai INTEGER DEFAULT 0,
            display_name TEXT,
            cash REAL,
            holdings TEXT DEFAULT '[]',
            portfolio_value REAL,
            return_pct REAL DEFAULT 0,
            last_updated REAL DEFAULT (strftime('%s','now')),
            UNIQUE(competition_id, user_id)
        )
    """)
    # Create trades table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS competition_trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competition_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            shares REAL NOT NULL,
            price REAL NOT NULL,
            action TEXT NOT NULL,
            executed_at REAL DEFAULT (strftime('%s','now'))
        )
    """)
    conn.commit()
    return conn


def _get_user_display_name(conn, user_id: int) -> str:
    row = conn.execute("SELECT name, email FROM users WHERE id=?", (user_id,)).fetchone()
    if row:
        return row["name"] or row["email"].split("@")[0]
    return f"Player {user_id}"


def _get_current_price(ticker: str) -> Optional[float]:
    try:
        t = yf.Ticker(ticker)
        info = t.fast_info
        return float(info.last_price or 0) or None
    except Exception:
        return None


def _update_portfolio_value(conn, comp_id: str, user_id: int, is_ai: bool = False):
    """Recalculate portfolio value based on current market prices."""
    row = conn.execute(
        "SELECT cash, holdings FROM competition_participants WHERE competition_id=? AND user_id=?",
        (comp_id, user_id)
    ).fetchone()
    if not row:
        return

    cash = row["cash"] or 0
    holdings = json.loads(row["holdings"] or "[]")

    total_stock_value = 0
    for h in holdings:
        price = _get_current_price(h["ticker"])
        if price:
            h["current_price"] = price
            h["current_value"] = price * h["shares"]
            h["gain_pct"] = ((price - h["avg_price"]) / h["avg_price"] * 100) if h["avg_price"] else 0
            total_stock_value += h["current_value"]

    total_value = cash + total_stock_value
    comp_row = conn.execute(
        "SELECT starting_budget FROM competitions WHERE id=?", (comp_id,)
    ).fetchone()
    starting_budget = comp_row["starting_budget"] if comp_row else 10000
    return_pct = ((total_value - starting_budget) / starting_budget * 100) if starting_budget else 0

    conn.execute(
        "UPDATE competition_participants SET cash=?, holdings=?, portfolio_value=?, return_pct=?, last_updated=? WHERE competition_id=? AND user_id=?",
        (cash, json.dumps(holdings), total_value, return_pct, time.time(), comp_id, user_id)
    )
    conn.commit()


def _format_comp(conn, row) -> Dict:
    """Format competition row with participants."""
    comp = dict(row)
    participants_rows = conn.execute(
        "SELECT * FROM competition_participants WHERE competition_id=?", (row["id"],)
    ).fetchall()

    participants = []
    for p in participants_rows:
        participants.append({
            "user_id": p["user_id"],
            "is_ai": bool(p["is_ai"]),
            "display_name": p["display_name"] or ("AI Bot" if p["is_ai"] else f"Player {p['user_id']}"),
            "cash": p["cash"],
            "holdings": json.loads(p["holdings"] or "[]"),
            "portfolio_value": p["portfolio_value"] or 0,
            "return_pct": p["return_pct"] or 0,
        })

    comp["participants"] = sorted(participants, key=lambda x: x["portfolio_value"], reverse=True)
    return comp


def create_competition(user_id: int, name: str, duration_days: int, starting_budget: float, include_ai: bool) -> Dict:
    comp_id = str(uuid.uuid4())[:8]
    conn = _get_db()
    display_name = _get_user_display_name(conn, user_id)

    conn.execute(
        "INSERT INTO competitions (id, name, created_by, duration_days, starting_budget, include_ai) VALUES (?,?,?,?,?,?)",
        (comp_id, name, user_id, duration_days, starting_budget, 1 if include_ai else 0)
    )
    # Add creator as participant
    conn.execute(
        "INSERT INTO competition_participants (competition_id, user_id, display_name, cash, portfolio_value) VALUES (?,?,?,?,?)",
        (comp_id, user_id, display_name, starting_budget, starting_budget)
    )
    # Add AI participant if requested
    if include_ai:
        conn.execute(
            "INSERT INTO competition_participants (competition_id, user_id, is_ai, display_name, cash, portfolio_value) VALUES (?,?,1,'AI Bot',?,?)",
            (comp_id, -1, starting_budget, starting_budget)
        )
    conn.commit()

    comp = conn.execute("SELECT * FROM competitions WHERE id=?", (comp_id,)).fetchone()
    result = _format_comp(conn, comp)
    conn.close()
    return result


def get_competitions(user_id: Optional[int] = None) -> List[Dict]:
    conn = _get_db()
    rows = conn.execute("SELECT * FROM competitions ORDER BY created_at DESC").fetchall()
    result = [_format_comp(conn, r) for r in rows]
    conn.close()
    return result


def get_competition(comp_id: str) -> Optional[Dict]:
    conn = _get_db()
    row = conn.execute("SELECT * FROM competitions WHERE id=?", (comp_id,)).fetchone()
    if not row:
        conn.close()
        return None
    result = _format_comp(conn, row)
    conn.close()
    return result


def join_competition(comp_id: str, user_id: int) -> Dict:
    conn = _get_db()
    comp = conn.execute("SELECT * FROM competitions WHERE id=?", (comp_id,)).fetchone()
    if not comp:
        conn.close()
        raise ValueError("Competition not found")
    if comp["status"] == "ended":
        conn.close()
        raise ValueError("Competition has ended")

    existing = conn.execute(
        "SELECT id FROM competition_participants WHERE competition_id=? AND user_id=?",
        (comp_id, user_id)
    ).fetchone()
    if existing:
        conn.close()
        return get_competition(comp_id)

    display_name = _get_user_display_name(conn, user_id)
    budget = comp["starting_budget"]
    conn.execute(
        "INSERT INTO competition_participants (competition_id, user_id, display_name, cash, portfolio_value) VALUES (?,?,?,?,?)",
        (comp_id, user_id, display_name, budget, budget)
    )
    conn.commit()
    result = _format_comp(conn, conn.execute("SELECT * FROM competitions WHERE id=?", (comp_id,)).fetchone())
    conn.close()
    return result


def start_competition(comp_id: str, user_id: int) -> Dict:
    conn = _get_db()
    comp = conn.execute("SELECT * FROM competitions WHERE id=?", (comp_id,)).fetchone()
    if not comp:
        conn.close()
        raise ValueError("Competition not found")
    if comp["created_by"] != user_id:
        conn.close()
        raise PermissionError("Only the creator can start the competition")

    start = time.time()
    end = start + comp["duration_days"] * 86400
    conn.execute(
        "UPDATE competitions SET status='active', start_date=?, end_date=? WHERE id=?",
        (start, end, comp_id)
    )
    conn.commit()
    result = _format_comp(conn, conn.execute("SELECT * FROM competitions WHERE id=?", (comp_id,)).fetchone())
    conn.close()
    return result


def execute_trade(comp_id: str, user_id: int, ticker: str, shares: float, action: str) -> Dict:
    conn = _get_db()
    comp = conn.execute("SELECT * FROM competitions WHERE id=?", (comp_id,)).fetchone()
    if not comp:
        conn.close()
        raise ValueError("Competition not found")
    if comp["status"] != "active":
        conn.close()
        raise ValueError("Competition is not active")

    participant = conn.execute(
        "SELECT * FROM competition_participants WHERE competition_id=? AND user_id=?",
        (comp_id, user_id)
    ).fetchone()
    if not participant:
        conn.close()
        raise ValueError("You are not in this competition")

    price = _get_current_price(ticker.upper())
    if not price:
        conn.close()
        raise ValueError(f"Could not get price for {ticker}")

    cash = participant["cash"] or 0
    holdings = json.loads(participant["holdings"] or "[]")
    ticker = ticker.upper()

    if action == "buy":
        cost = price * shares
        if cost > cash:
            conn.close()
            raise ValueError(f"Insufficient funds. Need ${cost:.2f}, have ${cash:.2f}")
        cash -= cost
        existing = next((h for h in holdings if h["ticker"] == ticker), None)
        if existing:
            total_shares = existing["shares"] + shares
            existing["avg_price"] = (existing["avg_price"] * existing["shares"] + price * shares) / total_shares
            existing["shares"] = total_shares
        else:
            holdings.append({"ticker": ticker, "shares": shares, "avg_price": price})

    elif action == "sell":
        existing = next((h for h in holdings if h["ticker"] == ticker), None)
        if not existing or existing["shares"] < shares:
            conn.close()
            raise ValueError(f"You don't have enough shares of {ticker}")
        cash += price * shares
        existing["shares"] -= shares
        if existing["shares"] <= 0:
            holdings = [h for h in holdings if h["ticker"] != ticker]

    conn.execute(
        "UPDATE competition_participants SET cash=?, holdings=? WHERE competition_id=? AND user_id=?",
        (cash, json.dumps(holdings), comp_id, user_id)
    )
    conn.execute(
        "INSERT INTO competition_trades (competition_id, user_id, ticker, shares, price, action) VALUES (?,?,?,?,?,?)",
        (comp_id, user_id, ticker, shares, price, action)
    )
    conn.commit()

    _update_portfolio_value(conn, comp_id, user_id)
    result = _format_comp(conn, conn.execute("SELECT * FROM competitions WHERE id=?", (comp_id,)).fetchone())
    conn.close()
    return result
