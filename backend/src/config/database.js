const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/restaurant.db');
const DATA_DIR = path.dirname(DB_PATH);

let dbInstance = null;
let dbReady = false;

async function initDb() {
  if (dbReady) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance._save = () => {
    const data = dbInstance.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  };

  dbInstance.run2 = (sql, params = []) => {
    dbInstance.run(sql, params);
    const row = dbInstance.exec('SELECT last_insert_rowid() as id');
    const lastInsertRowid = row[0]?.values[0][0];
    dbInstance._save();
    return { lastInsertRowid };
  };

  dbInstance.get2 = (sql, params = []) => {
    const res = dbInstance.exec(sql, params);
    if (!res.length || !res[0].values.length) return undefined;
    const cols = res[0].columns;
    return Object.fromEntries(cols.map((c, i) => [c, res[0].values[0][i]]));
  };

  dbInstance.all2 = (sql, params = []) => {
    const res = dbInstance.exec(sql, params);
    if (!res.length) return [];
    const cols = res[0].columns;
    return res[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
  };

  dbInstance.exec2 = (sql) => {
    dbInstance.exec(sql);
    dbInstance._save();
  };

  await initSchema();
  dbReady = true;
  console.log('✅ Database ready:', DB_PATH);
  return dbInstance;
}

async function initSchema() {
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER UNIQUE NOT NULL,
      qr_code TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_id TEXT NOT NULL,
      name_en TEXT NOT NULL,
      icon TEXT DEFAULT '🍽️',
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name_id TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description_id TEXT,
      description_en TEXT,
      price INTEGER NOT NULL,
      image_url TEXT,
      image_emoji TEXT DEFAULT '🍽️',
      is_available INTEGER DEFAULT 1,
      is_best_seller INTEGER DEFAULT 0,
      is_spicy INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      table_number INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      subtotal INTEGER DEFAULT 0,
      tax INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      midtrans_transaction_id TEXT,
      midtrans_payment_type TEXT,
      customer_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      menu_item_id INTEGER,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      notes TEXT
    );
  `);
  dbInstance._save();
}

function getDb() {
  if (!dbReady || !dbInstance) {
    throw new Error('Database not initialized - call initDb() first');
  }
  return dbInstance;
}

module.exports = { initDb, getDb };
