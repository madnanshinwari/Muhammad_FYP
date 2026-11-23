from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from backend.app.core.config import settings
from backend.app.database.database import engine, Base
from backend.app.api.routes import auth, products, orders, subscriptions, batches, stats

# Create database tables if not exist
Base.metadata.create_all(bind=engine)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Abdul Salam Dairy Farm System - Complete API backend for dairy commerce, milking logs, subscriptions, and farm operations.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={
        "name": "Abdul Salam Dairy Support",
        "email": "support@abdulsalamdairy.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    }
)

# Rate Limit Exception Handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Too many requests. Please try again later.", "retry_after": exc.detail},
    )

# CORS Middleware - Restrict to specific domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://abdulsalamdairy.com"],  # Add your production domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(subscriptions.router, prefix=settings.API_V1_STR)
app.include_router(batches.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "Abdul Salam Dairy Farm System",
        "status": "Online",
        "docs": "/api/docs",
        "purity_guarantee": "100% Halal & Fresh Daily Farm Milk",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)