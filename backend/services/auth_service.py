import os
import json
import sqlite3
import bcrypt
import jwt
import time
from typing import Optional, Dict

_DEFAULT_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
_DATA_DIR = os.getenv('DATA_DIR', _DEFAULT_DATA_DIR)
DB_PATH = os.path.join(_DATA_DIR, 'users.db')
JWT_SECRET = os.getenv("JWT_SECRET", "stockai_secret_key_change_in_production")
JWT_EXPIRY = 86400 * 7  # 7 days


def _get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT DEFAULT '',
            created_at REAL DEFAULT (strftime('%s','now')),
            settings TEXT DEFAULT '{}'
        )
    """)
    conn.commit()
    return conn


def register(email: str, password: str, name: str = "") -> Dict:
    email = email.strip().lower()
    if not email or "@" not in email:
        return {"error": "Invalid email address"}
    if len(password) < 6:
        return {"error": "Password must be at least 6 characters"}

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        conn = _get_db()
        conn.execute(
            "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
            (email, pw_hash, name),
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()
        token = _create_token(user["id"], user["email"])
        return {
            "token": token,
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
        }
    except sqlite3.IntegrityError:
        return {"error": "An account with this email already exists"}
    except Exception as e:
        return {"error": str(e)}


def login(email: str, password: str) -> Dict:
    email = email.strip().lower()
    try:
        conn = _get_db()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()

        if not user:
            return {"error": "Invalid email or password"}

        if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
            return {"error": "Invalid email or password"}

        token = _create_token(user["id"], user["email"])
        settings = json.loads(user["settings"]) if user["settings"] else {}
        return {
            "token": token,
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
            "settings": settings,
        }
    except Exception as e:
        return {"error": str(e)}


def get_user(token: str) -> Optional[Dict]:
    payload = _verify_token(token)
    if not payload:
        return None
    try:
        conn = _get_db()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (payload["uid"],)).fetchone()
        conn.close()
        if not user:
            return None
        settings = json.loads(user["settings"]) if user["settings"] else {}
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "settings": settings,
        }
    except Exception:
        return None


def update_settings(token: str, settings: dict) -> Dict:
    payload = _verify_token(token)
    if not payload:
        return {"error": "Not authenticated"}
    try:
        conn = _get_db()
        conn.execute(
            "UPDATE users SET settings = ? WHERE id = ?",
            (json.dumps(settings), payload["uid"]),
        )
        conn.commit()
        conn.close()
        return {"success": True, "settings": settings}
    except Exception as e:
        return {"error": str(e)}


def update_profile(token: str, name: str = None) -> Dict:
    payload = _verify_token(token)
    if not payload:
        return {"error": "Not authenticated"}
    try:
        conn = _get_db()
        if name is not None:
            conn.execute("UPDATE users SET name = ? WHERE id = ?", (name, payload["uid"]))
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}


def google_login(credential: str) -> Dict:
    """Verify Google OAuth token and create/login user."""
    from backend import config
    try:
        import requests as req
        # Verify the Google token via Google's tokeninfo endpoint
        resp = req.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}", timeout=10)
        if resp.status_code != 200:
            return {"error": "Invalid Google token"}
        payload = resp.json()

        email = payload.get("email", "").lower()
        name = payload.get("name", "")

        if not email:
            return {"error": "No email in Google token"}

        # Check if Google Client ID matches (if configured)
        if config.GOOGLE_CLIENT_ID and payload.get("aud") != config.GOOGLE_CLIENT_ID:
            return {"error": "Invalid client ID"}

        # Try to find existing user
        conn = _get_db()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if user:
            # Existing user — log them in
            conn.close()
            token = _create_token(user["id"], user["email"])
            settings = json.loads(user["settings"]) if user["settings"] else {}
            return {
                "token": token,
                "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
                "settings": settings,
            }
        else:
            # New user — register with a random password (they'll use Google to login)
            import secrets
            pw_hash = bcrypt.hashpw(secrets.token_hex(32).encode(), bcrypt.gensalt()).decode()
            conn.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
                (email, pw_hash, name),
            )
            conn.commit()
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            conn.close()
            token = _create_token(user["id"], user["email"])
            return {
                "token": token,
                "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
            }
    except Exception as e:
        return {"error": f"Google login failed: {str(e)}"}


def _create_token(user_id: int, email: str) -> str:
    return jwt.encode(
        {"uid": user_id, "email": email, "exp": time.time() + JWT_EXPIRY},
        JWT_SECRET,
        algorithm="HS256",
    )


def _verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None
