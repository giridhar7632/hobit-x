import { Alert } from "react-native";
import { getDb } from './database';
import { HabitStreak } from "./types";

export async function getHabits() {
  const db = await getDb();
  try {
    const result = await db.getAllAsync(
      `SELECT id, name, frequency, current_streak, longest_streak, description, planned_time_minutes, notify, total_points FROM habits`
    );
    return result;
  } catch (error: any) {
    Alert.alert('Error fetching habits', error.message);
    return [];
  }
}

export async function getHabitActivity(habitId: string) {
  const db = await getDb();
  try {
    const result = await db.getAllAsync(
      `SELECT id, entry_date, status, actual_time_minutes
       FROM habit_entries
       WHERE habit_id = ?
       ORDER BY entry_date DESC
       LIMIT 5`,
      [habitId]
    );
    return result;
  } catch (error: any) {
    Alert.alert('Error fetching habit activity', error.message);
    return [];
  }
}

export async function getHabitActivitySummary(habitId: string) {
  const db = await getDb();
  try {
    const rows = await db.getAllAsync(
      `SELECT entry_date, total_time_minutes
       FROM habit_entries_summary
       WHERE habit_id = ?
       ORDER BY entry_date DESC`,
      [habitId]
    );

    return rows.map((d: any) => ({
      date: d.entry_date,
      count: d.total_time_minutes,
    }));
  } catch (error: any) {
    Alert.alert('Error fetching habit activity summary', error.message);
    return [];
  }
}

export async function createHabit(formData: any) {
  const db = await getDb();
  const {
    name,
    frequency,
    description,
    planned_time_minutes,
    notify,
    total_points
  } = formData;

  try {
    const result = await db.runAsync(
      `INSERT INTO habits (name, frequency, description, planned_time_minutes, notify, total_points)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, frequency, description, planned_time_minutes, notify ? 1 : 0, total_points]
    );

    return { ...formData, id: result.lastInsertRowId };
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
}


export async function trackHabit(formData: any) {
  const db = await getDb();
  const { habit_id, entry_date, status, actual_time_minutes } = formData;

  try {
    await db.runAsync(
      `INSERT INTO habit_entries (habit_id, entry_date, status, actual_time_minutes)
       VALUES (?, ?, ?, ?)`,
      [habit_id, entry_date, status, actual_time_minutes]
    );
    return formData;
  } catch (error) {
    console.error('Error adding habit entry:', error);
    throw error;
  }
}

export async function deleteEntry(entry_id: number) {
  const db = await getDb();
  try {
    await db.runAsync(
      `DELETE FROM habit_entries WHERE id = ?`,
      [entry_id]
    );
    return entry_id;
  } catch (error) {
    console.error('Error deleting habit entry:', error);
    throw error;
  }
}

export async function deleteHabit(habitId: number) {
  const db = await getDb();
  try {
    await db.runAsync(
      `DELETE FROM habits WHERE id = ?`,
      [habitId]
    );
    return habitId;
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
}

export async function updateStreakOnComplete(habit_id: number, entry_date: string) {
  const db = await getDb();
  const today = new Date(entry_date);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const yesterdayISO = yesterday.toISOString().split('T')[0];
  const todayISO = today.toISOString().split('T')[0];

  const habit = await db.getFirstAsync(
    'SELECT current_streak, longest_streak, last_completed_date FROM habits WHERE id = ?',
    [habit_id]
  ) as HabitStreak | null

  let newStreak = 1;
  if (habit?.last_completed_date === yesterdayISO) {
    newStreak = (habit.current_streak || 0) + 1;
  }

  const newLongest = Math.max(newStreak, habit?.longest_streak || 0);

  await db.runAsync(
    `UPDATE habits
     SET current_streak = ?,
         longest_streak = ?,
         last_completed_date = ?
     WHERE id = ?`,
    [newStreak, newLongest, todayISO, habit_id]
  );

  await db.runAsync(
    `UPDATE habit_entries
     SET streak_on_day = ?
     WHERE habit_id = ? AND DATE(entry_date) = ?`,
    [newStreak, habit_id, todayISO]
  );
}
