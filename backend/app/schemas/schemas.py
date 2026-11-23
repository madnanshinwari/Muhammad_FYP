from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "customer"
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    bottle_credit_balance: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Product Schemas
class ProductBase(BaseModel):
    name_en: str
    name_ur: str
    category: str
    description_en: Optional[str] = None
    description_ur: Optional[str] = None
    fat_percentage: Optional[float] = None
    snf_percentage: Optional[float] = None
    base_price: float
    unit_type: str
    available_units: str # JSON array
    stock_quantity: float
    image_url: Optional[str] = None
    is_fresh_batch: Optional[int] = 1
    is_organic: Optional[int] = 1

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ur: Optional[str] = None
    category: Optional[str] = None
    description_en: Optional[str] = None
    description_ur: Optional[str] = None
    fat_percentage: Optional[float] = None
    snf_percentage: Optional[float] = None
    base_price: Optional[float] = None
    stock_quantity: Optional[float] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Milking Batch Schemas
class MilkingBatchBase(BaseModel):
    livestock_tag: str
    animal_type: str
    session: str
    yield_liters: float
    fat_percentage: float
    snf_percentage: float
    chiller_temp_c: float
    milking_time: str
    status: Optional[str] = "Approved & Packed"
    recorded_by: Optional[str] = "Dr. Arshad (Vet Officer)"

class MilkingBatchCreate(MilkingBatchBase):
    batch_code: Optional[str] = None

class MilkingBatchResponse(MilkingBatchBase):
    id: int
    batch_code: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Order Schemas
class OrderItem(BaseModel):
    productId: int
    name: str
    unit: str
    qty: int
    price: float

class OrderCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: str
    delivery_address: str
    delivery_slot: str
    total_amount: float
    bottle_deposit: Optional[float] = 0.0
    payment_method: str
    order_notes: Optional[str] = None
    items: List[OrderItem]

class OrderStatusUpdate(BaseModel):
    order_status: str

class OrderResponse(BaseModel):
    id: int
    order_code: str
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: str
    delivery_address: str
    delivery_slot: str
    total_amount: float
    bottle_deposit: float
    payment_method: str
    payment_status: str
    order_status: str
    order_notes: Optional[str] = None
    items_json: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Subscription Schemas
class SubscriptionCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: str
    delivery_address: str
    product_name: str
    quantity_liters: float
    frequency: str
    preferred_slot: str
    start_date: str

class SubscriptionStatusUpdate(BaseModel):
    status: str

class SubscriptionResponse(BaseModel):
    id: int
    subscription_code: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    product_name: str
    quantity_liters: float
    frequency: str
    preferred_slot: str
    start_date: str
    status: str
    bottle_return_policy: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Dashboard Stats Schema
class DashboardStats(BaseModel):
    today_yield_liters: float
    active_subscriptions: int
    pending_orders: int
    today_revenue: float
    average_chiller_temp: float
    total_customers: int
    active_products: int

# New Schemas for Addresses
class AddressBase(BaseModel):
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str
    is_default: Optional[bool] = False

class AddressCreate(AddressBase):
    user_id: int

class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    payment_method: str  # 'cash', 'credit_card', 'mobile_money', 'bank_transfer'
    transaction_id: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    contact_person: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    products_supplied: Optional[str] = None  # JSON array of product IDs

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Inventory Alert Schemas
class InventoryAlertCreate(BaseModel):
    product_id: int
    threshold_quantity: float
    is_active: Optional[bool] = True

class InventoryAlertResponse(BaseModel):
    id: int
    product_id: int
    threshold_quantity: float
    last_checked: Optional[datetime] = None
    notified_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True