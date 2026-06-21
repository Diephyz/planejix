const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'expenses.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    kind TEXT CHECK(kind IN ('fixed', 'variable', 'custom')),
    description TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    amount REAL NOT NULL CHECK(amount > 0),
    period TEXT NOT NULL DEFAULT 'monthly',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
`);

// Additive migrations
try { db.exec('ALTER TABLE users ADD COLUMN google_id TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN email TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN name TEXT'); } catch {}
try { db.exec("ALTER TABLE transactions ADD COLUMN recurring INTEGER NOT NULL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT"); } catch {}
try { db.exec("ALTER TABLE transactions ADD COLUMN recurring_parent_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN expires_at TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN approved INTEGER NOT NULL DEFAULT 1"); } catch {}

// Installment support
try { db.exec("ALTER TABLE transactions ADD COLUMN installment_total INTEGER DEFAULT NULL"); } catch {}
try { db.exec("ALTER TABLE transactions ADD COLUMN installment_current INTEGER DEFAULT NULL"); } catch {}
try { db.exec("ALTER TABLE transactions ADD COLUMN installment_group_id INTEGER DEFAULT NULL"); } catch {}

// Savings goals
db.exec(`
  CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL CHECK(target_amount > 0),
    current_amount REAL NOT NULL DEFAULT 0,
    deadline TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Subscription plan support
try { db.exec("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'"); } catch {}

// Due-date reminder support (e-mail): flags to avoid sending the same reminder twice
try { db.exec("ALTER TABLE transactions ADD COLUMN reminder_3d_sent_at TEXT DEFAULT NULL"); } catch {}
try { db.exec("ALTER TABLE transactions ADD COLUMN reminder_due_sent_at TEXT DEFAULT NULL"); } catch {}

// Ensure admin accounts are always admin, no expiration, and approved.
const adminUsername = process.env.ADMIN_USERNAME || 'Diephyz';
db.prepare("UPDATE users SET is_admin = 1, expires_at = NULL, approved = 1 WHERE LOWER(username) = LOWER(?)").run(adminUsername);
// Also promote by email (Google OAuth users)
const adminEmail = process.env.ADMIN_EMAIL || 'jeffbonis@gmail.com';
db.prepare("UPDATE users SET is_admin = 1, expires_at = NULL, approved = 1 WHERE email = ?").run(adminEmail);

module.exports = db;
