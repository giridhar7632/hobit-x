import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export const APP_NAME = 'hobit_app';
export const DB_NAME = `meridian_lite_${APP_NAME}.db`;

export const databaseMigrations = [
  // Version 1: Initial schema with UUID strings
  `
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      time_spent INTEGER DEFAULT 0,
      planned_time_minutes INTEGER DEFAULT 0,
      frequency TEXT NOT NULL DEFAULT 'daily',
      target_days TEXT,
      interval INTEGER DEFAULT 1,
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
      last_completed_date TEXT,
      last_active_date TEXT,
      notification_ids TEXT DEFAULT '[]'
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS habit_entries (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      user_id TEXT,
      note TEXT,
      actual_time_minutes INTEGER DEFAULT 0,
      entry_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Completed', 'Missed', 'Skipped', 'Partial')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      points INTEGER DEFAULT 0,
      streak_on_day INTEGER DEFAULT 0,
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
  `,
  `
    CREATE VIEW IF NOT EXISTS habit_entries_summary AS
      SELECT
        habit_entries.habit_id AS habit_id,
        DATE(habit_entries.entry_date) AS entry_date,
        SUM(habit_entries.actual_time_minutes) AS total_time_minutes
      FROM habit_entries
      GROUP BY habit_entries.habit_id, DATE(habit_entries.entry_date);
  `,
  `
    CREATE VIEW IF NOT EXISTS habit_streak_summary AS
      SELECT
        id AS habit_id,
        name,
        current_streak,
        longest_streak,
        last_completed_date
      FROM habits;
  `
];

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') {
    // On web, Meridian handles idb-keyval, but for direct sqlite calls we return or create db instance if available
    if (!dbInstance) {
      dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return dbInstance;
  }
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

export async function initDatabase() {
  if (Platform.OS === 'web') return;

  const db = await getDb();
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  // Run initial setup / ensure tables & views exist
  for (const migration of databaseMigrations) {
    await db.execAsync(migration);
  }

  // Recalculate streaks on app startup
  await db.runAsync(
    `UPDATE habits SET current_streak = 0 
     WHERE current_streak > 0 
     AND (
       (last_active_date IS NOT NULL AND DATE(last_active_date) < DATE('now', '-1 day'))
       OR (last_active_date IS NULL AND last_completed_date IS NOT NULL AND DATE(last_completed_date) < DATE('now', '-1 day'))
     )`
  );
}