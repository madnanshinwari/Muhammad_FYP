import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'database/app.db');

let db;
// Keep development tokens valid across Vite reloads and multiple local processes.
// Production deployments should always provide AS_DAIRY_TOKEN_SECRET.
const tokenSecret = process.env.AS_DAIRY_TOKEN_SECRET ||
  crypto.createHash('sha256').update('abdul-salam-dairy-development-token').digest('hex');
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
try {
  db = new DatabaseSync(dbPath);
  const userColumns = db.prepare('PRAGMA table_info(users)').all();
  if (!userColumns.some((column) => column.name === 'profile_image_url')) {
    db.exec('ALTER TABLE users ADD COLUMN profile_image_url TEXT');
  }
  if (!userColumns.some((column) => column.name === 'farm_name')) {
    db.exec('ALTER TABLE users ADD COLUMN farm_name TEXT');
  }
  db.prepare("UPDATE users SET role = 'farm_owner' WHERE role = 'pending_farm_owner'")
    .run();
} catch (e) {
  console.error("Error opening database/app.db with node:sqlite:", e);
}

// ========== SECURITY UTILITIES ==========

/**
 * Parse and verify signed token.
 */
function parseToken(token) {
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', tokenSecret)
    .update(encodedPayload)
    .digest('base64url');
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!Number.isInteger(payload.userId) || !Number.isInteger(payload.exp) ||
        payload.exp <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get user from token - verifies user exists in database
 */
function getUserFromToken(token) {
  const parsed = parseToken(token);
  if (!parsed) return null;

  const user = db.prepare('SELECT id, name, email, role, phone, address, profile_image_url, farm_name, bottle_credit_balance FROM users WHERE id = ?')
    .get(parsed.userId);

  return user || null;
}

function isFarmManager(user) {
  return user?.role === 'admin' || user?.role === 'farm_owner';
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (password.length < 8) return 'Password must be 8+ characters';
  if (!/[A-Z]/.test(password)) return 'Must contain uppercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain number';
  return null;
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateProfileImage(profileImage) {
  if (!profileImage) return null;
  if (!/^data:image\/(?:png|jpe?g|webp|gif);base64,/.test(profileImage)) {
    return 'Profile image must be a PNG, JPEG, WEBP, or GIF.';
  }
  if (profileImage.length > 7 * 1024 * 1024) {
    return 'Profile image is too large.';
  }
  return null;
}

/**
 * Validate Pakistani phone number
 */
function validatePhone(phone) {
  // Format: +92XXXXXXXXXX or 03XXXXXXXXX
  const phoneRegex = /^(\+92|0)?\d{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Generate simple hash for password (using crypto)
 * Note: In production, use bcryptjs. This is fallback for compatibility.
 */
function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

/**
 * Verify password against hash
 */
function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }
  if (storedHash.startsWith('$2')) {
    return bcrypt.compareSync(password, storedHash);
  }
  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  return storedHash === legacyHash || (() => {
    if (!storedHash.includes(':')) return false;
    const [salt, hash] = storedHash.split(':');
    return crypto.createHash('sha256').update(salt + password).digest('hex') === hash;
  })();
}

function parseMultipartBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

// ========== HTTP UTILITIES ==========

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 10 * 1024 * 1024) {
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        reject(error);
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        const error = new Error('Invalid JSON request body.');
        error.statusCode = 400;
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    exp: Date.now() + TOKEN_TTL_MS
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

// ========== VITE MIDDLEWARE ==========

export function apiMiddleware() {
  return {
    name: 'dairy-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:3000');
        const pathname = url.pathname;
        const method = req.method;

        try {
          // ========== PUBLIC AUTH ROUTES ==========

          if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await parseBody(req);

            if (!body.email || !body.password) {
              return sendJson(res, 400, { detail: 'Email and password required.' });
            }

            const user = db.prepare(
              'SELECT id, name, email, role, phone, address, profile_image_url, farm_name, bottle_credit_balance, password_hash FROM users WHERE email = ?'
            ).get(body.email);

            if (!user || !verifyPassword(body.password, user.password_hash)) {
              return sendJson(res, 401, { detail: 'Invalid email or password.' });
            }

            if (!user.password_hash.startsWith('$2')) {
              db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                .run(hashPassword(body.password), user.id);
            }

            // Generate token
            const token = createToken(user.id);

            // Return user without password hash
            const { password_hash, ...safeUser } = user;

            return sendJson(res, 200, {
              access_token: token,
              token_type: 'bearer',
              user: safeUser
            });
          }

          if (pathname === '/api/auth/register' && method === 'POST') {
            const body = await parseBody(req);

            // Validation
            if (!body.name || !body.email || !body.password) {
              return sendJson(res, 400, { detail: 'Name, email, and password are required.' });
            }

            if (!validateEmail(body.email)) {
              return sendJson(res, 400, { detail: 'Invalid email format.' });
            }

            const passwordError = validatePassword(body.password);
            if (passwordError) {
              return sendJson(res, 400, { detail: passwordError });
            }

            if (body.phone && !validatePhone(body.phone)) {
              return sendJson(res, 400, { detail: 'Invalid phone number format.' });
            }

            const requestedRole = body.role === 'farm_owner' ? 'farm_owner' : 'customer';
            const farmName = requestedRole === 'farm_owner' ? String(body.farm_name || '').trim() : '';
            if (requestedRole === 'farm_owner' && !farmName) {
              return sendJson(res, 400, { detail: 'Farm name is required for Farm Owner accounts.' });
            }

            // Check duplicate email
            const check = db.prepare('SELECT id FROM users WHERE email = ?').get(body.email);
            if (check) {
              return sendJson(res, 400, { detail: 'User with this email already exists.' });
            }

            const storedRole = requestedRole;
            const hashedPassword = hashPassword(body.password);
            const insert = db.prepare(`
              INSERT INTO users (name, email, password_hash, role, phone, address, farm_name, bottle_credit_balance)
              VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            `);

            const result = insert.run(
              sanitizeInput(body.name),
              body.email.toLowerCase(),
              hashedPassword,
              storedRole,
              sanitizeInput(body.phone || ''),
              sanitizeInput(body.address || ''),
              farmName ? sanitizeInput(farmName) : null
            );

            const newUser = db.prepare(
              'SELECT id, name, email, role, phone, address, profile_image_url, farm_name, bottle_credit_balance FROM users WHERE id = ?'
            ).get(result.lastInsertRowid);

            const token = createToken(newUser.id);

            return sendJson(res, 201, {
              access_token: token,
              token_type: 'bearer',
              user: newUser
            });
          }

          // ========== PROTECTED ROUTES (Authentication Required) ==========

          // Extract token from Authorization header
          const authHeader = req.headers.authorization || '';
          const token = authHeader.replace('Bearer ', '').replace('bearer ', '');
          const currentUser = token ? getUserFromToken(token) : null;

          // --- USER PROFILE ROUTES ---
          if (pathname === '/api/users/profile' && method === 'PUT') {
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }

            const body = await parseBody(req);
            const { name, phone, address, profile_image_url } = body;

            // Validate inputs
            if (!name) {
              return sendJson(res, 400, { detail: 'Name is required.' });
            }

            if (phone && !validatePhone(phone)) {
              return sendJson(res, 400, { detail: 'Invalid phone number format.' });
            }

            const imageError = validateProfileImage(profile_image_url);
            if (imageError) {
              return sendJson(res, 400, { detail: imageError });
            }

            // Update user
            db.prepare(`
              UPDATE users
              SET name = ?, phone = ?, address = ?, profile_image_url = ?
              WHERE id = ?
            `).run(
              sanitizeInput(name),
              sanitizeInput(phone || ''),
              sanitizeInput(address || ''),
              profile_image_url || null,
              currentUser.id
            );

            const updatedUser = db.prepare(
              'SELECT id, name, email, role, phone, address, profile_image_url, farm_name, bottle_credit_balance FROM users WHERE id = ?'
            ).get(currentUser.id);

            return sendJson(res, 200, { user: updatedUser });
          }

          if (pathname === '/api/users/password' && method === 'PATCH') {
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }

            const body = await parseBody(req);
            if (!body.current_password || !body.new_password) {
              return sendJson(res, 400, { detail: 'Current and new password are required.' });
            }

            const passwordError = validatePassword(body.new_password);
            if (passwordError) {
              return sendJson(res, 400, { detail: passwordError });
            }

            const storedUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(currentUser.id);
            if (!storedUser || !verifyPassword(body.current_password, storedUser.password_hash)) {
              return sendJson(res, 400, { detail: 'Current password is incorrect.' });
            }

            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
              .run(hashPassword(body.new_password), currentUser.id);

            return sendJson(res, 200, { success: true });
          }

          // Public routes that require authentication for certain methods

          // --- FARM MANAGEMENT WORKSPACE ---
          if (pathname === '/api/farm/summary' && method === 'GET') {
            if (!currentUser || !isFarmManager(currentUser)) {
              return sendJson(res, 403, { detail: 'Farm management access required.' });
            }

            const summary = {
              livestock: db.prepare('SELECT COUNT(*) AS total, SUM(status = \'Milking\') AS milking, SUM(status = \'Pregnant\') AS pregnant, SUM(status = \'Deceased\') AS deceased FROM livestock').get(),
              production: db.prepare('SELECT COALESCE(SUM(yield_liters), 0) AS total_liters, COALESCE(SUM(CASE WHEN session = \'Morning\' THEN yield_liters ELSE 0 END), 0) AS morning_liters, COALESCE(SUM(CASE WHEN session = \'Evening\' THEN yield_liters ELSE 0 END), 0) AS evening_liters FROM production_records WHERE production_date = (SELECT MAX(production_date) FROM production_records)').get(),
              feed_alerts: db.prepare('SELECT COUNT(*) AS count FROM feed_inventory WHERE quantity <= minimum_stock').get().count,
              income: db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM finance_transactions WHERE transaction_type = \'income\' AND transaction_date = (SELECT MAX(transaction_date) FROM finance_transactions)').get().total,
              expenses: db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM finance_transactions WHERE transaction_type = \'expense\' AND transaction_date = (SELECT MAX(transaction_date) FROM finance_transactions)').get().total,
              notifications: db.prepare('SELECT COUNT(*) AS count FROM farm_notifications WHERE is_read = 0').get().count
            };
            return sendJson(res, 200, summary);
          }

          const farmResourceMatch = pathname.match(/^\/api\/farm\/(livestock|production|feed|health|finance|notifications)$/);
          if (farmResourceMatch && (method === 'GET' || method === 'POST')) {
            if (!currentUser || !isFarmManager(currentUser)) {
              return sendJson(res, 403, { detail: 'Farm management access required.' });
            }

            const resource = farmResourceMatch[1];
            const tables = {
              livestock: 'livestock',
              production: 'production_records',
              feed: 'feed_inventory',
              health: 'health_records',
              finance: 'finance_transactions',
              notifications: 'farm_notifications'
            };

            if (method === 'GET') {
              const rows = db.prepare(`SELECT * FROM ${tables[resource]} ORDER BY id DESC LIMIT 100`).all();
              return sendJson(res, 200, rows);
            }

            const b = await parseBody(req);
            let result;
            if (resource === 'livestock') {
              if (!b.tag_id || !b.breed || !b.species || !b.gender) {
                return sendJson(res, 400, { detail: 'Tag ID, breed, species, and gender are required.' });
              }
              result = db.prepare(`
                INSERT INTO livestock (tag_id, name, breed, species, gender, date_of_birth, weight_kg, status, purchase_date, purchase_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(sanitizeInput(b.tag_id), sanitizeInput(b.name || ''), sanitizeInput(b.breed), sanitizeInput(b.species), sanitizeInput(b.gender), b.date_of_birth || null, Number(b.weight_kg) || null, sanitizeInput(b.status || 'Milking'), b.purchase_date || null, Number(b.purchase_price) || 0);
            } else if (resource === 'feed') {
              if (!b.name || !b.category) return sendJson(res, 400, { detail: 'Feed name and category are required.' });
              result = db.prepare(`
                INSERT INTO feed_inventory (name, category, quantity, unit, minimum_stock, unit_cost, supplier)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).run(sanitizeInput(b.name), sanitizeInput(b.category), Number(b.quantity) || 0, sanitizeInput(b.unit || 'kg'), Number(b.minimum_stock) || 0, Number(b.unit_cost) || 0, sanitizeInput(b.supplier || ''));
            } else if (resource === 'finance') {
              if (!b.transaction_type || !b.category || !b.description || !b.amount) return sendJson(res, 400, { detail: 'Finance type, category, description, and amount are required.' });
              result = db.prepare(`
                INSERT INTO finance_transactions (transaction_date, transaction_type, category, description, amount, payment_status)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(b.transaction_date || new Date().toISOString().slice(0, 10), sanitizeInput(b.transaction_type), sanitizeInput(b.category), sanitizeInput(b.description), Number(b.amount), sanitizeInput(b.payment_status || 'Paid'));
            } else if (resource === 'health') {
              if (!b.livestock_id || !b.condition) return sendJson(res, 400, { detail: 'Animal and condition are required.' });
              result = db.prepare(`
                INSERT INTO health_records (livestock_id, visit_date, condition, diagnosis, treatment, next_due_date, veterinarian, cost)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `).run(Number(b.livestock_id), b.visit_date || new Date().toISOString().slice(0, 10), sanitizeInput(b.condition), sanitizeInput(b.diagnosis || ''), sanitizeInput(b.treatment || ''), b.next_due_date || null, sanitizeInput(b.veterinarian || ''), Number(b.cost) || 0);
            } else if (resource === 'production') {
              if (!b.session || !b.yield_liters) return sendJson(res, 400, { detail: 'Session and yield are required.' });
              result = db.prepare(`
                INSERT INTO production_records (livestock_id, batch_id, session, production_date, yield_liters, fat_percentage, snf_percentage, lactometer_reading, inspected_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(Number(b.livestock_id) || null, Number(b.batch_id) || null, sanitizeInput(b.session), b.production_date || new Date().toISOString().slice(0, 10), Number(b.yield_liters), Number(b.fat_percentage) || 0, Number(b.snf_percentage) || 0, Number(b.lactometer_reading) || 0, sanitizeInput(b.inspected_by || ''));
            } else {
              if (!b.title || !b.message) return sendJson(res, 400, { detail: 'Notification title and message are required.' });
              result = db.prepare(`
                INSERT INTO farm_notifications (notification_type, title, message, due_date)
                VALUES (?, ?, ?, ?)
              `).run(sanitizeInput(b.notification_type || 'general'), sanitizeInput(b.title), sanitizeInput(b.message), b.due_date || null);
            }

            const row = db.prepare(`SELECT * FROM ${tables[resource]} WHERE id = ?`).get(result.lastInsertRowid);
            return sendJson(res, 201, row);
          }

          // --- PRODUCTS ROUTES ---
          if (pathname === '/api/products' && method === 'GET') {
            const category = url.searchParams.get('category');
            let products;
            if (category && category !== 'all') {
              products = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY id ASC').all(category);
            } else {
              products = db.prepare('SELECT * FROM products ORDER BY id ASC').all();
            }
            return sendJson(res, 200, products);
          }

          if (pathname === '/api/products' && method === 'POST') {
            // ADMIN ONLY
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }
            if (!isFarmManager(currentUser)) {
              return sendJson(res, 403, { detail: 'Farm management access required.' });
            }

            const b = await parseBody(req);

            if (!b.name_en || !b.base_price) {
              return sendJson(res, 400, { detail: 'Product name and price required.' });
            }

            const insert = db.prepare(`
              INSERT INTO products (
                name_en, name_ur, category, description_en, description_ur,
                fat_percentage, snf_percentage, base_price, unit_type,
                available_units, stock_quantity, image_url, is_fresh_batch, is_organic
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = insert.run(
              sanitizeInput(b.name_en),
              sanitizeInput(b.name_ur || ''),
              sanitizeInput(b.category || 'milk'),
              sanitizeInput(b.description_en || ''),
              sanitizeInput(b.description_ur || ''),
              parseFloat(b.fat_percentage) || 0,
              parseFloat(b.snf_percentage) || 0,
              parseFloat(b.base_price),
              b.unit_type || 'L',
              typeof b.available_units === 'string' ? b.available_units : JSON.stringify(b.available_units || ["1.0"]),
              parseInt(b.stock_quantity) || 0,
              b.image_url || '',
              b.is_fresh_batch ?? 1,
              b.is_organic ?? 1
            );

            const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
            return sendJson(res, 201, product);
          }

          const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
          if (productMatch) {
            const id = Number(productMatch[1]);

            if (method === 'GET') {
              const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
              if (!product) return sendJson(res, 404, { detail: 'Product not found' });
              return sendJson(res, 200, product);
            }

            if (method === 'PUT') {
              // ADMIN ONLY
              if (!currentUser) {
                return sendJson(res, 401, { detail: 'Authentication required.' });
              }
              if (!isFarmManager(currentUser)) {
                return sendJson(res, 403, { detail: 'Farm management access required.' });
              }

              const b = await parseBody(req);
              const update = db.prepare(`
                UPDATE products SET
                  name_en = COALESCE(?, name_en),
                  name_ur = COALESCE(?, name_ur),
                  category = COALESCE(?, category),
                  description_en = COALESCE(?, description_en),
                  base_price = COALESCE(?, base_price),
                  stock_quantity = COALESCE(?, stock_quantity),
                  fat_percentage = COALESCE(?, fat_percentage),
                  snf_percentage = COALESCE(?, snf_percentage),
                  image_url = COALESCE(?, image_url),
                  description_ur = COALESCE(?, description_ur),
                  unit_type = COALESCE(?, unit_type),
                  available_units = COALESCE(?, available_units),
                  is_fresh_batch = COALESCE(?, is_fresh_batch),
                  is_organic = COALESCE(?, is_organic)
                WHERE id = ?
              `);

              update.run(
                b.name_en != null ? sanitizeInput(b.name_en) : null,
                b.name_ur != null ? sanitizeInput(b.name_ur) : null,
                b.category != null ? sanitizeInput(b.category) : null,
                b.description_en != null ? sanitizeInput(b.description_en) : null,
                b.base_price != null && b.base_price !== '' ? parseFloat(b.base_price) : null,
                b.stock_quantity != null && b.stock_quantity !== '' ? parseInt(b.stock_quantity) : null,
                b.fat_percentage != null && b.fat_percentage !== '' ? parseFloat(b.fat_percentage) : null,
                b.snf_percentage != null && b.snf_percentage !== '' ? parseFloat(b.snf_percentage) : null,
                b.image_url ?? null,
                b.description_ur != null ? sanitizeInput(b.description_ur) : null,
                b.unit_type ?? null,
                b.available_units != null
                  ? (typeof b.available_units === 'string' ? b.available_units : JSON.stringify(b.available_units))
                  : null,
                b.is_fresh_batch ?? null,
                b.is_organic ?? null,
                id
              );

              const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
              return sendJson(res, 200, updated);
            }

            if (method === 'DELETE') {
              // ADMIN ONLY
              if (!currentUser) {
                return sendJson(res, 401, { detail: 'Authentication required.' });
              }
              if (!isFarmManager(currentUser)) {
                return sendJson(res, 403, { detail: 'Farm management access required.' });
              }

              db.prepare('DELETE FROM products WHERE id = ?').run(id);
              return sendJson(res, 200, { success: true });
            }
          }

          // --- BATCHES & TRACEABILITY ROUTES ---
          if (pathname === '/api/batches/recent' && method === 'GET') {
            const batches = db.prepare(
              'SELECT id, batch_code, animal_type, session, status, created_at FROM milking_batches ORDER BY id DESC LIMIT 5'
            ).all();
            return sendJson(res, 200, batches);
          }

          if (pathname === '/api/batches' && method === 'GET') {
            // ADMIN ONLY
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }
            if (!isFarmManager(currentUser)) {
              return sendJson(res, 403, { detail: 'Farm management access required.' });
            }

            const batches = db.prepare('SELECT * FROM milking_batches ORDER BY id DESC LIMIT 50').all();
            return sendJson(res, 200, batches);
          }

          if (pathname === '/api/batches' && method === 'POST') {
            // ADMIN ONLY
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }
            if (!isFarmManager(currentUser)) {
              return sendJson(res, 403, { detail: 'Farm management access required.' });
            }

            const b = await parseBody(req);
            let batchCode = b.batch_code || `AS-BATCH-${Date.now().toString().slice(-8)}`;

            // Check for duplicate batch code
            const existing = db.prepare('SELECT id FROM milking_batches WHERE batch_code = ?').get(batchCode);
            if (existing) {
              return sendJson(res, 400, { detail: 'Batch code already exists.' });
            }

            const insert = db.prepare(`
              INSERT INTO milking_batches (
                batch_code, livestock_tag, animal_type, session, yield_liters,
                fat_percentage, snf_percentage, chiller_temp_c, milking_time, status, recorded_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = insert.run(
              sanitizeInput(batchCode),
              sanitizeInput(b.livestock_tag || ''),
              sanitizeInput(b.animal_type || 'Buffalo'),
              sanitizeInput(b.session || 'Morning'),
              parseFloat(b.yield_liters) || 0,
              parseFloat(b.fat_percentage) || 6.5,
              parseFloat(b.snf_percentage) || 9.0,
              parseFloat(b.chiller_temp_c) || 3.8,
              sanitizeInput(b.milking_time || new Date().toLocaleString()),
              sanitizeInput(b.status || 'Approved & Packed'),
              sanitizeInput(b.recorded_by || 'Dr. Arshad (Vet Officer)')
            );

            const batch = db.prepare('SELECT * FROM milking_batches WHERE id = ?').get(result.lastInsertRowid);
            return sendJson(res, 201, batch);
          }

          const traceMatch = pathname.match(/^\/api\/batches\/trace\/(.+)$/);
          if (traceMatch && method === 'GET') {
            const code = decodeURIComponent(traceMatch[1]);
            // PUBLIC - Case insensitive search
            const batch = db.prepare('SELECT * FROM milking_batches WHERE LOWER(batch_code) = LOWER(?)')
              .get(code);

            if (!batch) {
              return sendJson(res, 404, { detail: `Milking batch '${code}' not found in farm records.` });
            }

            return sendJson(res, 200, batch);
          }

          // --- ORDERS ROUTES ---
          if (pathname === '/api/orders' && method === 'GET') {
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }

            const customerId = url.searchParams.get('customer_id');
            let orders;

            if (customerId) {
              // Customer can only see their own orders
              if (currentUser.role === 'customer' && parseInt(customerId) !== currentUser.id) {
                return sendJson(res, 403, { detail: 'Cannot view other customer orders.' });
              }
              orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC').all(customerId);
            } else {
              // Only admin can see all orders
              if (!isFarmManager(currentUser)) {
                orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC').all(currentUser.id);
              } else {
                orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
              }
            }

            return sendJson(res, 200, orders);
          }

          if (pathname === '/api/orders' && method === 'POST') {
            // AUTHENTICATED USERS ONLY
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }

            const b = await parseBody(req);

            const validSlots = ['Morning (5:00 AM - 7:00 AM)', 'Evening (5:00 PM - 7:00 PM)'];
            const validPaymentMethods = ['Cash on Delivery', 'JazzCash', 'EasyPaisa', 'Bank Transfer'];
            if (!b.customer_name || !b.delivery_address || !Array.isArray(b.items) || b.items.length === 0) {
              return sendJson(res, 400, { detail: 'Missing required order fields.' });
            }
            if (!b.customer_phone || !validatePhone(b.customer_phone)) {
              return sendJson(res, 400, { detail: 'Valid phone number is required.' });
            }
            if (!validSlots.includes(b.delivery_slot) || !validPaymentMethods.includes(b.payment_method)) {
              return sendJson(res, 400, { detail: 'Invalid delivery slot or payment method.' });
            }

            let subtotal = 0;
            let bottleCount = 0;
            const normalizedItems = [];
            for (const item of b.items) {
              const product = db.prepare('SELECT * FROM products WHERE id = ?')
                .get(item.productId);
              const qty = Number(item.qty);
              if (!product || !Number.isInteger(qty) || qty < 1) {
                return sendJson(res, 400, { detail: 'Each order quantity must be a positive whole number.' });
              }
              if (product.stock_quantity < qty) {
                return sendJson(res, 400, {
                  detail: `Insufficient stock for product ${item.productId}. Available: ${product.stock_quantity}, Requested: ${qty}`
                });
              }

              let availableUnits;
              try {
                availableUnits = JSON.parse(product.available_units);
              } catch {
                availableUnits = [];
              }
              const unit = String(item.unit || '');
              const numericUnit = Number.parseFloat(unit);
              const unitIsAvailable = Number.isFinite(numericUnit) &&
                availableUnits.some((availableUnit) => Number(availableUnit) === numericUnit);
              if (!unitIsAvailable) {
                return sendJson(res, 400, { detail: `Invalid unit for product ${product.id}.` });
              }

              const price = Math.round(Number(product.base_price) * numericUnit);
              subtotal += price * qty;
              if (product.category === 'milk') {
                bottleCount += qty;
              }
              normalizedItems.push({
                productId: product.id,
                name: product.name_en,
                unit: `${numericUnit}${product.unit_type}`,
                qty,
                price
              });
            }

            const bottleDeposit = bottleCount * 50;
            const totalAmount = subtotal + bottleDeposit;
            const orderCode = `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            const itemsStr = JSON.stringify(normalizedItems);

            const insert = db.prepare(`
              INSERT INTO orders (
                order_code, customer_id, customer_name, customer_phone, delivery_address,
                delivery_slot, total_amount, bottle_deposit, payment_method, payment_status,
                order_status, order_notes, items_json
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Placed', ?, ?)
            `);

            db.exec('BEGIN IMMEDIATE');
            try {
              for (const item of normalizedItems) {
                const updated = db.prepare(
                  'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?'
                ).run(item.qty, item.productId, item.qty);
                if (updated.changes !== 1) {
                  throw Object.assign(new Error('Stock changed. Please review your cart and try again.'), { statusCode: 409 });
                }
              }

              const result = insert.run(
                orderCode,
                currentUser.id,
                sanitizeInput(b.customer_name),
                sanitizeInput(b.customer_phone),
                sanitizeInput(b.delivery_address),
                b.delivery_slot,
                totalAmount,
                bottleDeposit,
                b.payment_method,
                sanitizeInput(b.order_notes || ''),
                itemsStr
              );
              db.exec('COMMIT');
              const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
              return sendJson(res, 201, order);
            } catch (error) {
              db.exec('ROLLBACK');
              throw error;
            }
          }

          const orderStatusMatch = pathname.match(/^\/api\/orders\/(\d+)\/status$/);
          if (orderStatusMatch && method === 'PATCH') {
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }
            if (!isFarmManager(currentUser)) {
              return sendJson(res, 403, { detail: 'Farm management access required.' });
            }

            const id = Number(orderStatusMatch[1]);
            const b = await parseBody(req);
            const newStatus = b.order_status;

            // Validate status transition
            const order = db.prepare('SELECT order_status FROM orders WHERE id = ?').get(id);
            if (!order) {
              return sendJson(res, 404, { detail: 'Order not found.' });
            }

            const validTransitions = {
              'Placed': ['Milked & Chilled', 'Cancelled'],
              'Milked & Chilled': ['Out for Delivery', 'Cancelled'],
              'Out for Delivery': ['Delivered', 'Cancelled'],
              'Delivered': [],
              'Cancelled': []
            };

            if (!validTransitions[order.order_status]?.includes(newStatus)) {
              return sendJson(res, 400, {
                detail: `Cannot transition from ${order.order_status} to ${newStatus}`
              });
            }

            const payStatus = newStatus === 'Delivered' ? 'Paid' : 'Pending';
            db.prepare('UPDATE orders SET order_status = ?, payment_status = ? WHERE id = ?')
              .run(newStatus, payStatus, id);

            const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
            return sendJson(res, 200, updated);
          }

          // --- SUBSCRIPTIONS ROUTES ---
          if (pathname === '/api/subscriptions' && method === 'GET') {
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }

            const customerId = url.searchParams.get('customer_id');
            let subs;

            if (customerId) {
              if (currentUser.role === 'customer' && parseInt(customerId) !== currentUser.id) {
                return sendJson(res, 403, { detail: 'Cannot view other customer subscriptions.' });
              }
              subs = db.prepare('SELECT * FROM subscriptions WHERE customer_id = ? ORDER BY id DESC').all(customerId);
            } else {
              if (!isFarmManager(currentUser)) {
                subs = db.prepare('SELECT * FROM subscriptions WHERE customer_id = ? ORDER BY id DESC').all(currentUser.id);
              } else {
                subs = db.prepare('SELECT * FROM subscriptions ORDER BY id DESC').all();
              }
            }

            return sendJson(res, 200, subs);
          }

          if (pathname === '/api/subscriptions' && method === 'POST') {
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }

            const b = await parseBody(req);
            const validFrequencies = ['Daily', 'Alternate Days', 'Weekdays Only'];
            const validSlots = ['Morning (5:00 AM - 7:00 AM)', 'Evening (5:00 PM - 7:00 PM)'];
            const quantity = Number(b.quantity_liters);

            if (!b.customer_name || !b.product_name || !b.delivery_address ||
                !b.customer_phone || !validatePhone(b.customer_phone)) {
              return sendJson(res, 400, { detail: 'Missing required subscription fields.' });
            }
            if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 50) {
              return sendJson(res, 400, { detail: 'Quantity must be between 0 and 50 liters.' });
            }
            if (!validFrequencies.includes(b.frequency) || !validSlots.includes(b.preferred_slot)) {
              return sendJson(res, 400, { detail: 'Invalid subscription frequency or delivery slot.' });
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(b.start_date || '')) {
              return sendJson(res, 400, { detail: 'A valid start date is required.' });
            }

            const subCode = `SUB-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

            const insert = db.prepare(`
              INSERT INTO subscriptions (
                subscription_code, customer_id, customer_name, customer_phone,
                delivery_address, product_name, quantity_liters, frequency,
                preferred_slot, start_date, status, bottle_return_policy
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 1)
            `);

            const result = insert.run(
              subCode,
              currentUser.id,
              sanitizeInput(b.customer_name),
              sanitizeInput(b.customer_phone),
              sanitizeInput(b.delivery_address),
              sanitizeInput(b.product_name),
              quantity,
              b.frequency,
              b.preferred_slot,
              b.start_date
            );

            const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(result.lastInsertRowid);
            return sendJson(res, 201, sub);
          }

          const subStatusMatch = pathname.match(/^\/api\/subscriptions\/(\d+)\/status$/);
          if (subStatusMatch && method === 'PATCH') {
            if (!currentUser) {
              return sendJson(res, 401, { detail: 'Authentication required.' });
            }

            const id = Number(subStatusMatch[1]);
            const b = await parseBody(req);

            // Check ownership (customer) or admin
            const sub = db.prepare('SELECT customer_id FROM subscriptions WHERE id = ?').get(id);
            if (!sub) {
              return sendJson(res, 404, { detail: 'Subscription not found.' });
            }

            if (currentUser.role === 'customer' && sub.customer_id !== currentUser.id) {
              return sendJson(res, 403, { detail: 'Cannot modify other customer subscriptions.' });
            }

            const validStatuses = ['Active', 'Paused', 'Cancelled'];
            if (!validStatuses.includes(b.status)) {
              return sendJson(res, 400, { detail: 'Invalid subscription status.' });
            }
            db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?')
              .run(b.status, id);

            const updated = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
            return sendJson(res, 200, updated);
          }

          // --- DASHBOARD STATS ---
          if (pathname === '/api/stats/dashboard' && method === 'GET') {
            if (!currentUser || !isFarmManager(currentUser)) {
              return sendJson(res, 403, { detail: 'Farm management access required.' });
            }

            const yieldRow = db.prepare('SELECT SUM(yield_liters) as total_yield FROM milking_batches').get();
            const subsRow = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'Active'").get();
            const ordersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status IN ('Placed', 'Milked & Chilled', 'Out for Delivery')").get();
            const revenueRow = db.prepare('SELECT SUM(total_amount) as total_rev FROM orders').get();
            const tempRow = db.prepare('SELECT AVG(chiller_temp_c) as avg_temp FROM milking_batches').get();
            const customersRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get();
            const productsRow = db.prepare('SELECT COUNT(*) as count FROM products').get();

            return sendJson(res, 200, {
              today_yield_liters: Math.round((yieldRow?.total_yield || 0) * 10) / 10,
              active_subscriptions: subsRow?.count || 0,
              pending_orders: ordersRow?.count || 0,
              today_revenue: Math.round((revenueRow?.total_rev || 0) * 100) / 100,
              average_chiller_temp: Math.round((tempRow?.avg_temp || 3.8) * 10) / 10,
              total_customers: customersRow?.count || 0,
              active_products: productsRow?.count || 0
            });
          }

          return sendJson(res, 404, { detail: 'API route not found' });
        } catch (err) {
          console.error('API Error:', err);
          const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
          return sendJson(res, statusCode, {
            detail: statusCode >= 500 ? 'An unexpected server error occurred.' : err.message
          });
        }
      });
    }
  };
}
