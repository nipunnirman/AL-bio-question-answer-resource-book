from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List

from ..core.db import get_database
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/api/study", tags=["study"])


# ── Models ──────────────────────────────────────────────

class StudySessionCreate(BaseModel):
    subject: str           # "Biology" | "Chemistry" | "Physics" | "Combined Maths"
    start_time: str        # ISO timestamp string
    end_time: str          # ISO timestamp string
    duration_minutes: int  # study time only (no breaks)
    date: str              # YYYY-MM-DD


class SessionOut(BaseModel):
    subject: str
    start_time: str
    end_time: str
    duration_minutes: int
    date: str


# ── Endpoints ────────────────────────────────────────────

@router.post("/session", status_code=status.HTTP_201_CREATED)
async def save_session(session: StudySessionCreate, current_user: dict = Depends(get_current_user)):
    """Save a completed study session for the authenticated user."""
    db = get_database()
    session_data = {
        "user_id": str(current_user["_id"]),
        "subject": session.subject,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "duration_minutes": session.duration_minutes,
        "date": session.date,
        "created_at": datetime.utcnow()
    }
    await db["study_sessions"].insert_one(session_data)
    return {"status": "success", "message": "Study session saved"}


@router.get("/sessions/today", response_model=List[SessionOut])
async def get_today_sessions(current_user: dict = Depends(get_current_user)):
    """Return all study sessions for today for the current user."""
    db = get_database()
    today = datetime.utcnow().date().isoformat()
    cursor = db["study_sessions"].find(
        {"user_id": str(current_user["_id"]), "date": today},
        {"_id": 0, "user_id": 0, "created_at": 0}
    ).sort("start_time", 1)
    sessions = await cursor.to_list(length=50)
    return sessions


@router.get("/weekly")
async def get_weekly_stats(current_user: dict = Depends(get_current_user)):
    """Return per-day, per-subject study totals for the last 7 days."""
    db = get_database()
    user_id = str(current_user["_id"])
    today = datetime.utcnow().date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]

    pipeline = [
        {"$match": {"user_id": user_id, "date": {"$in": dates}}},
        {"$group": {
            "_id": {"date": "$date", "subject": "$subject"},
            "total_minutes": {"$sum": "$duration_minutes"}
        }}
    ]
    results = await db["study_sessions"].aggregate(pipeline).to_list(length=200)

    # Build nested: { date -> { subject -> minutes } }
    stats: dict = {d: {} for d in dates}
    for r in results:
        d = r["_id"]["date"]
        s = r["_id"]["subject"]
        stats[d][s] = r["total_minutes"]

    # Return as list of { date, subjects: { Biology: N, Chemistry: N, ... } }
    return [{"date": d, "subjects": stats[d]} for d in dates]
