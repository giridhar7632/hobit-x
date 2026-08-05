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
    const habit: any = await db.getFirstAsync(
      `SELECT current_streak, longest_streak, last_completed_date, base_points, total_points, planned_time_minutes 
       FROM habits WHERE id = ?`,
      [habit_id]
    );

    if (!habit) return formData;

    const existingEntry: any = await db.getFirstAsync(
      `SELECT id, status, actual_time_minutes, points, streak_on_day 
       FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) = ?`,
      [habit_id, todayISO]
    );

    const yesterdayEntry: any = await db.getFirstAsync(
      `SELECT streak_on_day FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) = ?`,
      [habit_id, yesterdayISO]
    );

    const addedMinutes = actual_time_minutes || 0;
    const targetMinutes = habit.planned_time_minutes || 0;
    const previousMinutes = existingEntry ? (existingEntry.actual_time_minutes || 0) : 0;
    const newTotalMinutes = previousMinutes + addedMinutes;

    let finalStatus = existingEntry ? existingEntry.status : status;

    if (finalStatus !== 'Completed' && status !== 'Missed') {
      if (status === 'Completed' || (targetMinutes > 0 && newTotalMinutes >= targetMinutes)) {
        finalStatus = 'Completed';
      } else {
        finalStatus = 'Partial';
      }
    } else if (status === 'Missed') {
      finalStatus = 'Missed';
    }

    const pointsPerMin = habit.base_points || 1;
    const earnedPoints = Math.round(pointsPerMin * addedMinutes);

    const countsForStreak = finalStatus === 'Completed' || finalStatus === 'Partial';
    const previouslyCounted = existingEntry && (existingEntry.status === 'Completed' || existingEntry.status === 'Partial');

    let newStreak = habit.current_streak || 0;
    let newLongest = habit.longest_streak || 0;
    let newLastCompleted = habit.last_completed_date;
    let streakOnDay = existingEntry ? (existingEntry.streak_on_day || 0) : 0;

    if (finalStatus === 'Missed') {
      newStreak = 0;
      streakOnDay = 0;
    } else if (countsForStreak && !previouslyCounted) {

      if (yesterdayEntry && yesterdayEntry.streak_on_day > 0) {
        newStreak = yesterdayEntry.streak_on_day + 1;
      } else {
        newStreak = 1;
      }

      newLongest = Math.max(newStreak, habit.longest_streak || 0);
      streakOnDay = newStreak;
    }

    if (finalStatus === 'Completed') {
      newLastCompleted = entry_date;
    }

    await db.runAsync('BEGIN TRANSACTION');

    if (existingEntry) {
      await db.runAsync(
        `UPDATE habit_entries 
         SET actual_time_minutes = ?, status = ?, points = points + ?, streak_on_day = ? 
         WHERE id = ?`,
        [newTotalMinutes, finalStatus, earnedPoints, streakOnDay, existingEntry.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO habit_entries (habit_id, entry_date, status, actual_time_minutes, points, streak_on_day)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [habit_id, entry_date, finalStatus, newTotalMinutes, earnedPoints, streakOnDay]
      );
    }

    await db.runAsync(
      `UPDATE habits 
       SET total_points = total_points + ?, current_streak = ?, longest_streak = ?, last_completed_date = ?
       WHERE id = ?`,
      [earnedPoints, newStreak, newLongest, newLastCompleted, habit_id]
    );

    await db.runAsync('COMMIT');
    return formData;
  } catch (error) {
    await db.runAsync('ROLLBACK');
    console.error('Error adding habit entry:', error);
    throw error;
  }
}