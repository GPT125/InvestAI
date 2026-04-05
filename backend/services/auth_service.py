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


def _send_verification_email(email: str, code: str, name: str = "") -> tuple:
    """Send an 8-digit verification code via SMTP. Returns (ok, error_message)."""
    from backend import config

    smtp_host = config.SMTP_HOST
    smtp_port = config.SMTP_PORT
    smtp_user = config.SMTP_USER
    smtp_pass = config.SMTP_PASS
    smtp_from = config.SMTP_FROM or smtp_user

    if not smtp_host or not smtp_user or not smtp_pass:
        # Dev mode — print code to console so you can test without SMTP
        print(f"[Auth] ⚠ SMTP not configured. Verification code for {email}: {code}")
        return False, "smtp_not_configured"

    display_name = name.strip() if name else email.split("@")[0]
    spaced_code = " ".join(list(code))  # "9 4 7 2 0 4 0 5"
    html_body = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2328;">
  <div style="max-width:560px;margin:40px auto;padding:32px 24px;text-align:center;">

    <div style="margin-bottom:20px;">
      <span style="display:inline-block;width:40px;height:40px;line-height:40px;border-radius:8px;background:#0d1117;color:#ffffff;font-size:22px;font-weight:800;">I</span>
    </div>

    <h1 style="font-size:22px;font-weight:600;color:#1f2328;margin:0 0 28px;">
      Please verify your identity, <strong>{display_name}</strong>
    </h1>

    <div style="border:1px solid #d0d7de;border-radius:10px;padding:28px 24px;text-align:left;">
      <p style="margin:0 0 18px;color:#1f2328;font-size:15px;">
        Here is your InvestAI email verification code:
      </p>

      <div style="text-align:center;margin:10px 0 24px;">
        <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:30px;font-weight:600;color:#1f2328;letter-spacing:4px;">{spaced_code}</span>
      </div>

      <p style="margin:0 0 16px;color:#1f2328;font-size:14px;">
        This code is valid for <strong>15 minutes</strong> and can only be used once.
      </p>

      <p style="margin:0 0 16px;color:#1f2328;font-size:14px;">
        <strong>Please don't share this code with anyone:</strong> we'll never ask for it on the phone or via email.
      </p>

      <p style="margin:0;color:#1f2328;font-size:14px;">
        Thanks,<br/>The InvestAI Team
      </p>
    </div>

    <p style="margin:24px 0 0;color:#656d76;font-size:12px;line-height:1.5;">
      You're receiving this email because a verification code was requested for your InvestAI account. If this wasn't you, please ignore this email.
    </p>

    <p style="margin:18px 0 0;color:#8c959f;font-size:12px;">
      InvestAI · AI-Powered Stock Analysis
    </p>
  </div>
</body>
</html>
"""
    text_body = (
        f"Please verify your identity, {display_name}\n\n"
        f"Here is your InvestAI email verification code:\n\n"
        f"    {spaced_code}\n\n"
        "This code is valid for 15 minutes and can only be used once.\n"
        "Please don't share this code with anyone — we'll never ask for it on the phone or via email.\n\n"
        "Thanks,\nThe InvestAI Team\n"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[InvestAI] Email verification code"
    msg["From"] = f"InvestAI <{smtp_from}>"
    msg["To"] = email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, email, msg.as_string())
        print(f"[Auth] Verification email sent to {email}")
        return True, ""
    except smtplib.SMTPAuthenticationError as e:
        err = f"smtp_auth_failed: {e}"
        print(f"[Auth] SMTP auth failed for {email}: {e}")
        return False, err
    except Exception as e:
        err = f"smtp_send_failed: {e}"
        print(f"[Auth] Failed to send email to {email}: {e}")
        return False, err


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
    """Generate a code, store it, send the email, return pending status.

    Behavior:
    - If SMTP is configured and send succeeds → email_sent=True.
    - If SMTP is NOT configured → email_sent=False, and dev_code is returned
      so the UI can surface the code (dev / test mode).
    - If SMTP IS configured but the send fails → email_sent=False with an
      error message so the user knows delivery failed.
    """
    from backend import config

    code = _generate_code()
    expires = time.time() + CODE_EXPIRY
    conn = _get_db()
    conn.execute(
        "INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)",
        (email, code, expires),
    )
    conn.commit()
    conn.close()

    sent, err = _send_verification_email(email, code, name)

    response = {
        "pending_verification": True,
        "email": email,
        "email_sent": sent,
    }

    smtp_configured = bool(config.SMTP_HOST and config.SMTP_USER and config.SMTP_PASS)

    if not sent:
        if not smtp_configured:
            # Dev / unconfigured — surface the code so the user can verify.
            # This only fires when SMTP env vars are not set; on production
            # you MUST set SMTP_HOST / SMTP_USER / SMTP_PASS in Render.
            response["dev_mode"] = True
            response["dev_code"] = code
            response["message"] = (
                "Email service is not configured. Showing code here for testing."
            )
        else:
            response["error_sending"] = (
                "We couldn't deliver the verification email. Please try again "
                "or contact support."
            )
            response["error_detail"] = err

    return response


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
            # Resend code and prompt verification — return the full response
            # shape (including dev_code / error_sending) so the UI can react.
            return _store_and_send_code(email, user["name"] or "")

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
