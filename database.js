import sqlite3 from "sqlite3";
import path from "path";
import process from "process";

sqlite3.verbose();

// Keep db.sqlite at repo root (commit it if you only need reads on Vercel)
const DBSOURCE = path.join(process.cwd(), "db.sqlite");

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error("DB open error:", err.message);
    throw err;
  }
  db.exec("PRAGMA foreign_keys = ON");
});

// Create tables only in local dev (writes won’t persist on Vercel)
if (process.env.NODE_ENV !== "production") {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        product_type TEXT,
        brand TEXT,
        url TEXT,
        price REAL
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS RecommendedSkinTypes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        skin_type TEXT,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS Ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        ingredient TEXT,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
      )
    `);
  });
}

export default db;
