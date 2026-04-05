"""Competitions router — virtual stock trading competitions."""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from backend.services import competition_service, auth_service

router = APIRouter(prefix="/api/competitions", tags=["competitions"])


def _get_user(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1]
    return auth_service.get_user(token)


@router.get("")
def list_competitions(request: Request):
    user = _get_user(request)
    comps = competition_service.get_competitions(user["id"] if user else None)
    return comps


@router.post("")
def create_competition(request: Request, data: dict):
    user = _get_user(request)
    if not user:
        return JSONResponse({"detail": "Authentication required"}, status_code=401)
    try:
        comp = competition_service.create_competition(
            user_id=user["id"],
            name=data.get("name", "My Competition"),
            duration_days=data.get("duration_days", 30),
            starting_budget=float(data.get("starting_budget", 10000)),
            include_ai=bool(data.get("include_ai", False)),
            is_private=bool(data.get("is_private", False)),
        )
        return comp
    except Exception as e:
        return JSONResponse({"detail": str(e)}, status_code=400)


@router.get("/{comp_id}")
def get_competition(comp_id: str, request: Request):
    comp = competition_service.get_competition(comp_id)
    if not comp:
        return JSONResponse({"detail": "Competition not found"}, status_code=404)
    return comp


@router.post("/{comp_id}/join")
def join_competition(comp_id: str, request: Request):
    user = _get_user(request)
    if not user:
        return JSONResponse({"detail": "Authentication required"}, status_code=401)
    try:
        comp = competition_service.join_competition(comp_id, user["id"])
        return comp
    except ValueError as e:
        return JSONResponse({"detail": str(e)}, status_code=400)


@router.post("/{comp_id}/start")
def start_competition(comp_id: str, request: Request):
    user = _get_user(request)
    if not user:
        return JSONResponse({"detail": "Authentication required"}, status_code=401)
    try:
        comp = competition_service.start_competition(comp_id, user["id"])
        return comp
    except (ValueError, PermissionError) as e:
        return JSONResponse({"detail": str(e)}, status_code=400)


@router.post("/{comp_id}/trade")
def trade(comp_id: str, request: Request, data: dict):
    user = _get_user(request)
    if not user:
        return JSONResponse({"detail": "Authentication required"}, status_code=401)
    try:
        result = competition_service.execute_trade(
            comp_id=comp_id,
            user_id=user["id"],
            ticker=data.get("ticker", ""),
            shares=float(data.get("shares", 0)),
            action=data.get("action", "buy"),
        )
        return result
    except ValueError as e:
        return JSONResponse({"detail": str(e)}, status_code=400)
