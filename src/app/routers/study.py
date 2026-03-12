from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List

from ..core.db import get_database
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/api/study", tags=["study"])

class StudySessionCreate(BaseModel):
    duration_minutes: int
    date: str  # ISO format YYYY-MM-DD

class DailyStudyStat(BaseModel):
    date: str
    total_minutes: int

@router.post("/session", status_code=status.HTTP_201_CREATED)
async def save_session(session: StudySessionCreate, current_user: dict = Depends(get_current_user)):
    """Save a completed study session for the authenticated user."""
    db = get_database()
    
    # Store session record
    session_data = {
        "user_id": str(current_user["_id"]),
        "duration_minutes": session.duration_minutes,
        "date": session.date,
        "created_at": datetime.utcnow()
    }
    
    await db["study_sessions"].insert_one(session_data)
    return {"status": "success", "message": "Study session saved"}

@router.get("/weekly", response_model=List[DailyStudyStat])
async def get_weekly_stats(current_user: dict = Depends(get_current_user)):
    """Get the sum of study minutes per day for the last 7 days."""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Generate the last 7 days
    today = datetime.utcnow().date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(7)]
    dates.reverse() # Oldest to newest
    
    # Initialize dictionary with 0 minutes for all 7 days
    stats_dict = {d: 0 for d in dates}
    
    # Aggregate from MongoDB
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "date": {"$in": dates}
        }},
        {"$group": {
            "_id": "$date",
            "total_minutes": {"$sum": "$duration_minutes"}
        }}
    ]
    
    results = await db["study_sessions"].aggregate(pipeline).to_list(length=7)
    
    # Merge results
    for r in results:
        stats_dict[r["_id"]] = r["total_minutes"]
        
    # Return sorted list
    return [DailyStudyStat(date=d, total_minutes=m) for d, m in stats_dict.items()]
