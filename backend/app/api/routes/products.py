from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.schemas.schemas import ProductResponse, ProductCreate, ProductUpdate
from backend.app.crud.crud import get_products, get_product_by_id, create_product, update_product, delete_product

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[ProductResponse])
def read_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    return get_products(db, category)

@router.get("/{product_id}", response_model=ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    return create_product(db, product_in)

@router.put("/{product_id}", response_model=ProductResponse)
def modify_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    updated = update_product(db, product_id, product_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_product(product_id: int, db: Session = Depends(get_db)):
    success = delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return None
