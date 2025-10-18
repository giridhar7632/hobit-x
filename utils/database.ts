import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('habitsApp.db');
  }
  return db;
}

export async function initDatabase() {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency TEXT,
      description TEXT,
      planned_time_minutes INTEGER,
      notify INTEGER,
      total_points INTEGER,
      user_id TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER,
      entry_date TEXT,
      status TEXT,
      actual_time_minutes INTEGER,
      FOREIGN KEY(habit_id) REFERENCES habits(id)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_entries_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER,
      entry_date TEXT,
      total_time_minutes INTEGER,
      FOREIGN KEY(habit_id) REFERENCES habits(id)
    );
  `);
}
