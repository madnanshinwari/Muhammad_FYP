# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (required first time)
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Type check (no emit)
npm run lint

# Preview built app
npm run preview

# Clean build artifacts
npm run clean

# Reset/re-seed SQLite database
python3 database/init_db.py
```

## Architecture: Integrated Full-Stack with Vite

This is a **monolithic full-stack app** built on Vite. The backend is not a separate service but integrated as middleware:

- **Frontend**: React + React Router in `src/` (components, pages, context, services)
- **Backend API**: Vite middleware in `server-api.js` that directly queries SQLite via Node.js `sqlite` module
- **Database**: SQLite at `database/app.db` (pre-seeded with test users, products, batches, and orders)

When you run `npm run dev`, the Vite server starts on port 3000 and the API middleware intercepts all `/api/*` requests, executing SQL directly against the database. There is no separate Python FastAPI backend in development—the `backend/` directory is reference/documentation only.

## Key Patterns

**API Client** (`src/services/api.js`):
- Centralized fetch-based HTTP client
- All endpoints use `/api` base URL
- Handles response errors with `.detail` fallback
- Used by context providers and page components

**State Management** (Context API in `src/context/`):
- `AuthContext`: User login/register, token storage, auth-protected routes
- `CartContext`: Shopping cart state and checkout items
- `LanguageContext`: English/Urdu toggle (affects LTR/RTL and UI text)

**Authentication**:
- Token stored as `as_dairy_token` in localStorage; signed tokens expire after 8 hours
- Account roles: `customer` can shop; `farm_owner` and `admin` can access Farm Management
- Default test accounts: `admin@abdulsalamdairy.com` / `admin123` (admin), `customer@abdulsalamdairy.com` / `customer123` (customer)
- Password hashing: bcrypt with legacy SHA256 migration on successful login (in `server-api.js`)

**Bilingual Support**:
- All product/batch names stored in database as `{field}_en` and `{field}_ur`
- `src/utils/translations.js` provides English/Urdu text for UI labels
- LanguageContext global state controls active language and applies `dir="rtl"` on root for Urdu

## Database Schema

SQLite tables in `database/app.db`:
- `users`: id, name, email, password_hash, role (admin/customer), phone, address, bottle_credit_balance
- `products`: id, name_en, name_ur, category, description_en, description_ur, fat_percentage, snf_percentage, base_price, unit_type, available_units (JSON), stock_quantity, image_url, is_fresh_batch, is_organic
- `milking_batches`: id, batch_code, livestock_tag, animal_type, session, yield_liters, fat_percentage, snf_percentage, chiller_temp_c, milking_time, status, recorded_by
- `orders`: id, customer_id, items (JSON), total_price, order_status, created_at
- `stats`: Daily operational metrics (pre-aggregated for dashboard)

API endpoints are implemented as route matching in `server-api.js`; each endpoint parses the request body, executes prepared statements, and returns JSON.

## Design System

Exact hex colors implemented project-wide (Tailwind, CSS, index.css):
- Fresh Green: `#218838` (primary action, CTAs)
- Deep Forest Green: `#14532D` (darker accents)
- Golden Butter: `#F4C542` (highlights, badges)
- Charcoal: `#263238` (text, dark elements)
- Soft Milk Cream: `#FFFDF5` (canvas background)
- White: `#FFFFFF`
- Slate: `#E2E8F0`, `#F3F7F1` (dividers, subtle backgrounds)

Typography:
- English: Outfit font family (Latin, modern sans-serif)
- Urdu: Noto Nastaliq Urdu (calligraphic, 1.35x line-height for diacritics)
- Both loaded in `src/index.css`

Elevation system (3 levels) with subtle green ambient tinting applied via CSS shadows (`box-shadow` with green-tinted rgba).

## Component Organization

- `src/components/common/`: Reusable UI primitives (Button, Badge, LanguageToggle, Modal)
- `src/components/layout/`: Header, Footer, CartDrawer (global chrome)
- `src/components/cards/`: ProductCard, MetricStatCard, SubscriptionCard
- `src/components/tables/`: MilkingBatchTable, OrderTable (tabular data views)
- `src/components/forms/`: ProductModal, MilkingBatchModal (inline edit/create forms)

Pages follow routes in `src/App.jsx`:
- `/` → HomePage
- `/catalog` → CatalogPage (product browsing by category)
- `/checkout` → CheckoutPage
- `/admin` → AdminDashboard (milking logs, product CRUD, and order dispatch)
- `/login`, `/register` → Auth pages

## Notes for Implementation

- `vite.config.js` uses `@` alias resolving to project root
- Custom `apiMiddleware` in `vite.config.js` registers the route handlers from `server-api.js`
- All available unit sizes (0.5L, 1L, 2L, 5L for milk; 250g, 500g, 1kg for cheese/butter) stored as JSON strings in `available_units` column
- Product categories: `milk`, `cheese`, `butter`, `yogurt`, `other`
- Milking sessions: `Morning` or `Evening`
- Glass bottle deposit tracking: `bottle_credit_balance` column tracks user's refundable credits (Rs. 50/bottle)
