import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'local_database.json');

// Helper to initialize database file if it doesn't exist
const initDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      expenses: [],
      budgets: [],
      savingsGoals: [],
      reminders: [],
      posts: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
};

const readDb = () => {
  initDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading fallback database:", err);
    return { users: [], expenses: [], budgets: [], savingsGoals: [], reminders: [], posts: [] };
  }
};

const writeDb = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing fallback database:", err);
  }
};

export const dbFallback = {
  // Query all items in a table
  find: (table, query = {}) => {
    const db = readDb();
    const list = db[table] || [];
    return list.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Find single item
  findOne: (table, query = {}) => {
    const db = readDb();
    const list = db[table] || [];
    return list.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  // Insert a new item
  create: (table, record) => {
    const db = readDb();
    if (!db[table]) db[table] = [];
    const newRecord = {
      _id: Date.now().toString(),
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db[table].push(newRecord);
    writeDb(db);
    return newRecord;
  },

  // Update existing item
  update: (table, id, updates) => {
    const db = readDb();
    const list = db[table] || [];
    const idx = list.findIndex(item => item._id === id);
    if (idx === -1) return null;
    
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    db[table] = list;
    writeDb(db);
    return list[idx];
  },

  // Remove an item
  delete: (table, id) => {
    const db = readDb();
    const list = db[table] || [];
    const filtered = list.filter(item => item._id !== id);
    db[table] = filtered;
    writeDb(db);
    return true;
  }
};
