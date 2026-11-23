from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.schemas.schemas import SubscriptionResponse, SubscriptionCreate, SubscriptionStatusUpdate
from backend.app.crud.crud import get_subscriptions, create_subscription, update_subscription_status

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("", response_model=List[SubscriptionResponse])
def read_subscriptions(customer_id: Optional[int] = None, db: Session = Depends(get_db)):
    return get_subscriptions(db, customer_id)

@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def start_subscription(sub_in: SubscriptionCreate, db: Session = Depends(get_db)):
    return create_subscription(db, sub_in)

@router.patch("/{sub_id}/status", response_model=SubscriptionResponse)
def change_subscription_status(sub_id: int, status_update: SubscriptionStatusUpdate, db: Session = Depends(get_db)):
    sub = update_subscription_status(db, sub_id, status_update.status)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub
