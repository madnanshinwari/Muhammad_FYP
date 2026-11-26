# Abdul Salam Dairy Farm System (عبد السلام ڈیری فارم)

A full-stack, enterprise-grade dairy commerce and livestock operations platform built according to the Stitch AI Design System specification. It bridges consumer farm-to-table dairy ordering with operational herd milking logs, laboratory fat/SNF verification, and chiller temperature tracking.

---

## 🌾 Key System Highlights

- **Bilingual Interface**: Symmetrical support for English (LTR) and Urdu (اردو, RTL) with custom typography using `Outfit` and `Noto Nastaliq Urdu`.
- **Wholesome Fresh Color Palette**: Grounded in Fresh Green (`#218838`), Deep Forest Green (`#14532D`), Golden Butter (`#F4C542`), Crisp White (`#FFFFFF`), and Soft Milk Cream Canvas (`#FFFDF5`).
- **Interactive Dairy UX**:
  - Multi-unit packaging selectors (`0.5L`, `1.0L`, `2.0L`, `5.0L` / `250g`, `500g`, `1kg`)
  - Morphing Add-to-Cart buttons converting into instant `[-] qty [+]` numeric steppers
  - Glass bottle deposit and eco-friendly return rebate tracking (Rs. 50/bottle)
  - Operational livestock milking log with tabular figures, fat % tests, and chiller telemetry
- **Full-Stack Architecture**:
  - **Frontend**: React.js, Plain JavaScript (ES6+), Vite, Tailwind CSS, Bootstrap 5 utilities, Lucide React icons, React Router DOM.
  - **Backend**: Python, FastAPI, SQLite Database, SQLAlchemy ORM, Pydantic schemas, REST APIs.
  - **Database**: Relational SQLite (`database/app.db`) pre-seeded with real farm inventories, milking batches, orders, and accounts.

---

## 📂 Project Structure

```
project-root/
├── frontend/ (and src/ in root Vite workspace)
│   ├── public/
│   │   ├── images/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Badge, Modal, LanguageToggle
│   │   │   ├── layout/         # Header, Footer, AdminSidebar, CartDrawer
│   │   │   ├── cards/          # ProductCard, MetricStatCard
│   │   │   ├── tables/         # MilkingBatchTable, OrderTable
│   │   │   └── forms/          # ProductModal, MilkingBatchModal
│   │   ├── pages/
│   │   │   ├── customer/       # HomePage, CatalogPage, CheckoutPage
│   │   │   ├── admin/          # AdminDashboard, AdminBatches, AdminProducts, AdminOrders
│   │   │   ├── rider/           # RiderDashboardPage
│   │   │   └── auth/           # LoginPage, RegisterPage
│   │   ├── context/            # AuthContext, CartContext, LanguageContext
│   │   ├── services/           # api.js REST client
│   │   ├── utils/              # translations.js (Urdu/English), storage.js
│   │   ├── App.jsx             # Main Router & Layouts
│   │   ├── main.jsx            # React root mounting
│   │   └── index.css           # Design tokens, Elevation & Outfit font rules
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/         # auth.py, products.py, orders.py, subscriptions.py, batches.py, stats.py
│   │   ├── core/               # config.py, security.py
│   │   ├── crud/               # crud.py (SQLAlchemy queries)
│   │   ├── database/           # database.py (SessionLocal, SQLite engine)
│   │   ├── models/             # models.py (SQLAlchemy ORM models)
│   │   ├── schemas/            # schemas.py (Pydantic validation)
│   │   └── main.py             # FastAPI App & CORS configuration
│   ├── requirements.txt
│   └── .env.example
│
├── database/
│   ├── app.db                  # Persistent SQLite relational database
│   └── init_db.py              # Python database migration & seeder script
│
├── docs/
│   └── API_DOCUMENTATION.md    # REST endpoints documentation
│
└── README.md
```

---

## 🚀 Default Credentials

The SQLite database is pre-seeded with two accounts for testing role-based access:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Farm Director (Admin)** | `admin@abdulsalamdairy.com` | `admin123` | Full access to Admin Dashboard, Livestock Milking Logs, Product CRUD, and Order Dispatch. |
| **Customer** | `customer@abdulsalamdairy.com` | `customer123` | Storefront catalog and instant order placement. |

*Quick login buttons are available directly on the Login page for one-click demo access.*

---

## 🛠️ Prerequisites & Setup

### 1. Prerequisites
- **Node.js**: v18+ or v22+
- **Python**: 3.10+
- **SQLite3**: Built into Python

### 2. Quick Start (Vite Dev Server with Integrated SQLite API)
The application runs out of the box with the Vite server on port 3000:
```bash
# 1. Install frontend packages
npm install

# 2. Initialize and seed the SQLite database
python database/init_db.py

# 3. Run the application
npm run dev
```
Open your browser at `http://localhost:3000`.

Run the database initialization step whenever `database/app.db` is missing,
empty, or needs to be reset. On systems where the Python command is named
`python3`, use `python3 database/init_db.py` instead.

Customers, Farm Owners, and Riders can register normally. Farm Owner accounts
receive immediate access to Farm Management without a pending approval step.
Farm Owners can assign active orders to Riders from the Delivery Sheet. Riders
can view assigned deliveries, mark them delivered, review delivery history, and
manage their profile from the Rider Dashboard sidebar.

### 3. Running Standalone FastAPI Backend (Optional)
If running the Python FastAPI backend separately:
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs will be accessible at `http://localhost:8000/api/docs`.

### 4. Database Re-Initialization
To reset or re-seed the SQLite database at any time:
```bash
python3 database/init_db.py
```

---

## 🌿 Stitch AI Design Specification Compliance

- **Colors**: Exact HEX values implemented (`#218838`, `#14532D`, `#F4C542`, `#263238`, `#FFFDF5`, `#FFFFFF`, `#F3F7F1`, `#E2E8F0`).
- **Typography**: Outfit Latin family and Noto Nastaliq Urdu with 1.35x line-height multiplier for Urdu diacritics.
- **Elevation**: 3-level depth system with subtle green ambient tinting.
- **Component Fidelity**:
  - Segmented unit pills (`0.5L`, `1L`, `5L`)
  - Numeric stepper morphing on Add-to-Cart
  - Purity pill badges (`Fat 6.8%`, `SNF 9.2%`, `100% Halal`)
  - Operational data tables with tabular numerical alignment and chiller telemetry readings.
