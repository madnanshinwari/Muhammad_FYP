# Abdul Salam Dairy Farm System - API Documentation

The Abdul Salam Dairy Farm API is built with **FastAPI**, **SQLite**, and **SQLAlchemy**. It powers all operations for both consumer e-commerce (daily fresh milk ordering, recurring milk subscriptions, glass bottle returns) and agricultural farm operations (livestock milking yield, fat/SNF tests, chiller temperature monitoring, order fulfillment).

---

## Base URL
- Development Local Backend: `http://localhost:8000/api`
- Integrated Applet URL: `/api`

Interactive API Docs:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Register a new customer account.
- **Request Body**:
```json
{
  "name": "Chaudhry Tariq",
  "email": "customer@abdulsalamdairy.com",
  "password": "customer123",
  "role": "customer",
  "phone": "+92 321 4455667",
  "address": "House #42-B, Model Town, Lahore"
}
```
- **Response**: `200 OK`
```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "name": "Chaudhry Tariq",
    "email": "customer@abdulsalamdairy.com",
    "role": "customer",
    "phone": "+92 321 4455667",
    "address": "House #42-B, Model Town, Lahore",
    "bottle_credit_balance": 4
  }
}
```

### `POST /api/auth/login`
Authenticate admin or customer with password hash verification.
- **Request Body**:
```json
{
  "email": "admin@abdulsalamdairy.com",
  "password": "admin123"
}
```
- **Response**: `200 OK` Returns access token and user credentials with role.

---

## 2. Products & Inventory Endpoints

### `GET /api/products`
Fetch catalog items with optional category filtering (`milk`, `ghee_butter`, `yogurt_cream`, `cheese`, `specials`).
- **Response**: Array of product objects containing bilingual names, Fat %, SNF %, base prices, and packaging units.

### `POST /api/products` *(Admin Only)*
Create new dairy product batch or SKU.

### `PUT /api/products/{id}` *(Admin Only)*
Update product prices, stock volume, or purity statistics.

### `DELETE /api/products/{id}` *(Admin Only)*
Remove a product from the catalog.

---

## 3. Milking Batches & Traceability Endpoints

### `GET /api/batches`
Retrieve real-time farm milking batch log (Livestock Tag, Session, Yield in Liters, Fat %, SNF %, Chiller Temp, Logged by Vet).

### `GET /api/batches/trace/{batch_code}`
Instant farm-to-table traceability lookup for customers scanning milk bottle QR codes.

### `POST /api/batches` *(Admin & Vet Staff)*
Record new morning or evening livestock milking yield session.

---

## 4. Orders Endpoints

### `GET /api/orders`
Fetch orders. Admin views all farm orders; customer views personal history.

### `POST /api/orders`
Place a new milk or dairy product order. Includes selected unit, quantity, delivery slot, and bottle deposit calculation.

### `PATCH /api/orders/{id}/status` *(Admin Only)*
Transition order through delivery lifecycle:
`Placed` ➔ `Milked & Chilled` ➔ `Out for Delivery` ➔ `Delivered`

---

## 5. Subscriptions Endpoints

### `GET /api/subscriptions`
List recurring milk subscriptions (Daily, Alternate Days, Weekdays Only).

### `POST /api/subscriptions`
Subscribe for automated fresh morning / evening milk delivery.

### `PATCH /api/subscriptions/{id}/status`
Toggle subscription status (`Active`, `Paused`, `Cancelled`).

---

## 6. Farm Dashboard Analytics

### `GET /api/stats/dashboard`
Returns high-level operational statistics:
- `today_yield_liters`: Total milk extracted today across herds
- `active_subscriptions`: Active daily household deliveries
- `pending_orders`: Orders requiring packaging & dispatch
- `today_revenue`: Total sales
- `average_chiller_temp`: Current bulk milk cooling tank temperature (°C)
