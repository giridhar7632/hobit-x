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
      description TEXT,
      time_spent INTEGER,
      planned_time_minutes INTEGER,
      frequency TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      notify INTEGER DEFAULT 0 NOT NULL,
      notify_time TEXT,
      base_points REAL,
      total_points INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_completed_date TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      note TEXT,
      actual_time_minutes INTEGER,
      entry_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Completed', 'Missed', 'Skipped')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      points INTEGER DEFAULT 0,
      streak_on_day INTEGER DEFAULT 0,
      FOREIGN KEY(habit_id) REFERENCES habits(id)
    );
  `);

  await db.execAsync(`
    CREATE VIEW IF NOT EXISTS habit_entries_summary AS
      SELECT
        habit_entries.habit_id AS habit_id,
        DATE(habit_entries.entry_date) AS entry_date,
        SUM(habit_entries.actual_time_minutes) AS total_time_minutes
      FROM habit_entries
      GROUP BY habit_entries.habit_id, DATE(habit_entries.entry_date);
  `);

  await db.execAsync(`
    CREATE VIEW IF NOT EXISTS habit_streak_summary AS
      SELECT
        h.id AS habit_id,
        h.name,
        MAX(h.current_streak) AS current_streak,
        MAX(h.longest_streak) AS longest_streak,
        h.last_completed_date
      FROM habits h;
  `);
}
