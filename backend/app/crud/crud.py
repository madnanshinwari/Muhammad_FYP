import json
from sqlalchemy.orm import Session
from backend.app.models.models import User, Product, MilkingBatch, Order, Subscription, Address, Payment, Supplier, InventoryAlert
from backend.app.schemas.schemas import (
    UserCreate, ProductCreate, ProductUpdate, MilkingBatchCreate, OrderCreate, SubscriptionCreate,
    AddressCreate, PaymentCreate, SupplierCreate, InventoryAlertCreate
)
from backend.app.core.security import get_password_hash

# User CRUD
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user: UserCreate):
    db_user = User(
        name=user.name,
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role or "customer",
        phone=user.phone,
        address=user.address
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Product CRUD
def get_products(db: Session, category: str = None):
    query = db.query(Product)
    if category and category != 'all':
        query = query.filter(Product.category == category)
    return query.order_by(Product.id.asc()).all()

def get_product_by_id(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: ProductUpdate):
    db_product = get_product_by_id(db, product_id)
    if not db_product:
        return None
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product_by_id(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True

# Milking Batch CRUD
def get_milking_batches(db: Session, limit: int = 50):
    return db.query(MilkingBatch).order_by(MilkingBatch.id.desc()).limit(limit).all()

def get_batch_by_code(db: Session, batch_code: str):
    return db.query(MilkingBatch).filter(MilkingBatch.batch_code == batch_code).first()

def create_milking_batch(db: Session, batch: MilkingBatchCreate):
    import time
    batch_code = batch.batch_code or f"AS-BATCH-{int(time.time())}"
    db_batch = MilkingBatch(
        batch_code=batch_code,
        livestock_tag=batch.livestock_tag,
        animal_type=batch.animal_type,
        session=batch.session,
        yield_liters=batch.yield_liters,
        fat_percentage=batch.fat_percentage,
        snf_percentage=batch.snf_percentage,
        chiller_temp_c=batch.chiller_temp_c,
        milking_time=batch.milking_time,
        status=batch.status or "Approved & Packed",
        recorded_by=batch.recorded_by or "Dr. Arshad (Vet Officer)"
    )
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

# Orders CRUD
def get_orders(db: Session, customer_id: int = None):
    query = db.query(Order)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    return query.order_by(Order.id.desc()).all()

def create_order(db: Session, order: OrderCreate):
    import time
    order_code = f"ORD-{int(time.time()) % 100000:05d}"
    items_json = json.dumps([item.dict() for item in order.items])
    db_order = Order(
        order_code=order_code,
        customer_id=order.customer_id,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        delivery_address=order.delivery_address,
        delivery_slot=order.delivery_slot,
        total_amount=order.total_amount,
        bottle_deposit=order.bottle_deposit or 0.0,
        payment_method=order.payment_method,
        payment_status="Pending",
        order_status="Placed",
        order_notes=order.order_notes,
        items_json=items_json
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def update_order_status(db: Session, order_id: int, status: str):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        return None
    db_order.order_status = status
    if status == "Delivered":
        db_order.payment_status = "Paid"
    db.commit()
    db.refresh(db_order)
    return db_order

def process_payment(db: Session, order_id: int, payment: PaymentCreate):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return False

    db_payment = Payment(
        order_id=order_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        transaction_id=payment.transaction_id,
        status="Completed"
    )

    db.add(db_payment)
    order.payment_status = "Paid"
    db.commit()
    db.refresh(db_payment)
    return db_payment

# Subscriptions CRUD
def get_subscriptions(db: Session, customer_id: int = None):
    query = db.query(Subscription)
    if customer_id:
        query = query.filter(Subscription.customer_id == customer_id)
    return query.order_by(Subscription.id.desc()).all()

def create_subscription(db: Session, sub: SubscriptionCreate):
    import time
    subscription_code = f"SUB-{int(time.time()) % 10000:04d}"
    db_sub = Subscription(
        subscription_code=subscription_code,
        customer_id=sub.customer_id,
        customer_name=sub.customer_name,
        customer_phone=sub.customer_phone,
        delivery_address=sub.delivery_address,
        product_name=sub.product_name,
        quantity_liters=sub.quantity_liters,
        frequency=sub.frequency,
        preferred_slot=sub.preferred_slot,
        start_date=sub.start_date,
        status="Active",
        bottle_return_policy=1
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

def update_subscription_status(db: Session, sub_id: int, status: str):
    db_sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not db_sub:
        return None
    db_sub.status = status
    db.commit()
    db.refresh(db_sub)
    return db_sub

# Address CRUD
def get_addresses(db: Session, user_id: int = None):
    query = db.query(Address)
    if user_id:
        query = query.filter(Address.user_id == user_id)
    return query.all()

def create_address(db: Session, address: AddressCreate):
    db_address = Address(
        user_id=address.user_id,
        street_address=address.street_address,
        city=address.city,
        state=address.state,
        postal_code=address.postal_code,
        country=address.country,
        is_default=address.is_default
    )
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

def get_default_address(db: Session, user_id: int):
    return db.query(Address).filter(
        Address.user_id == user_id,
        Address.is_default == True
    ).first()

# Payment CRUD
def get_payments(db: Session, order_id: int = None):
    query = db.query(Payment)
    if order_id:
        query = query.filter(Payment.order_id == order_id)
    return query.all()

# Supplier CRUD
def get_suppliers(db: Session):
    return db.query(Supplier).all()

def create_supplier(db: Session, supplier: SupplierCreate):
    db_supplier = Supplier(
        name=supplier.name,
        contact_person=supplier.contact_person,
        phone=supplier.phone,
        email=supplier.email,
        address=supplier.address,
        products_supplied=supplier.products_supplied
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

# Inventory Alert CRUD
def get_inventory_alerts(db: Session, product_id: int = None):
    query = db.query(InventoryAlert)
    if product_id:
        query = query.filter(InventoryAlert.product_id == product_id)
    return query.all()

def create_inventory_alert(db: Session, alert: InventoryAlertCreate):
    db_alert = InventoryAlert(
        product_id=alert.product_id,
        threshold_quantity=alert.threshold_quantity,
        is_active=alert.is_active
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def check_inventory_alerts(db: Session):
    """Check all inventory alerts and notify if thresholds are breached"""
    from datetime import datetime, timedelta

    alerts = db.query(InventoryAlert).filter(InventoryAlert.is_active == True).all()

    for alert in alerts:
        product = db.query(Product).filter(Product.id == alert.product_id).first()
        if product and product.stock_quantity <= alert.threshold_quantity:
            # Check if already notified today
            last_notified = alert.notified_at
            if not last_notified or (last_notified.date() < datetime.now().date()):
                # In a real app, send notification here
                alert.notified_at = datetime.now()
                db.commit()
                print(f"Inventory Alert: Product {product.name_en} is below threshold ({product.stock_quantity} <= {alert.threshold_quantity})")

    return len(alerts)