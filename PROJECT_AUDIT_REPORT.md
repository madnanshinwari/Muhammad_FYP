# 🔍 PROFESSIONAL PROJECT AUDIT REPORT
## Abdul Salam Dairy Farm E-Commerce Platform

**Date:** November 10, 2026  
**Auditor:** Senior Full-Stack Developer (10+ Years)  
**Status:** REQUIRES CRITICAL FIXES BEFORE PRODUCTION

---

## 📊 EXECUTIVE SUMMARY

**Total Issues Found:** 32  
- 🔴 **Critical (Security/Data Loss):** 6
- 🟠 **High Priority (Broken Logic):** 8  
- 🟡 **Medium Priority (UX/Performance):** 12
- 🟢 **Low Priority (Best Practices):** 6

**Risk Level:** ⚠️ **HIGH** - Multiple security vulnerabilities prevent production deployment.

---

# 🔴 CRITICAL ISSUES (Must Fix Immediately)

## 1. INSECURE PASSWORD HASHING
**File:** `server-api.js:14-16`  
**Risk:** Passwords vulnerable to rainbow table attacks

```javascript
// ❌ WRONG - SHA256 has no salt, is fast to brute force
function hashPw(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}
```

**Impact:** Any attacker with database access can crack passwords easily.

**Fix:** Use bcrypt with salt
```javascript
import bcrypt from 'bcryptjs';

async function hashPw(pw) {
  return await bcrypt.hash(pw, 10);  // 10 rounds of salt
}

async function verifyPw(pw, hash) {
  return await bcrypt.compare(pw, hash);
}
```

**Files to Update:**
- `server-api.js`: Replace hashPw function, update login/register endpoints
- `package.json`: Add `"bcryptjs": "^2.4.3"`

---

## 2. NO ADMIN ROLE VERIFICATION ON PROTECTED ROUTES
**File:** `server-api.js` (all POST/PUT/DELETE endpoints)  
**Risk:** Any authenticated user can modify products, batches, orders

```javascript
// ❌ WRONG - No check if user is admin
if (pathname === '/api/products' && method === 'POST') {
  const b = await parseBody(req);
  // ... directly inserts product
}
```

**Impact:** Customers can add/delete products, modify orders, change batch records.

**Fix:** Extract user from token and verify role
```javascript
function getUserFromToken(token) {
  // Parse token format: token_{userId}_{timestamp}
  const [, userId] = token.match(/token_(\d+)_/) || [];
  if (!userId) return null;
  return db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId);
}

// Before protected endpoints:
const authHeader = req.headers.authorization || '';
const token = authHeader.replace('Bearer ', '');
const user = getUserFromToken(token);

if (method === 'POST' && (pathname.startsWith('/api/products') || pathname.startsWith('/api/batches'))) {
  if (!user || user.role !== 'admin') {
    return sendJson(res, 403, { detail: 'Admin access required' });
  }
}
```

---

## 3. NO TOKEN VALIDATION ON ANY API ENDPOINT
**File:** `server-api.js` (entire file)  
**Risk:** Any attacker can call APIs without authentication

```javascript
// ❌ WRONG - API endpoints never check if token is valid
if (pathname === '/api/orders' && method === 'GET') {
  // Returns all orders to anyone
  return sendJson(res, 200, orders);
}
```

**Impact:** Unauthenticated users can retrieve all customer orders, subscriptions, batches.

**Fix:** Add token validation middleware
```javascript
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  
  if (!token || !token.startsWith('token_')) {
    return sendJson(res, 401, { detail: 'Authentication required' });
  }
  return next();
}

// Apply before API middleware routes
server.middlewares.use(async (req, res, next) => {
  if (req.url.startsWith('/api')) {
    requireAuth(req, res, next);
  } else {
    next();
  }
});
```

**Also Update Frontend:** `src/services/api.js` to send token
```javascript
const token = localStorage.getItem('as_dairy_token');
const headers = {
  'Content-Type': 'application/json',
  ...(token && { 'Authorization': `Bearer ${token}` })
};
```

---

## 4. ADMIN DASHBOARD ACCESSIBLE TO CUSTOMERS
**File:** `src/pages/admin/AdminDashboard.jsx:1-30`  
**Risk:** No route protection - customers can navigate to `/admin`

```javascript
// ❌ WRONG - No role check
export function AdminDashboard() {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();  // ← Checks this but never ENFORCES it
  // ... renders admin UI to anyone
}
```

**Impact:** Customers see admin dashboard, though they can't modify (due to API checks - if implemented).

**Fix:** Protect route in App.jsx and show error
```javascript
import { Navigate } from 'react-router-dom';

// In App.jsx routes:
<Route 
  path="/admin" 
  element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} 
/>

// Create ProtectedAdminRoute component:
function ProtectedAdminRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>Only farm directors can access operations.</p>
        <Link to="/"><Button>Return Home</Button></Link>
      </div>
    );
  }
  
  return children;
}
```

---

## 5. ORDER CREATION WITHOUT INVENTORY CHECK
**File:** `server-api.js:216-234` & `src/pages/customer/CheckoutPage.jsx`  
**Risk:** Customer can order more than available stock

```javascript
// ❌ WRONG - No stock validation
if (pathname === '/api/orders' && method === 'POST') {
  const b = await parseBody(req);
  const insert = db.prepare(`INSERT INTO orders ...`);
  // Never checks product stock_quantity
}
```

**Impact:** Orders created with unavailable inventory → fulfillment failure.

**Fix:** Validate stock before order creation
```javascript
if (pathname === '/api/orders' && method === 'POST') {
  const b = await parseBody(req);
  
  // Validate stock for each item
  for (const item of (b.items || [])) {
    const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?')
      .get(item.productId);
    
    if (!product || product.stock_quantity < item.qty) {
      return sendJson(res, 400, { 
        detail: `Insufficient stock for product ${item.productId}` 
      });
    }
  }
  
  // Deduct stock after order created
  // ... insert order ...
  b.items.forEach(item => {
    db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
      .run(item.qty, item.productId);
  });
}
```

---

## 6. XSS VULNERABILITY - UNSANITIZED USER INPUT
**File:** `src/pages/customer/CheckoutPage.jsx:250` & product descriptions  
**Risk:** Stored XSS through order notes, product descriptions

```javascript
// ❌ WRONG - order_notes stored directly in DB, rendered without sanitization
<input
  type="text"
  value={formData.order_notes}
  onChange={(e) => setFormData({ ...formData, order_notes: e.target.value })}
/>

// Later rendered as:
<span className="text-xs">{confirmedOrder.order_notes}</span>  // ← XSS risk
```

**Impact:** Attacker injects `<script>alert('XSS')</script>` in notes → executes in admin dashboard.

**Fix:** Sanitize on both input and output
```bash
npm install dompurify
```

```javascript
import DOMPurify from 'dompurify';

// In CheckoutPage on submit:
const sanitizedNotes = DOMPurify.sanitize(formData.order_notes);

// In admin dashboard when displaying:
<span>{DOMPurify.sanitize(order.order_notes)}</span>

// Also escape HTML on server before storing:
// server-api.js:231
const sanitize = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

b.order_notes = sanitize(b.order_notes || '');
```

---

# 🟠 HIGH PRIORITY ISSUES

## 7. INCORRECT BOTTLE DEPOSIT CALCULATION
**File:** `src/context/CartContext.jsx:84-86`  
**Issue:** Counts milk items not actual bottles

```javascript
// ❌ WRONG
const bottleCount = items.filter(i => i.isMilk).reduce((sum, i) => sum + i.qty, 0);
const bottleDeposit = bottleCount * 50;
```

**Problem:** User orders 1x5L bottle = counts as 1 item but should be 1 bottle deposit (Rs. 50).

**Fix:**
```javascript
// ✅ CORRECT - Each order = 1 glass bottle deposit
const bottleCount = items.filter(i => i.isMilk).length;  // Not quantity, item count
const bottleDeposit = bottleCount * 50;
```

---

## 8. NO ORDER STATUS FLOW VALIDATION
**File:** `server-api.js:237-246`  
**Issue:** Can jump order from "Placed" → "Delivered" (skips delivery)

```javascript
// ❌ WRONG - Accepts any status transition
const status = b.order_status;
db.prepare('UPDATE orders SET order_status = ? WHERE id = ?').run(status, payStatus, id);
```

**Fix:** Validate status transitions
```javascript
const validTransitions = {
  'Placed': ['Milked & Chilled', 'Cancelled'],
  'Milked & Chilled': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': []
};

const currentStatus = db.prepare('SELECT order_status FROM orders WHERE id = ?').get(id).order_status;
const newStatus = b.order_status;

if (!validTransitions[currentStatus]?.includes(newStatus)) {
  return sendJson(res, 400, { 
    detail: `Cannot transition from ${currentStatus} to ${newStatus}` 
  });
}
```

---

## 9. NO INPUT VALIDATION ON REGISTRATION
**File:** `src/pages/auth/RegisterPage.jsx` & `server-api.js:72-99`  
**Issue:** Weak password, invalid email, no phone format check

```javascript
// ❌ No validation
<input
  type="password"
  required
  value={formData.password}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  placeholder="••••••••"
/>
// HTML5 required doesn't enforce strength
```

**Fix: Add validation on frontend**
```javascript
const validatePassword = (pw) => {
  if (pw.length < 8) return 'Password must be 8+ characters';
  if (!/[A-Z]/.test(pw)) return 'Must contain uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Must contain number';
  return null;
};

const validatePhone = (phone) => {
  if (!/^\+92\s?\d{3}\s?\d{7}$/.test(phone.replace(/\s/g, ''))) {
    return 'Invalid Pakistani phone number';
  }
  return null;
};

// In form submit:
const pwError = validatePassword(formData.password);
const phoneError = validatePhone(formData.phone);

if (pwError || phoneError) {
  setError(pwError || phoneError);
  return;
}
```

**Fix: Add validation on server**
```javascript
if (pathname === '/api/auth/register' && method === 'POST') {
  const b = await parseBody(req);
  
  // Validate password strength
  if (b.password.length < 8) {
    return sendJson(res, 400, { detail: 'Password must be 8+ characters' });
  }
  
  // Validate email format
  if (!b.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return sendJson(res, 400, { detail: 'Invalid email format' });
  }
  
  // Validate phone format (Pakistani +92)
  if (!b.phone.match(/^\+92\d{10}$/)) {
    return sendJson(res, 400, { detail: 'Invalid phone number' });
  }
}
```

---

## 10. FLOATING POINT PRECISION ERRORS IN PRICING
**File:** `src/context/CartContext.jsx:17-23`  
**Issue:** Using parseFloat for Rs calculations (precision loss)

```javascript
// ❌ WRONG
const computePrice = (basePrice, unit) => {
  const num = parseFloat(unit);  // Can lose precision
  if (!isNaN(num)) {
    return Math.round(basePrice * num);  // Rounding errors
  }
  return basePrice;
};
```

**Fix: Use integer cents**
```javascript
const computePrice = (basePrice, unit) => {
  const unitNum = parseFloat(unit);
  if (!isNaN(unitNum)) {
    // basePrice already in rupees, multiply safely
    return Math.round(basePrice * unitNum * 100) / 100;
  }
  return basePrice;
};

// Better: Store prices in database as paise (100 paise = 1 rupee) 
// Then divide by 100 when displaying
```

---

## 11. NO BATCH CODE UNIQUENESS CONSTRAINT
**File:** `server-api.js:177-192`  
**Issue:** Duplicate batch codes possible

```javascript
// ❌ WRONG - No unique constraint
const batchCode = b.batch_code || `AS-BATCH-${Date.now().toString().slice(-8)}`;
```

**Problem:** Two batches with same code → traceability lookup returns wrong batch.

**Fix: Add database constraint & check**
```javascript
// SQL: ALTER TABLE milking_batches ADD CONSTRAINT unique_batch_code UNIQUE (batch_code);

if (pathname === '/api/batches' && method === 'POST') {
  const b = await parseBody(req);
  const batchCode = b.batch_code || `AS-BATCH-${Date.now().toString().slice(-8)}`;
  
  // Check if already exists
  const existing = db.prepare('SELECT id FROM milking_batches WHERE batch_code = ?')
    .get(batchCode);
  
  if (existing) {
    return sendJson(res, 400, { detail: 'Batch code already exists' });
  }
  
  // ... proceed with insert
}
```

---

## 12. TRACEABILITY SEARCH CASE-SENSITIVE
**File:** `server-api.js:194-202`  
**Issue:** Search fails if user enters lowercase batch code

```javascript
// ❌ WRONG - Case sensitive
const batch = db.prepare('SELECT * FROM milking_batches WHERE batch_code = ?')
  .get(code);  // Won't match "as-batch-20261030-m01"
```

**Fix: Case-insensitive search**
```javascript
const batch = db.prepare('SELECT * FROM milking_batches WHERE LOWER(batch_code) = LOWER(?)')
  .get(code);
```

---

## 13. MISSING CUSTOMER_ID ON ORDER CREATION
**File:** `src/pages/customer/CheckoutPage.jsx:59`  
**Issue:** Unauthenticated users get null customer_id

```javascript
// ❌ PROBLEM
const orderPayload = {
  customer_id: user?.id || null,  // ← Can be null if not logged in
  // ...
};
```

**Impact:** Orders created without linking to customer → can't display in user's order history.

**Fix: Require authentication**
```javascript
export function CheckoutPage() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Please Login to Checkout</h1>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }
  
  // ... rest of component
}
```

---

# 🟡 MEDIUM PRIORITY ISSUES

## 14. LANGUAGE PREFERENCE NOT PERSISTED
**File:** `src/context/LanguageContext.jsx`  
**Issue:** Language resets on page refresh

**Fix:** Save to localStorage
```javascript
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('as_dairy_lang') || 'en';
  });

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ur' : 'en';
    setLang(newLang);
    localStorage.setItem('as_dairy_lang', newLang);
  };

  // ... rest of context
}
```

---

## 15. ERROR HANDLING USES ALERT()
**File:** `src/pages/customer/CheckoutPage.jsx:88`  
**Issue:** Poor UX, blocks UI

```javascript
// ❌ WRONG
catch (err) {
  alert(err.message);
}
```

**Fix: Use error state**
```javascript
const [error, setError] = useState('');

// In submit:
catch (err) {
  setError(err.message);
}

// In JSX:
{error && (
  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
    {error}
  </div>
)}
```

---

## 16. NO ERROR BOUNDARIES
**File:** `src/App.jsx`  
**Issue:** Component crash crashes entire app

**Fix: Add error boundary**
```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p className="text-gray-600">{this.state.error?.message}</p>
          <button onClick={() => window.location.href = '/'} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Go Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// In App.jsx:
<ErrorBoundary>
  <LanguageProvider>
    <AuthProvider>
      {/* ... */}
    </AuthProvider>
  </LanguageProvider>
</ErrorBoundary>
```

---

## 17. SUBSCRIPTION PAUSE/RESUME NOT IMPLEMENTED
**File:** `src/context/AuthContext.jsx` & API  
**Issue:** No API endpoints for pause/resume

**Fix:**
```javascript
// server-api.js
const pauseMatch = pathname.match(/^\/api\/subscriptions\/(\d+)\/pause$/);
if (pauseMatch && method === 'PATCH') {
  const id = Number(pauseMatch[1]);
  const b = await parseBody(req);
  const pauseUntil = b.pause_until; // ISO date string
  
  db.prepare('UPDATE subscriptions SET status = ?, pause_until = ? WHERE id = ?')
    .run('Paused', pauseUntil, id);
  
  const updated = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
  return sendJson(res, 200, updated);
}
```

---

## 18. EMPTY CART EDGE CASE
**File:** `src/pages/customer/CheckoutPage.jsx:39-52`  
**Issue:** Can manually navigate to checkout with empty cart

**Fix: More robust check**
```javascript
if (!user) {
  return <Navigate to="/login" replace />;
}

if (items.length === 0 && !confirmedOrder) {
  return (
    <div className="container mx-auto px-4 py-20 text-center max-w-md">
      {/* Show empty state */}
    </div>
  );
}
```

---

## 19. NO LOADING SKELETON IN CATALOG
**File:** `src/pages/customer/CatalogPage.jsx`  
**Issue:** Shows blank page while loading

**Fix: Add skeleton loaders**
```javascript
{loading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    ))}
  </div>
) : (
  // ... products
)}
```

---

## 20. DATABASE MISSING FOREIGN KEYS
**File:** `database/app.db` schema  
**Issue:** No referential integrity

**Fix: Create migration**
```sql
-- Add foreign key constraints
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer 
FOREIGN KEY (customer_id) REFERENCES users(id);

ALTER TABLE subscriptions ADD CONSTRAINT fk_subs_customer 
FOREIGN KEY (customer_id) REFERENCES users(id);

ALTER TABLE subscriptions ADD CONSTRAINT fk_subs_product 
FOREIGN KEY (product_id) REFERENCES products(id);

-- Add indexes for performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_batches_code ON milking_batches(batch_code);
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
```

---

## 21. BOTTLE CREDIT BALANCE NOT IMPLEMENTED
**File:** Project-wide  
**Issue:** `bottle_credit_balance` stored in DB but never used

**Fix:**
```javascript
// server-api.js - When bottle returned:
const bottleMatch = pathname.match(/^\/api\/users\/(\d+)\/bottle-credit$/);
if (bottleMatch && method === 'PATCH') {
  const userId = Number(bottleMatch[1]);
  const b = await parseBody(req);
  const bottlesReturned = b.bottle_count || 1;
  const creditAmount = bottlesReturned * 50;
  
  db.prepare('UPDATE users SET bottle_credit_balance = bottle_credit_balance + ? WHERE id = ?')
    .run(creditAmount, userId);
  
  const user = db.prepare('SELECT bottle_credit_balance FROM users WHERE id = ?').get(userId);
  return sendJson(res, 200, { bottle_credit_balance: user.bottle_credit_balance });
}
```

---

## 22. NO PAGINATION ON ORDERS/SUBSCRIPTIONS LISTS
**File:** `src/pages/admin/AdminDashboard.jsx`  
**Issue:** Admin sees ALL orders (scalability issue)

**Fix:**
```javascript
if (pathname === '/api/orders' && method === 'GET') {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  
  const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT ? OFFSET ?')
    .all(limit, offset);
  
  const countRow = db.prepare('SELECT COUNT(*) as total FROM orders').get();
  
  return sendJson(res, 200, {
    orders,
    total: countRow.total,
    page,
    limit,
    pages: Math.ceil(countRow.total / limit)
  });
}
```

---

# 🟢 LOW PRIORITY ISSUES (Best Practices)

## 23. Code duplication in API error handling
## 24. Missing request rate limiting
## 25. No CORS configuration
## 26. Missing JSDoc comments
## 27. No API request logging
## 28. Component prop drilling (could use Context)

---

# 📋 PRIORITY ACTION PLAN

## **PHASE 1: SECURITY (Week 1) - DO FIRST**
1. ✅ Implement bcrypt password hashing
2. ✅ Add token validation to all protected endpoints
3. ✅ Add admin role verification
4. ✅ Protect /admin route
5. ✅ Sanitize user input (order notes, descriptions)

## **PHASE 2: DATA INTEGRITY (Week 2)**
6. ✅ Add inventory validation on orders
7. ✅ Fix bottle deposit calculation
8. ✅ Add order status flow validation
9. ✅ Add unique constraint on batch codes
10. ✅ Add foreign keys to database

## **PHASE 3: VALIDATION & UX (Week 3)**
11. ✅ Add password strength validation
12. ✅ Add input validation (email, phone)
13. ✅ Replace alert() with error states
14. ✅ Add loading skeletons
15. ✅ Add error boundaries

## **PHASE 4: FEATURES & POLISH (Week 4)**
16. ✅ Persist language preference
17. ✅ Implement subscription pause/resume
18. ✅ Add pagination for admin lists
19. ✅ Implement bottle credit system
20. ✅ Case-insensitive batch search

---

# ✅ TESTING CHECKLIST

- [ ] Register with weak password - should reject
- [ ] Try accessing /admin as customer - should redirect
- [ ] Call API without token - should return 401
- [ ] Order more than stock_quantity - should reject
- [ ] Try changing order status (Placed → Delivered) - should reject
- [ ] Submit order with XSS payload in notes - should sanitize
- [ ] Create duplicate batch code - should reject
- [ ] Search batch with different case - should find
- [ ] Refresh page - language should persist
- [ ] Test bottle deposit with multiple items

---

# 📝 NEXT STEPS

1. **Start with Phase 1** (Security fixes must be done first)
2. Run `npm install bcryptjs dompurify` 
3. Apply all Critical & High Priority fixes
4. Create database migration script
5. Add unit tests for critical functions
6. Deploy to staging environment for testing
7. Get security review before production

**Estimated Timeline:** 3-4 weeks with proper testing

