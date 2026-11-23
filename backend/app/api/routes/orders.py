from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.schemas.schemas import OrderResponse, OrderCreate, OrderStatusUpdate
from backend.app.crud.crud import get_orders, create_order, update_order_status

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("", response_model=List[OrderResponse])
def read_orders(customer_id: Optional[int] = None, db: Session = Depends(get_db)):
    return get_orders(db, customer_id)

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    return create_order(db, order_in)

@router.patch("/{order_id}/status", response_model=OrderResponse)
def change_order_status(order_id: int, status_update: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = update_order_status(db, order_id, status_update.order_status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
