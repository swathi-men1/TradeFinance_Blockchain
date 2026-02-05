from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db.models import Notifications, UserProfiles
from api.modules.auth.routes import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class NotificationResponse(BaseModel):
    id: int
    message: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: UserProfiles = Depends(get_current_user)):
    return db.query(Notifications).filter(Notifications.user_id == current_user.id).order_by(Notifications.created_at.desc()).all()

@router.put("/{notif_id}/read")
def mark_as_read(notif_id: int, db: Session = Depends(get_db), current_user: UserProfiles = Depends(get_current_user)):
    notif = db.query(Notifications).filter(Notifications.id == notif_id, Notifications.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"status": "success"}
