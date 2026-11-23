from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.database import get_db
from backend.app.schemas.schemas import DashboardStats
from backend.app.models.models import MilkingBatch, Subscription, Order, User, Product

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # Total yield from latest batches
    yield_sum = db.query(func.sum(MilkingBatch.yield_liters)).scalar() or 0.0
    active_subs = db.query(Subscription).filter(Subscription.status == "Active").count()
    pending_orders = db.query(Order).filter(Order.order_status.in_(["Placed", "Milked & Chilled", "Out for Delivery"])).count()
    revenue_sum = db.query(func.sum(Order.total_amount)).scalar() or 0.0
    avg_chiller = db.query(func.avg(MilkingBatch.chiller_temp_c)).scalar() or 3.8
    total_customers = db.query(User).filter(User.role == "customer").count()
    active_products = db.query(Product).count()

    return {
        "today_yield_liters": round(float(yield_sum), 1),
        "active_subscriptions": active_subs,
        "pending_orders": pending_orders,
        "today_revenue": round(float(revenue_sum), 2),
        "average_chiller_temp": round(float(avg_chiller), 1),
        "total_customers": total_customers,
        "active_products": active_products
    }
