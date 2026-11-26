import sqlite3
import os
import json
import hashlib

os.makedirs('database', exist_ok=True)
db_path = 'database/app.db'

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Enable foreign keys
cur.execute("PRAGMA foreign_keys = ON;")

# Create Users Table
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer', -- 'admin', 'farm_owner', 'customer', 'staff'
    phone TEXT,
    address TEXT,
    profile_image_url TEXT,
    bottle_credit_balance INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# Create Products Table
cur.execute("""
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_ur TEXT NOT NULL,
    category TEXT NOT NULL, -- 'milk', 'ghee_butter', 'yogurt_cream', 'cheese', 'specials'
    description_en TEXT,
    description_ur TEXT,
    fat_percentage REAL,
    snf_percentage REAL,
    base_price REAL NOT NULL,
    unit_type TEXT NOT NULL, -- 'L' or 'kg'
    available_units TEXT NOT NULL, -- JSON array e.g. ["0.5", "1.0", "5.0"]
    stock_quantity REAL NOT NULL,
    image_url TEXT,
    is_fresh_batch INTEGER DEFAULT 1,
    is_organic INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# Create Milking Batches Table (Traceability & Operational data)
cur.execute("""
CREATE TABLE IF NOT EXISTS milking_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_code TEXT UNIQUE NOT NULL,
    livestock_tag TEXT NOT NULL, -- e.g. 'BF-104 (Nili-Ravi Buffalo)', 'CW-088 (Sahiwal Cow)'
    animal_type TEXT NOT NULL, -- 'Buffalo', 'Cow', 'Goat'
    session TEXT NOT NULL, -- 'Morning' or 'Evening'
    yield_liters REAL NOT NULL,
    fat_percentage REAL NOT NULL,
    snf_percentage REAL NOT NULL,
    chiller_temp_c REAL NOT NULL,
    milking_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Approved & Packed',
    recorded_by TEXT NOT NULL DEFAULT 'Dr. Arshad (Vet Officer)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# Create Orders Table
cur.execute("""
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_slot TEXT NOT NULL, -- 'Morning (5:00 AM - 7:00 AM)', 'Evening (5:00 PM - 7:00 PM)'
    total_amount REAL NOT NULL,
    bottle_deposit REAL DEFAULT 0,
    payment_method TEXT NOT NULL, -- 'Cash on Delivery', 'JazzCash', 'EasyPaisa', 'Bank Transfer'
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    order_status TEXT NOT NULL DEFAULT 'Placed', -- 'Placed', 'Milked & Chilled', 'Out for Delivery', 'Delivered', 'Cancelled'
    rider_id INTEGER REFERENCES users(id),
    order_notes TEXT,
    items_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id)
);
""")
order_columns = [column[1] for column in cur.execute("PRAGMA table_info(orders)").fetchall()]
if "rider_id" not in order_columns:
    cur.execute("ALTER TABLE orders ADD COLUMN rider_id INTEGER REFERENCES users(id)")

# Create Subscriptions Table
cur.execute("""
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_code TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity_liters REAL NOT NULL,
    frequency TEXT NOT NULL, -- 'Daily', 'Alternate Days', 'Weekdays Only'
    preferred_slot TEXT NOT NULL, -- 'Morning (5:00 AM - 7:00 AM)', 'Evening (5:00 PM - 7:00 PM)'
    start_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Paused', 'Cancelled'
    bottle_return_policy INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id)
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS livestock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id TEXT UNIQUE NOT NULL,
    name TEXT,
    breed TEXT NOT NULL,
    species TEXT NOT NULL,
    gender TEXT NOT NULL,
    date_of_birth TEXT,
    weight_kg REAL,
    status TEXT NOT NULL DEFAULT 'Milking',
    purchase_date TEXT,
    purchase_price REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS production_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    livestock_id INTEGER,
    batch_id INTEGER,
    session TEXT NOT NULL,
    production_date TEXT NOT NULL,
    yield_liters REAL NOT NULL,
    fat_percentage REAL,
    snf_percentage REAL,
    lactometer_reading REAL,
    inspected_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(livestock_id) REFERENCES livestock(id),
    FOREIGN KEY(batch_id) REFERENCES milking_batches(id)
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS feed_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    minimum_stock REAL NOT NULL DEFAULT 0,
    unit_cost REAL NOT NULL DEFAULT 0,
    supplier TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    livestock_id INTEGER NOT NULL,
    visit_date TEXT NOT NULL,
    condition TEXT NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    next_due_date TEXT,
    veterinarian TEXT,
    cost REAL DEFAULT 0,
    FOREIGN KEY(livestock_id) REFERENCES livestock(id)
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS finance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_date TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_status TEXT DEFAULT 'Paid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS farm_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    due_date TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

# Seed Admin & Demo Customer
cur.execute("SELECT COUNT(*) FROM users")
if cur.fetchone()[0] == 0:
    cur.execute("""
    INSERT INTO users (name, email, password_hash, role, phone, address, bottle_credit_balance)
    VALUES 
    ('Farm Director Abdul Salam', 'admin@abdulsalamdairy.com', ?, 'admin', '+92 300 8472911', 'Abdul Salam Farms, Main Raiwind Rd, Lahore', 15),
    ('Chaudhry Tariq', 'customer@abdulsalamdairy.com', ?, 'customer', '+92 321 4455667', 'House #42-B, Model Town, Lahore', 4)
    """, (hash_pw('admin123'), hash_pw('customer123')))

# Seed Products
cur.execute("SELECT COUNT(*) FROM products")
if cur.fetchone()[0] == 0:
    products = [
        (
            'Pure Buffalo Milk (Unpasteurized Raw)',
            'بھینس کا خالص کچا دودھ',
            'milk',
            'Thick, natural creaminess direct from pasture-fed Nili-Ravi buffaloes. Unadulterated and chilled within 30 mins.',
            'نیلی راوی بھینسوں کا تازہ کچا دودھ۔ قدرتی بالائی سے بھرپور اور ملاوٹ سے پاک۔',
            6.8,
            9.2,
            290.0,
            'kg',
            json.dumps(["0.5", "1.0", "2.0", "5.0"]),
            450.0,
            'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Fresh Desi Cow Milk (A2 Protein)',
            'خالص گائے کا دودھ (اے ٹو)',
            'milk',
            'Nutrient-dense A2 milk from pure Sahiwal cows. Easy digestion, golden beta-carotene cream, ideal for children and elders.',
            'ساہیوال گائے کا خالص اے ٹو دودھ۔ ہاضمے کے لیے ہلکا اور وٹامنز سے بھرپور۔',
            4.4,
            8.6,
            270.0,
            'kg',
            json.dumps(["0.5", "1.0", "2.0", "5.0"]),
            380.0,
            'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Artisanal Pure Desi Ghee (Bilona Churned)',
            'خالص دیسی گھی (بلوچھی چھرنڈ)',
            'ghee_butter',
            'Slow-cooked traditional bilona churned cultured butter. Rich golden aroma, granular danedar texture, zero preservatives.',
            'روایتی طریقہ سے مٹی کی ہانڈی میں تیار کردہ خالص دانے دار دیسی گھی۔',
            99.8,
            0.1,
            100.0,
            'bottle',
            json.dumps(["1.0"]),
            95.0,
            'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Fresh Farm White Butter (Desi Makhan)',
            'فارم کا تازہ سفید مکھن',
            'ghee_butter',
            'Unsalted, naturally churned white butter from fresh cultured cream. Melts smoothly over parathas or sarson ka saag.',
            'بغیر نمک روایتی تازہ سفید مکھن، خالص ذائقہ اور قدرتی خوشبو۔',
            82.5,
            1.2,
            3500.0,
            'kg',
            json.dumps(["0.25", "0.5", "1.0"]),
            60.0,
            'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Thick Sweet & Sour Dahi (Kunda Curd)',
            'گاڑھا روایتی مٹی کا دہی',
            'yogurt_cream',
            'Thick-set whole milk yogurt in natural terracotta pots. Naturally firm texture without gelatin or thickeners.',
            'قدرتی مٹی کے کونڈے میں جمایا گیا گاڑھا میٹھا اور تروتازہ دہی۔',
            5.2,
            8.8,
            220.0,
            'kg',
            json.dumps(["0.5", "1.0", "2.0"]),
            180.0,
            'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Farm Fresh Malai Paneer (Cottage Cheese)',
            'فارم فریش ملائی پنیر',
            'cheese',
            'Soft, spongy malai paneer crafted from morning whole milk. High protein and delicious in curries or barbecue grills.',
            'صبح کے تازہ دودھ سے تیار کردہ نرم اور ملائم ہائی پروٹین پنیر۔',
            22.0,
            16.5,
            1400.0,
            'kg',
            json.dumps(["0.25", "0.5", "1.0"]),
            85.0,
            'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Rich Traditional Koya (Mawa)',
            'خالص کویا (ماوا)',
            'specials',
            'Pure condensed milk solids reduced over slow wood-fire heat. Perfect for traditional Pakistani sweets, halwas and gulab jamun.',
            'دھیمی آنچ پر دودھ کو سکھا کر تیار کیا گیا خالص دانے دار کھویا۔',
            28.0,
            24.0,
            400.0,
            'kg',
            json.dumps(["0.5", "1.0"]),
            40.0,
            'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Sweet Milk (Meetha Doodh)',
            'میٹھا دودھ',
            'specials',
            'A sweet, creamy milk drink prepared fresh from farm milk and served chilled in a sealed bottle.',
            'فارم کے تازہ دودھ سے تیار کردہ میٹھا اور کریمی مشروب، سیل بند بوتل میں ٹھنڈا پیش کیا جاتا ہے۔',
            6.0,
            9.0,
            290.0,
            'kg',
            json.dumps(["1.0"]),
            80.0,
            'https://images.unsplash.com/photo-1600788907416-456578634209?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Traditional Rice Keer',
            'روایتی چاول کی کھیر',
            'specials',
            'Slow-cooked rice pudding made with rich farm milk, cardamom and a delicate natural sweetness.',
            'فارم کے بھرپور دودھ، الائچی اور قدرتی مٹھاس سے دھیمی آنچ پر تیار کردہ چاول کی کھیر۔',
            8.0,
            10.0,
            2000.0,
            'kg',
            json.dumps(["0.5", "1.0"]),
            60.0,
            'https://images.unsplash.com/photo-1579888944880-d98341245702?auto=format&fit=crop&w=800&q=80',
            1,
            1
        ),
        (
            'Sweet Rabri Malai Lassi (Bottled Chilled)',
            'میٹھی ربڑی ملائی لسی',
            'yogurt_cream',
            'Traditional refreshing blended yogurt lassi infused with layers of thick buffalo milk malai and light cardamom.',
            'بھینس کے دودھ کی گاڑھی ملائی اور الائچی کے عرق سے بنی ٹھنڈی میٹھی لسی۔',
            7.5,
            10.2,
            180.0,
            'bottle',
            json.dumps(["1.0"]),
            120.0,
            'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
            1,
            1
        )
    ]
    cur.executemany("""
    INSERT INTO products (
        name_en, name_ur, category, description_en, description_ur, 
        fat_percentage, snf_percentage, base_price, unit_type, available_units, 
        stock_quantity, image_url, is_fresh_batch, is_organic
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, products)

# Keep the live database aligned with the current farm price list when this
# script is run against an existing installation.
cur.execute("""
UPDATE products
SET name_en = 'Rich Traditional Koya (Mawa)', name_ur = 'خالص کویا (ماوا)'
WHERE name_en = 'Rich Traditional Khoya (Mawa)'
""")

price_updates = [
    ('Pure Buffalo Milk (Unpasteurized Raw)', 290.0, 'kg', '["0.5", "1.0", "2.0", "5.0"]', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'),
    ('Fresh Desi Cow Milk (A2 Protein)', 270.0, 'kg', '["0.5", "1.0", "2.0", "5.0"]', 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80'),
    ('Thick Sweet & Sour Dahi (Kunda Curd)', 220.0, 'kg', '["0.5", "1.0", "2.0"]', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80'),
    ('Artisanal Pure Desi Ghee (Bilona Churned)', 100.0, 'bottle', '["1.0"]', 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=800&q=80'),
    ('Fresh Farm White Butter (Desi Makhan)', 3500.0, 'kg', '["0.25", "0.5", "1.0"]', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80'),
    ('Farm Fresh Malai Paneer (Cottage Cheese)', 1400.0, 'kg', '["0.25", "0.5", "1.0"]', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80'),
    ('Rich Traditional Koya (Mawa)', 400.0, 'kg', '["0.5", "1.0"]', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80'),
    ('Sweet Milk (Meetha Doodh)', 290.0, 'kg', '["1.0"]', 'https://images.unsplash.com/photo-1600788907416-456578634209?auto=format&fit=crop&w=800&q=80'),
    ('Traditional Rice Keer', 2000.0, 'kg', '["0.5", "1.0"]', 'https://images.unsplash.com/photo-1579888944880-d98341245702?auto=format&fit=crop&w=800&q=80'),
    ('Sweet Rabri Malai Lassi (Bottled Chilled)', 180.0, 'bottle', '["1.0"]', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80')
]
for name, price, unit_type, units, image_url in price_updates:
    cur.execute(
        'UPDATE products SET base_price = ?, unit_type = ?, available_units = ?, image_url = ? WHERE name_en = ?',
        (price, unit_type, units, image_url, name)
    )

cur.execute("""
INSERT INTO products (
    name_en, name_ur, category, description_en, description_ur,
    fat_percentage, snf_percentage, base_price, unit_type, available_units,
    stock_quantity, image_url, is_fresh_batch, is_organic
) SELECT
    'Sweet Milk (Meetha Doodh)', 'میٹھا دودھ', 'specials',
    'A sweet, creamy milk drink prepared fresh from farm milk and served chilled in a sealed bottle.',
    'فارم کے تازہ دودھ سے تیار کردہ میٹھا اور کریمی مشروب، سیل بند بوتل میں ٹھنڈا پیش کیا جاتا ہے۔',
    6.0, 9.0, 290.0, 'kg', '["1.0"]', 80.0,
    'https://images.unsplash.com/photo-1600788907416-456578634209?auto=format&fit=crop&w=800&q=80',
    1, 1
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE name_en = 'Sweet Milk (Meetha Doodh)'
)
""")

cur.execute("""
INSERT INTO products (
    name_en, name_ur, category, description_en, description_ur,
    fat_percentage, snf_percentage, base_price, unit_type, available_units,
    stock_quantity, image_url, is_fresh_batch, is_organic
) SELECT
    'Traditional Rice Keer', 'روایتی چاول کی کھیر', 'specials',
    'Slow-cooked rice pudding made with rich farm milk, cardamom and a delicate natural sweetness.',
    'فارم کے بھرپور دودھ، الائچی اور قدرتی مٹھاس سے دھیمی آنچ پر تیار کردہ چاول کی کھیر۔',
    8.0, 10.0, 2000.0, 'kg', '["0.5", "1.0"]', 60.0,
    'https://images.unsplash.com/photo-1579888944880-d98341245702?auto=format&fit=crop&w=800&q=80',
    1, 1
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE name_en = 'Traditional Rice Keer'
)
""")

# Replace the catalog with the original Abdul Salam Dairy product list and
# package/price variants supplied by the owner.
exact_products = [
    (
        'Fresh Milk', 'دودھ', 'milk',
        'Fresh farm milk from healthy dairy livestock.',
        'صحت مند فارم مویشیوں کا تازہ دودھ۔',
        6.8, 9.2, 270.0, 'kg',
        json.dumps(['0.5', '1.0', '2.0', '5.0']),
        450.0, '/assets/dairy-products/milk.png'
    ),
    (
        'Yogurt', 'دہی', 'yogurt_cream',
        'Fresh thick yogurt prepared from pure farm milk.',
        'خالص فارم دودھ سے تیار کردہ گاڑھا تازہ دہی۔',
        5.2, 8.8, 290.0, 'kg',
        json.dumps(['0.5', '1.0']),
        180.0, '/assets/dairy-products/yogurt.png'
    ),
    (
        'Sweet Milk', 'میٹھا دودھ', 'specials',
        'Sweet, creamy milk served in a sealed bottle.',
        'سیل بند بوتل میں میٹھا اور کریمی دودھ۔',
        6.0, 9.0, 100.0, 'bottle',
        json.dumps(['1.0']),
        80.0, '/assets/dairy-products/sweet-milk.webp'
    ),
    (
        'Desi Ghee', 'دیسی گھی', 'ghee_butter',
        'Traditional pure desi ghee prepared by the bilona method.',
        'روایتی بِلونا طریقے سے تیار کردہ خالص دیسی گھی۔',
        99.8, 0.1, 3500.0, 'kg',
        json.dumps(['0.5', '1.0']),
        95.0, '/assets/dairy-products/ghee.jpg'
    ),
    (
        'Paneer', 'پنیر', 'cheese',
        'Fresh soft paneer prepared from pure farm milk.',
        'خالص فارم دودھ سے تیار کردہ تازہ نرم پنیر۔',
        22.0, 16.5, 2000.0, 'kg',
        json.dumps(['0.5', '1.0']),
        85.0, '/assets/dairy-products/paneer.jpg'
    ),
    (
        'Kheer', 'کھیر', 'specials',
        'Traditional slow-cooked rice kheer made with rich farm milk.',
        'فارم کے بھرپور دودھ سے تیار کردہ روایتی دھیمی کھیر۔',
        8.0, 10.0, 400.0, 'kg',
        json.dumps(['0.5', '1.0']),
        60.0, '/assets/dairy-products/kheer.jpg'
    ),
    (
        'Khoya', 'کھویا', 'specials',
        'Pure traditional khoya prepared by reducing fresh farm milk.',
        'تازہ فارم دودھ کو گاڑھا کر تیار کردہ خالص کھویا۔',
        28.0, 24.0, 1300.0, 'kg',
        json.dumps(['0.5', '1.0']),
        40.0, '/assets/dairy-products/khoya.jpg'
    )
]

exact_names = [product[0] for product in exact_products]
placeholders = ','.join('?' for _ in exact_names)
cur.execute(
    f'DELETE FROM products WHERE name_en NOT IN ({placeholders})',
    exact_names
)

cur.executemany("""
UPDATE products
SET name_ur = ?, category = ?, description_en = ?, description_ur = ?,
    fat_percentage = ?, snf_percentage = ?, base_price = ?, unit_type = ?,
    available_units = ?, stock_quantity = ?, image_url = ?,
    is_fresh_batch = 1, is_organic = 1
WHERE name_en = ?
""", [
    (
        ur, category, description_en, description_ur,
        fat, snf, price, unit, units, stock, image,
        name
    )
    for (
        name, ur, category, description_en, description_ur,
        fat, snf, price, unit, units, stock, image
    ) in exact_products
])

cur.executemany("""
INSERT INTO products (
    name_en, name_ur, category, description_en, description_ur,
    fat_percentage, snf_percentage, base_price, unit_type, available_units,
    stock_quantity, image_url, is_fresh_batch, is_organic
) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_en = ?)
""", [
    (
        name, ur, category, description_en, description_ur,
        fat, snf, price, unit, units, stock, image,
        name
    )
    for (
        name, ur, category, description_en, description_ur,
        fat, snf, price, unit, units, stock, image
    ) in exact_products
])

# Animal records are created by the farm owner.

if cur.execute("SELECT COUNT(*) FROM feed_inventory").fetchone()[0] == 0:
    cur.executemany("""
    INSERT INTO feed_inventory (name, category, quantity, unit, minimum_stock, unit_cost, supplier)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [
        ('Green Fodder', 'Green Fodder', 1250, 'kg', 400, 18, 'Raiwind Fodder Market'),
        ('Wanda', 'Wanda', 180, 'kg', 250, 145, 'KPK Feed Mills'),
        ('Wheat Bran', 'Wheat Bran (Chokar)', 420, 'kg', 150, 92, 'Lahore Grain Traders')
    ])

if cur.execute("SELECT COUNT(*) FROM finance_transactions").fetchone()[0] == 0:
    cur.executemany("""
    INSERT INTO finance_transactions
        (transaction_date, transaction_type, category, description, amount, payment_status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, [
        ('2026-10-30', 'income', 'Milk Sales', 'Daily milk dispatch', 18450, 'Paid'),
        ('2026-10-30', 'expense', 'Feed & Fodder', 'Weekly green fodder purchase', 9200, 'Paid'),
        ('2026-10-29', 'expense', 'Utilities', 'Chiller electricity bill', 6800, 'Paid')
    ])

if cur.execute("SELECT COUNT(*) FROM farm_notifications").fetchone()[0] == 0:
    cur.executemany("""
    INSERT INTO farm_notifications (notification_type, title, message, due_date)
    VALUES (?, ?, ?, ?)
    """, [
        ('feed', 'Low feed stock', 'Wanda inventory is below the configured minimum threshold.', '2026-11-17'),
        ('health', 'Vaccination follow-up', 'Review upcoming vaccination and deworming schedules.', '2026-11-20')
    ])

# Seed Milking Batches
cur.execute("SELECT COUNT(*) FROM milking_batches")
if cur.fetchone()[0] == 0:
    batches = [
        ('AS-BATCH-20261030-M01', 'BF-104 (Nili-Ravi Herd A)', 'Buffalo', 'Morning', 285.5, 6.9, 9.3, 3.8, '2026-10-30 05:30 AM', 'Approved & Packed', 'Dr. Arshad (Chief Vet)'),
        ('AS-BATCH-20261030-M02', 'CW-088 (Sahiwal Breed B)', 'Cow', 'Morning', 215.0, 4.5, 8.7, 3.6, '2026-10-30 06:15 AM', 'Approved & Packed', 'Dr. Arshad (Chief Vet)'),
        ('AS-BATCH-20261029-E01', 'BF-102 (Nili-Ravi Herd B)', 'Buffalo', 'Evening', 270.0, 6.7, 9.1, 4.0, '2026-10-29 05:45 PM', 'Dispatched to Chiller', 'M. Saleem (Dairy Tech)'),
        ('AS-BATCH-20261029-E02', 'CW-045 (Cholistani Cross)', 'Cow', 'Evening', 190.5, 4.3, 8.5, 3.9, '2026-10-29 06:30 PM', 'Dispatched to Chiller', 'M. Saleem (Dairy Tech)'),
        ('AS-BATCH-20261029-M01', 'BF-104 (Nili-Ravi Herd A)', 'Buffalo', 'Morning', 290.0, 6.8, 9.2, 3.7, '2026-10-29 05:25 AM', 'Processed (Dahi & Butter)', 'Zahid Khan (Plant Mgr)')
    ]
    cur.executemany("""
    INSERT INTO milking_batches (
        batch_code, livestock_tag, animal_type, session, yield_liters, 
        fat_percentage, snf_percentage, chiller_temp_c, milking_time, status, recorded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, batches)

if cur.execute("SELECT COUNT(*) FROM production_records").fetchone()[0] == 0:
    livestock_ids = {
        row[1]: row[0] for row in cur.execute("SELECT id, tag_id FROM livestock").fetchall()
    }
    batch_id = cur.execute(
        "SELECT id FROM milking_batches ORDER BY id ASC LIMIT 1"
    ).fetchone()
    cur.executemany("""
    INSERT INTO production_records (
        livestock_id, batch_id, session, production_date, yield_liters,
        fat_percentage, snf_percentage, lactometer_reading, inspected_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (livestock_ids.get('BF-104'), batch_id[0] if batch_id else None, 'Morning', '2026-10-30', 285.5, 6.9, 9.3, 29.5, 'Dr. Arshad'),
        (livestock_ids.get('CW-088'), batch_id[0] if batch_id else None, 'Morning', '2026-10-30', 215.0, 4.5, 8.7, 28.8, 'Dr. Arshad')
    ])

# Seed Initial Orders
cur.execute("SELECT COUNT(*) FROM orders")
if cur.fetchone()[0] == 0:
    orders = [
        (
            'ORD-9841',
            2,
            'Chaudhry Tariq',
            '+92 321 4455667',
            'House #42-B, Model Town, Lahore',
            'Morning (5:00 AM - 7:00 AM)',
            960.0,
            100.0,
            'Cash on Delivery',
            'Paid',
            'Delivered',
            'Leave milk glass bottles on front porch cooler box',
            json.dumps([
                {"productId": 1, "name": "Pure Buffalo Milk", "unit": "1.0L", "qty": 4, "price": 240.0}
            ])
        ),
        (
            'ORD-9842',
            2,
            'Begum Salma Farooq',
            '+92 301 9882314',
            'Plot 18, Block G, DHA Phase 5, Lahore',
            'Morning (5:00 AM - 7:00 AM)',
            3500.0,
            50.0,
            'JazzCash',
            'Paid',
            'Out for Delivery',
            'Please ring bell twice upon arrival',
            json.dumps([
                {"productId": 1, "name": "Pure Buffalo Milk", "unit": "2.0L", "qty": 2, "price": 480.0},
                {"productId": 3, "name": "Artisanal Pure Desi Ghee", "unit": "1.0kg", "qty": 1, "price": 2400.0},
                {"productId": 5, "name": "Thick Sweet & Sour Dahi", "unit": "1.0kg", "qty": 1, "price": 260.0}
            ])
        ),
        (
            'ORD-9843',
            2,
            'Mian Hamza Rafiq',
            '+92 333 4128990',
            'Bungalow 7, Canal View Society, Lahore',
            'Evening (5:00 PM - 7:00 PM)',
            1320.0,
            100.0,
            'Cash on Delivery',
            'Pending',
            'Milked & Chilled',
            'Fresh evening milking batch preferred',
            json.dumps([
                {"productId": 2, "name": "Fresh Desi Cow Milk", "unit": "2.0L", "qty": 3, "price": 440.0}
            ])
        )
    ]
    cur.executemany("""
    INSERT INTO orders (
        order_code, customer_id, customer_name, customer_phone, delivery_address,
        delivery_slot, total_amount, bottle_deposit, payment_method, payment_status,
        order_status, order_notes, items_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, orders)

# Seed Initial Subscriptions
cur.execute("SELECT COUNT(*) FROM subscriptions")
if cur.fetchone()[0] == 0:
    subs = [
        (
            'SUB-801',
            2,
            'Chaudhry Tariq',
            '+92 321 4455667',
            'House #42-B, Model Town, Lahore',
            'Pure Buffalo Milk (Unpasteurized Raw)',
            3.0,
            'Daily',
            'Morning (5:00 AM - 7:00 AM)',
            '2026-10-01',
            'Active',
            1
        ),
        (
            'SUB-802',
            2,
            'Haji Muhammad Aslam',
            '+92 300 5511223',
            'Street 4, Cavalry Ground, Lahore Cantt',
            'Fresh Desi Cow Milk (A2 Protein)',
            2.0,
            'Daily',
            'Morning (5:00 AM - 7:00 AM)',
            '2026-10-15',
            'Active',
            1
        ),
        (
            'SUB-803',
            2,
            'Dr. Naila Kamal',
            '+92 332 9988776',
            'House 88, Sector Y, DHA Phase 3, Lahore',
            'Pure Buffalo Milk (Unpasteurized Raw)',
            4.0,
            'Alternate Days',
            'Evening (5:00 PM - 7:00 PM)',
            '2026-10-20',
            'Active',
            1
        )
    ]
    cur.executemany("""
    INSERT INTO subscriptions (
        subscription_code, customer_id, customer_name, customer_phone, delivery_address,
        product_name, quantity_liters, frequency, preferred_slot, start_date, status, bottle_return_policy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, subs)

conn.commit()
conn.close()
print("Database database/app.db successfully initialized and seeded with Abdul Salam Dairy Farm data!")
