import os
import json
import time
import uuid
from typing import Optional, List, Dict

_DEFAULT_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'chats')
DATA_DIR = os.path.join(os.getenv('DATA_DIR', os.path.join(os.path.dirname(__file__), '..', '..', 'data')), 'chats')


def _user_dir(user_id: int) -> str:
    d = os.path.join(DATA_DIR, str(user_id))
    os.makedirs(d, exist_ok=True)
    return d


def _load_conversations(user_id: int) -> List[dict]:
    index_path = os.path.join(_user_dir(user_id), "index.json")
    if os.path.exists(index_path):
        with open(index_path) as f:
            return json.load(f)
    return []


def _save_index(user_id: int, convos: List[dict]):
    index_path = os.path.join(_user_dir(user_id), "index.json")
    with open(index_path, "w") as f:
        json.dump(convos, f)


def _load_messages(user_id: int, convo_id: str) -> List[dict]:
    path = os.path.join(_user_dir(user_id), f"{convo_id}.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return []


def _save_messages(user_id: int, convo_id: str, messages: List[dict]):
    path = os.path.join(_user_dir(user_id), f"{convo_id}.json")
    with open(path, "w") as f:
        json.dump(messages, f)


def get_conversations(user_id: int) -> List[dict]:
    """Get all conversations for a user (metadata only, sorted by most recent)."""
    convos = _load_conversations(user_id)
    return sorted(convos, key=lambda c: c.get("updatedAt", 0), reverse=True)


def create_conversation(user_id: int, title: str = "New Chat") -> dict:
    convos = _load_conversations(user_id)
    convo = {
        "id": str(uuid.uuid4())[:8],
        "title": title,
        "createdAt": time.time(),
        "updatedAt": time.time(),
        "messageCount": 0,
    }
    convos.append(convo)
    _save_index(user_id, convos)
    _save_messages(user_id, convo["id"], [])
    return convo


def get_messages(user_id: int, convo_id: str) -> List[dict]:
    return _load_messages(user_id, convo_id)


def add_message(user_id: int, convo_id: str, role: str, content: str) -> dict:
    messages = _load_messages(user_id, convo_id)
    msg = {"role": role, "content": content, "timestamp": time.time()}
    messages.append(msg)
    _save_messages(user_id, convo_id, messages)

    # Update index
    convos = _load_conversations(user_id)
    for c in convos:
        if c["id"] == convo_id:
            c["updatedAt"] = time.time()
            c["messageCount"] = len(messages)
            # Auto-title from first user message
            if c["title"] == "New Chat" and role == "user":
                c["title"] = content[:50] + ("..." if len(content) > 50 else "")
            break
    _save_index(user_id, convos)
    return msg


def rename_conversation(user_id: int, convo_id: str, title: str) -> dict:
    convos = _load_conversations(user_id)
    for c in convos:
        if c["id"] == convo_id:
            c["title"] = title
            _save_index(user_id, convos)
            return c
    return {"error": "Not found"}


def delete_conversation(user_id: int, convo_id: str) -> dict:
    convos = _load_conversations(user_id)
    convos = [c for c in convos if c["id"] != convo_id]
    _save_index(user_id, convos)
    # Delete messages file
    path = os.path.join(_user_dir(user_id), f"{convo_id}.json")
    if os.path.exists(path):
        os.remove(path)
    return {"success": True}
