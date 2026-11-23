from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.schemas.schemas import MilkingBatchResponse, MilkingBatchCreate
from backend.app.crud.crud import get_milking_batches, get_batch_by_code, create_milking_batch

router = APIRouter(prefix="/batches", tags=["Milking Batches & Traceability"])

@router.get("", response_model=List[MilkingBatchResponse])
def read_batches(limit: int = 50, db: Session = Depends(get_db)):
    return get_milking_batches(db, limit)

@router.get("/trace/{batch_code}", response_model=MilkingBatchResponse)
def trace_batch(batch_code: str, db: Session = Depends(get_db)):
    batch = get_batch_by_code(db, batch_code)
    if not batch:
        raise HTTPException(
            status_code=404, 
            detail=f"Milking batch '{batch_code}' not found in farm traceability records."
        )
    return batch

@router.post("", response_model=MilkingBatchResponse, status_code=status.HTTP_201_CREATED)
def record_batch(batch_in: MilkingBatchCreate, db: Session = Depends(get_db)):
    return create_milking_batch(db, batch_in)
