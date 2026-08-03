import { Alert } from "react-native";
import { getDb } from './database';
import { Habit, HabitEntry } from "./types";

export async function getHabits() {
  const db = await getDb();
  try {
    const result = await db.getAllAsync(
      `SELECT id, name, color, frequency, current_streak, longest_streak, description, planned_time_minutes, notify, notify_time, total_points, last_completed_date FROM habits`
    );
    return result;
  } catch (error: any) {
    Alert.alert('Error fetching habits', error.message);
    return [];
  }
}

export async function getHabitById(habitId: string): Promise<Habit | null> {
  const db = await getDb();
  try {
    const result = await db.getFirstAsync(
      `SELECT * FROM habits WHERE id = ?`,
      [habitId]
    );
    return result as Habit | null;
  } catch (error: any) {
    Alert.alert('Error fetching habit', error.message);
    return null;
  }
}

export async function getHabitActivity(habitId: string): Promise<HabitEntry[]> {
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
    return result as HabitEntry[];
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

export const getHabitCompletedDates = async (habitId: number): Promise<string[]> => {
  try {
    const db = await getDb();
    const result = await db.getAllAsync<{ date: string }>(
      `SELECT DATE(entry_date) as date 
       FROM habit_entries 
       WHERE habit_id = ? AND status = 'Completed'`,
      [habitId]
    );

    return result.map(row => row.date);
  } catch (error) {
    console.error("Error fetching completed dates:", error);
    return [];
  }
};

export const createHabit = async (habitData: any) => {
  try {
    const db = await getDb();
    const result = await db.runAsync(
      `INSERT INTO habits (
        name, 
        description, 
        color, 
        frequency, 
        planned_time_minutes, 
        interval, 
        target_days, 
        notify, 
        notify_time, 
        start_date, 
        base_points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        habitData.name,
        habitData.description,
        habitData.color,
        habitData.frequency,
        habitData.planned_time_minutes,
        habitData.interval,
        habitData.target_days,
        habitData.notify,
        habitData.notify_time,
        habitData.start_date,
        habitData.base_points
      ]
    );

    return result;
  } catch (error) {
    console.error("Error inserting habit:", error);
    throw error;
  }
};

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

export async function deleteEntry(entry_id: number, habit_id: string) {
  const db = await getDb();

  try {
    await db.runAsync('BEGIN TRANSACTION');

    const entryToDelete: any = await db.getFirstAsync(
      `SELECT points FROM habit_entries WHERE id = ?`,
      [entry_id]
    );
    const pointsToDeduct = entryToDelete?.points || 0;

    await db.runAsync(`DELETE FROM habit_entries WHERE id = ?`, [entry_id]);

    const stats: any = await db.getFirstAsync(
      `SELECT 
        (SELECT streak_on_day FROM habit_entries WHERE habit_id = $1 ORDER BY entry_date DESC LIMIT 1) as last_streak,
        (SELECT status FROM habit_entries WHERE habit_id = $1 ORDER BY entry_date DESC LIMIT 1) as last_status,
        (SELECT entry_date FROM habit_entries WHERE habit_id = $1 AND status = 'Completed' ORDER BY entry_date DESC LIMIT 1) as last_completed,
        MAX(streak_on_day) as max_streak 
       FROM habit_entries 
       WHERE habit_id = $1`,
      { $1: habit_id }
    );

    const newLongestStreak = stats?.max_streak || 0;
    const newLastCompleted = stats?.last_completed || null;
    const newCurrentStreak = stats?.last_status === 'Completed' ? (stats?.last_streak || 0) : 0;

    await db.runAsync(
      `UPDATE habits 
       SET total_points = MAX(0, total_points - ?),
           current_streak = ?,
           longest_streak = ?,
           last_completed_date = ?
       WHERE id = ?`,
      [pointsToDeduct, newCurrentStreak, newLongestStreak, newLastCompleted, habit_id]
    );

    await db.runAsync('COMMIT');

    return entry_id;
  } catch (error) {
    await db.runAsync('ROLLBACK');
    console.error('Error deleting habit entry:', error);
    throw error;
  }
}

export async function trackHabit(formData: any) {
  const db = await getDb();
  const { habit_id, entry_date, status, actual_time_minutes } = formData;

  const today = new Date(entry_date);
  const todayISO = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];

  try {
    const existing = await db.getFirstAsync(
      `SELECT id FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) = ?`,
      [habit_id, todayISO]
    );

    if (existing) {
      return formData;
    }

    const habit: any = await db.getFirstAsync(
      `SELECT current_streak, longest_streak, last_completed_date, base_points, total_points 
       FROM habits WHERE id = ?`,
      [habit_id]
    );

    const result = await db.runAsync(
      `INSERT INTO habit_entries (habit_id, entry_date, status, actual_time_minutes)
       VALUES (?, ?, ?, ?)`,
      [habit_id, entry_date, status, actual_time_minutes]
    );

    const newEntryId = result.lastInsertRowId;
    if (status === 'Completed' && habit) {
      const lastCompletedISO = habit.last_completed_date
        ? habit.last_completed_date.split('T')[0]
        : null;

      let newStreak = 1;
      if (lastCompletedISO === yesterdayISO) {
        newStreak = (habit.current_streak || 0) + 1;
      }
      const newLongest = Math.max(newStreak, habit.longest_streak || 0);

      const pointsPerMin = habit.base_points || 1;
      const earnedPoints = Math.round(pointsPerMin * (actual_time_minutes || 0));
      const newTotalPoints = (habit.total_points || 0) + earnedPoints;

      await db.runAsync(
        `UPDATE habits 
         SET current_streak = ?, 
             longest_streak = ?, 
             last_completed_date = ?,
             total_points = ?
         WHERE id = ?`,
        [newStreak, newLongest, entry_date, newTotalPoints, habit_id]
      );

      await db.runAsync(
        `UPDATE habit_entries 
         SET streak_on_day = ?, points = ?
         WHERE id = ?`,
        [newStreak, earnedPoints, newEntryId]
      );

    } else if (status === 'Missed') {
      await db.runAsync(
        `UPDATE habits SET current_streak = 0 WHERE id = ?`,
        [habit_id]
      );
    }

    return formData;
  } catch (error) {
    console.error('Error adding habit entry:', error);
    throw error;
  }
}