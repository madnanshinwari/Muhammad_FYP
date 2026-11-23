from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from backend.app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", index=True) # 'admin', 'customer', 'staff'
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    bottle_credit_balance = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name_en = Column(String(150), nullable=False, index=True)
    name_ur = Column(String(150), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True) # 'milk', 'ghee_butter', 'yogurt_cream', 'cheese', 'specials'
    description_en = Column(Text, nullable=True)
    description_ur = Column(Text, nullable=True)
    fat_percentage = Column(Float, nullable=True)
    snf_percentage = Column(Float, nullable=True)
    base_price = Column(Float, nullable=False)
    unit_type = Column(String(10), nullable=False) # 'L' or 'kg'
    available_units = Column(Text, nullable=False) # JSON array string e.g. ["0.5", "1.0", "5.0"]
    stock_quantity = Column(Float, nullable=False, default=0.0)
    image_url = Column(Text, nullable=True)
    is_fresh_batch = Column(Integer, default=1)
    is_organic = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MilkingBatch(Base):
    __tablename__ = "milking_batches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    batch_code = Column(String(50), unique=True, index=True, nullable=False)
    livestock_tag = Column(String(100), nullable=False)
    animal_type = Column(String(30), nullable=False) # 'Buffalo', 'Cow', 'Goat'
    session = Column(String(20), nullable=False) # 'Morning' or 'Evening'
    yield_liters = Column(Float, nullable=False)
    fat_percentage = Column(Float, nullable=False)
    snf_percentage = Column(Float, nullable=False)
    chiller_temp_c = Column(Float, nullable=False)
    milking_time = Column(String(50), nullable=False)
    status = Column(String(50), default="Approved & Packed")
    recorded_by = Column(String(100), default="Dr. Arshad (Vet Officer)")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_code = Column(String(30), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    customer_name = Column(String(120), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    delivery_address = Column(Text, nullable=False)
    delivery_slot = Column(String(80), nullable=False)
    total_amount = Column(Float, nullable=False)
    bottle_deposit = Column(Float, default=0.0)
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(30), default="Pending", index=True)
    order_status = Column(String(40), default="Placed", index=True) # 'Placed', 'Milked & Chilled', 'Out for Delivery', 'Delivered', 'Cancelled'
    order_notes = Column(Text, nullable=True)
    items_json = Column(Text, nullable=False) # JSON list of items
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    subscription_code = Column(String(30), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    customer_name = Column(String(120), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    delivery_address = Column(Text, nullable=False)
    product_name = Column(String(150), nullable=False)
    quantity_liters = Column(Float, nullable=False)
    frequency = Column(String(50), nullable=False) # 'Daily', 'Alternate Days', 'Weekdays Only'
    preferred_slot = Column(String(80), nullable=False)
    start_date = Column(String(30), nullable=False)
    status = Column(String(30), default="Active", index=True) # 'Active', 'Paused', 'Cancelled'
    bottle_return_policy = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# New Tables
class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    street_address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)  # 'cash', 'credit_card', 'mobile_money', 'bank_transfer'
    transaction_id = Column(String(100), nullable=True)
    status = Column(String(30), default="Pending", index=True)  # 'Pending', 'Completed', 'Failed', 'Refunded'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    email = Column(String(120), nullable=True)
    address = Column(Text, nullable=True)
    products_supplied = Column(Text, nullable=True)  # JSON array of product IDs
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InventoryAlert(Base):
    __tablename__ = "inventory_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    threshold_quantity = Column(Float, nullable=False)
    last_checked = Column(DateTime(timezone=True), server_default=func.now())
    notified_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)