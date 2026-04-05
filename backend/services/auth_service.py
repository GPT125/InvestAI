import os
import json
import random
import sqlite3
import smtplib
import bcrypt
import jwt
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict

_DEFAULT_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
_DATA_DIR = os.getenv('DATA_DIR', _DEFAULT_DATA_DIR)
DB_PATH = os.path.join(_DATA_DIR, 'users.db')
JWT_SECRET = os.getenv("JWT_SECRET", "stockai_secret_key_change_in_production")
JWT_EXPIRY = 86400 * 7  # 7 days
CODE_EXPIRY = 900  # 15 minutes


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
            email_verified INTEGER DEFAULT 0,
            created_at REAL DEFAULT (strftime('%s','now')),
            settings TEXT DEFAULT '{}'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS verification_codes (
            email TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            expires_at REAL NOT NULL
        )
    """)
    # Migrate: add email_verified column if missing (existing DBs)
    try:
        conn.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0")
        conn.commit()
    except Exception:
        pass
    conn.commit()
    return conn


def _generate_code() -> str:
    """Generate an 8-digit verification code."""
    return str(random.randint(10000000, 99999999))


def _send_verification_email(email: str, code: str, name: str = "") -> bool:
    """Send an 8-digit verification code to the user's email via SMTP."""
    from backend import config

    smtp_host = config.SMTP_HOST
    smtp_port = config.SMTP_PORT
    smtp_user = config.SMTP_USER
    smtp_pass = config.SMTP_PASS
    smtp_from = config.SMTP_FROM or smtp_user

    if not smtp_host or not smtp_user or not smtp_pass:
        # Dev mode — print code to console so you can test without SMTP
        print(f"[Auth] ⚠ SMTP not configured. Verification code for {email}: {code}")
        return False

    greeting = f"Hi {name}," if name else "Hi,"
    html_body = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a14;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#13132a;border:1px solid #2a2a4a;border-radius:14px;padding:36px;">
    <div style="margin-bottom:24px;">
      <span style="font-size:22px;font-weight:700;color:#7c8cf8;">📈 InvestAI</span>
    </div>
    <h2 style="color:#e0e0e0;margin:0 0 8px;">Verify Your Email</h2>
    <p style="color:#888;margin:0 0 28px;font-size:15px;">{greeting} Thanks for signing up — enter the code below to activate your account.</p>

    <div style="background:#0f0f1a;border:1px solid #2a2a4a;border-radius:10px;padding:28px;text-align:center;margin-bottom:28px;">
      <p style="color:#888;font-size:13px;margin:0 0 12px;">Your verification code</p>
      <span style="font-size:42px;font-weight:700;letter-spacing:10px;color:#7c8cf8;font-family:monospace;">{code}</span>
      <p style="color:#666;font-size:12px;margin:12px 0 0;">Expires in 15 minutes</p>
    </div>

    <p style="color:#666;font-size:13px;margin:0;">If you didn't create a InvestAI account, you can safely ignore this email.</p>
  </div>
</body>
</html>
"""
    text_body = f"Your InvestAI verification code is: {code}\n\nThis code expires in 15 minutes."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"InvestAI — Your verification code: {code}"
    msg["From"] = f"InvestAI <{smtp_from}>"
    msg["To"] = email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, email, msg.as_string())
        print(f"[Auth] Verification email sent to {email}")
        return True
    except Exception as e:
        print(f"[Auth] Failed to send email to {email}: {e}")
        return False


def register(email: str, password: str, name: str = "") -> Dict:
    email = email.strip().lower()
    if not email or "@" not in email:
        return {"error": "Invalid email address"}
    if len(password) < 6:
        return {"error": "Password must be at least 6 characters"}

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        conn = _get_db()
        # Check if email already exists and is verified
        existing = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if existing and existing["email_verified"]:
            conn.close()
            return {"error": "An account with this email already exists"}
        if existing and not existing["email_verified"]:
            # Account exists but unverified — resend code
            conn.close()
            return _store_and_send_code(email, name)

        conn.execute(
            "INSERT INTO users (email, password_hash, name, email_verified) VALUES (?, ?, ?, 0)",
            (email, pw_hash, name),
        )
        conn.commit()
        conn.close()
        return _store_and_send_code(email, name)
    except sqlite3.IntegrityError:
        return {"error": "An account with this email already exists"}
    except Exception as e:
        return {"error": str(e)}


def _store_and_send_code(email: str, name: str = "") -> Dict:
    """Generate a code, store it, send the email, return pending status."""
    code = _generate_code()
    expires = time.time() + CODE_EXPIRY
    conn = _get_db()
    conn.execute(
        "INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)",
        (email, code, expires),
    )
    conn.commit()
    conn.close()
    sent = _send_verification_email(email, code, name)
    return {
        "pending_verification": True,
        "email": email,
        "email_sent": sent,
    }


def verify_email(email: str, code: str) -> Dict:
    """Validate the 8-digit code and activate the account."""
    email = email.strip().lower()
    try:
        conn = _get_db()
        row = conn.execute(
            "SELECT * FROM verification_codes WHERE email = ?", (email,)
        ).fetchone()

        if not row:
            conn.close()
            return {"error": "No verification code found. Please register again."}

        if time.time() > row["expires_at"]:
            conn.execute("DELETE FROM verification_codes WHERE email = ?", (email,))
            conn.commit()
            conn.close()
            return {"error": "Verification code has expired. Please request a new one."}

        if row["code"] != code.strip():
            conn.close()
            return {"error": "Incorrect verification code. Please try again."}

        # Mark user as verified
        conn.execute("UPDATE users SET email_verified = 1 WHERE email = ?", (email,))
        conn.execute("DELETE FROM verification_codes WHERE email = ?", (email,))
        conn.commit()

        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()

        if not user:
            return {"error": "Account not found"}

        token = _create_token(user["id"], user["email"])
        return {
            "token": token,
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
        }
    except Exception as e:
        return {"error": str(e)}


def resend_verification(email: str) -> Dict:
    """Resend verification code to an unverified email."""
    email = email.strip().lower()
    try:
        conn = _get_db()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()
        if not user:
            return {"error": "No account found with this email"}
        if user["email_verified"]:
            return {"error": "This email is already verified"}
        return _store_and_send_code(email, user["name"] or "")
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

        if not user["email_verified"]:
            # Resend code and prompt verification
            _store_and_send_code(email, user["name"] or "")
            return {
                "pending_verification": True,
                "email": email,
                "email_sent": True,
            }

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
    """Verify Google OAuth token and create/login user. Google users skip email verification."""
    from backend import config
    try:
        import requests as req
        resp = req.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}", timeout=10)
        if resp.status_code != 200:
            return {"error": "Invalid Google token"}
        payload = resp.json()

        email = payload.get("email", "").lower()
        name = payload.get("name", "")

        if not email:
            return {"error": "No email in Google token"}

        if config.GOOGLE_CLIENT_ID and payload.get("aud") != config.GOOGLE_CLIENT_ID:
            return {"error": "Invalid client ID"}

        conn = _get_db()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if user:
            # Existing user — ensure marked verified
            if not user["email_verified"]:
                conn.execute("UPDATE users SET email_verified = 1 WHERE email = ?", (email,))
                conn.commit()
            conn.close()
            user = _get_db().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            token = _create_token(user["id"], user["email"])
            settings = json.loads(user["settings"]) if user["settings"] else {}
            return {
                "token": token,
                "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
                "settings": settings,
            }
        else:
            import secrets
            pw_hash = bcrypt.hashpw(secrets.token_hex(32).encode(), bcrypt.gensalt()).decode()
            conn.execute(
                "INSERT INTO users (email, password_hash, name, email_verified) VALUES (?, ?, ?, 1)",
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
