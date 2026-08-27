import { CustomAlert as Alert } from "@/utils/custom-alert";
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDb } from './database';
import { Habit, HabitEntry } from "./types";

export async function getHabits(): Promise<Habit[]> {
  const db = await getDb();
  try {
    const result = await db.getAllAsync<Habit>(
      `SELECT id, user_id, name, color, frequency, current_streak, longest_streak, description, planned_time_minutes, notify, notify_time, total_points, last_completed_date, last_active_date, notification_ids FROM habits`
    );
    return result || [];
  } catch (error: any) {
    Alert.alert('Error fetching habits', error.message);
    return [];
  }
}

export async function getHabitById(habitId: string): Promise<Habit | null> {
  const db = await getDb();
  try {
    const result = await db.getFirstAsync<Habit>(
      `SELECT * FROM habits WHERE id = ?`,
      [habitId]
    );
    return result || null;
  } catch (error: any) {
    Alert.alert('Error fetching habit', error.message);
    return null;
  }
}

export async function getHabitActivity(habitId: string): Promise<HabitEntry[]> {
  const db = await getDb();
  try {
    const result = await db.getAllAsync<HabitEntry>(
      `SELECT id, habit_id, user_id, entry_date, status, actual_time_minutes, points, streak_on_day, note
       FROM habit_entries
       WHERE habit_id = ?
       ORDER BY entry_date DESC
       LIMIT 10`,
      [habitId]
    );
    return result || [];
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

export const getHabitCompletedDates = async (habitId: string): Promise<{ date: string; status: string }[]> => {
  try {
    const db = await getDb();
    const result = await db.getAllAsync<{ date: string; status: string }>(
      `SELECT DATE(entry_date) as date, status
       FROM habit_entries 
       WHERE habit_id = ? AND status IN ('Completed', 'Skipped')`,
      [habitId]
    );

    return result || [];
  } catch (error) {
    console.error("Error fetching completed dates:", error);
    return [];
  }
};

export const createHabit = async (habitData: Partial<Habit> & { id?: string }): Promise<Habit> => {
  try {
    const db = await getDb();
    const id = habitData.id || Crypto.randomUUID();

    const fullHabit: Habit = {
      id,
      user_id: habitData.user_id || null,
      name: habitData.name || '',
      description: habitData.description || null,
      color: habitData.color || 'lime',
      time_spent: habitData.time_spent || 0,
      planned_time_minutes: habitData.planned_time_minutes || 0,
      frequency: habitData.frequency || 'daily',
      target_days: typeof habitData.target_days === 'string' ? habitData.target_days : JSON.stringify(habitData.target_days || []),
      interval: habitData.interval || 1,
      start_date: habitData.start_date || new Date().toISOString(),
      end_date: habitData.end_date || null,
      created_at: habitData.created_at || new Date().toISOString(),
      updated_at: null,
      notify: habitData.notify ?? 0,
      notify_time: habitData.notify_time || null,
      base_points: habitData.base_points ?? 15,
      total_points: habitData.total_points ?? 0,
      current_streak: habitData.current_streak ?? 0,
      longest_streak: habitData.longest_streak ?? 0,
      last_completed_date: habitData.last_completed_date || null,
      last_active_date: habitData.last_active_date || null,
      notification_ids: typeof habitData.notification_ids === 'string' ? habitData.notification_ids : JSON.stringify(habitData.notification_ids || []),
    };

    await db.runAsync(
      `INSERT INTO habits (
        id,
        user_id,
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
        base_points,
        notification_ids,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullHabit.id,
        fullHabit.user_id ?? null,
        fullHabit.name,
        fullHabit.description ?? null,
        fullHabit.color ?? 'lime',
        fullHabit.frequency ?? 'daily',
        fullHabit.planned_time_minutes ?? 0,
        fullHabit.interval ?? 1,
        fullHabit.target_days ?? '[]',
        fullHabit.notify ?? 0,
        fullHabit.notify_time ?? null,
        fullHabit.start_date ?? null,
        fullHabit.base_points ?? 15,
        fullHabit.notification_ids ?? '[]',
        fullHabit.created_at,
      ]
    );

    return fullHabit;
  } catch (error) {
    console.error("Error inserting habit:", error);
    throw error;
  }
};

export async function deleteHabit(habitId: string) {
  const db = await getDb();
  try {
    const habit: any = await db.getFirstAsync(
      `SELECT notification_ids FROM habits WHERE id = ?`,
      [habitId]
    );

    if (habit?.notification_ids && Platform.OS !== 'web') {
      try {
        const ids = typeof habit.notification_ids === 'string'
          ? JSON.parse(habit.notification_ids)
          : habit.notification_ids;

        for (const id of ids) {
          if (typeof id === 'string') {
            try {
              await Notifications.cancelScheduledNotificationAsync(id);
            } catch (e) {
              // Ignore individual cancellation failures
            }
          }
        }
      } catch (e) {
        console.warn("Error parsing/cancelling notifications during habit delete:", e);
      }
    }

    await db.runAsync(`DELETE FROM habit_entries WHERE habit_id = ?`, [habitId]);
    await db.runAsync(`DELETE FROM habits WHERE id = ?`, [habitId]);

    return habitId;
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
}

export async function deleteEntry(entry_id: string, habit_id: string) {
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
        (SELECT entry_date FROM habit_entries WHERE habit_id = $1 AND status IN ('Completed', 'Skipped', 'Partial') ORDER BY entry_date DESC LIMIT 1) as last_active,
        MAX(streak_on_day) as max_streak 
       FROM habit_entries 
       WHERE habit_id = $1`,
      { $1: habit_id }
    );

    const newLongestStreak = stats?.max_streak || 0;
    const newLastCompleted = stats?.last_completed || null;
    const newLastActive = stats?.last_active || null;
    const newCurrentStreak = stats?.last_status === 'Completed' || stats?.last_status === 'Partial'
      ? (stats?.last_streak || 0)
      : (stats?.last_status === 'Skipped' ? (stats?.last_streak || 0) : 0);

    await db.runAsync(
      `UPDATE habits 
       SET total_points = MAX(0, total_points - ?),
           current_streak = ?,
           longest_streak = ?,
           last_completed_date = ?,
           last_active_date = ?
       WHERE id = ?`,
      [pointsToDeduct, newCurrentStreak, newLongestStreak, newLastCompleted, newLastActive, habit_id]
    );

    const updatedHabit: any = await db.getFirstAsync(
      `SELECT total_points, current_streak, longest_streak, last_completed_date, last_active_date FROM habits WHERE id = ?`,
      [habit_id]
    );

    await db.runAsync('COMMIT');

    return {
      entry_id,
      habit_id,
      habit_stats: updatedHabit,
    };
  } catch (error) {
    await db.runAsync('ROLLBACK');
    console.error('Error deleting habit entry:', error);
    throw error;
  }
}

export async function trackHabit(formData: {
  entry_id?: string;
  habit_id: string;
  entry_date: string;
  status: 'Completed' | 'Missed' | 'Skipped' | 'Partial';
  actual_time_minutes?: number;
  note?: string;
  notification_ids?: string;
}) {
  const db = await getDb();
  const { habit_id, entry_date, status, actual_time_minutes, note } = formData;
  const entry_id = formData.entry_id || Crypto.randomUUID();

  const today = new Date(entry_date);
  const todayISO = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];

  try {
    const habit: any = await db.getFirstAsync(
      `SELECT current_streak, longest_streak, last_completed_date, last_active_date, base_points, total_points, planned_time_minutes 
       FROM habits WHERE id = ?`,
      [habit_id]
    );

    if (!habit) return { ...formData, entry_id };

    const existingEntry: any = await db.getFirstAsync(
      `SELECT id, status, actual_time_minutes, points, streak_on_day 
       FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) = ?`,
      [habit_id, todayISO]
    );

    const yesterdayEntry: any = await db.getFirstAsync(
      `SELECT streak_on_day, status FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) = ?`,
      [habit_id, yesterdayISO]
    );

    const addedMinutes = actual_time_minutes || 0;
    const targetMinutes = habit.planned_time_minutes || 0;
    const previousMinutes = existingEntry ? (existingEntry.actual_time_minutes || 0) : 0;
    const newTotalMinutes = previousMinutes + addedMinutes;

    let finalStatus: string;

    if (status === 'Skipped') {
      finalStatus = 'Skipped';
    } else if (status === 'Missed') {
      finalStatus = 'Missed';
    } else {
      finalStatus = existingEntry ? existingEntry.status : status;

      if (finalStatus !== 'Completed') {
        if (status === 'Completed' || (targetMinutes > 0 && newTotalMinutes >= targetMinutes)) {
          finalStatus = 'Completed';
        } else {
          finalStatus = 'Partial';
        }
      }
    }

    // Points calculation
    const pointsPerMin = habit.base_points || 1;
    const earnedPoints = finalStatus === 'Skipped' ? 0 : Math.round(pointsPerMin * addedMinutes);

    // Streak logic
    let newStreak = habit.current_streak || 0;
    let newLongest = habit.longest_streak || 0;
    let newLastCompleted = habit.last_completed_date;
    let newLastActive = habit.last_active_date;
    let streakOnDay = existingEntry ? (existingEntry.streak_on_day || 0) : 0;

    const countsForStreak = finalStatus === 'Completed' || finalStatus === 'Partial';
    const previouslyCounted = existingEntry && (existingEntry.status === 'Completed' || existingEntry.status === 'Partial');

    if (finalStatus === 'Missed') {
      newStreak = 0;
      streakOnDay = 0;
    } else if (finalStatus === 'Skipped') {
      streakOnDay = newStreak;
      newLastActive = entry_date;
    } else if (countsForStreak && !previouslyCounted) {
      const yesterdayKeepsStreak = yesterdayEntry &&
        yesterdayEntry.streak_on_day > 0 &&
        (yesterdayEntry.status === 'Completed' || yesterdayEntry.status === 'Partial' || yesterdayEntry.status === 'Skipped');

      if (yesterdayKeepsStreak) {
        newStreak = yesterdayEntry.streak_on_day + 1;
      } else {
        newStreak = 1;
      }

      newLongest = Math.max(newStreak, habit.longest_streak || 0);
      streakOnDay = newStreak;
    }

    if (finalStatus === 'Completed') {
      newLastCompleted = entry_date;
      newLastActive = entry_date;
    } else if (finalStatus === 'Partial') {
      newLastActive = entry_date;
    }

    await db.runAsync('BEGIN TRANSACTION');

    const effectiveEntryId = existingEntry ? existingEntry.id : entry_id;
    const finalMinutes = finalStatus === 'Skipped' ? 0 : newTotalMinutes;

    if (existingEntry) {
      await db.runAsync(
        `UPDATE habit_entries 
         SET actual_time_minutes = ?, status = ?, points = points + ?, streak_on_day = ?, note = ?
         WHERE id = ?`,
        [finalMinutes, finalStatus, earnedPoints, streakOnDay, note || existingEntry.note, existingEntry.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO habit_entries (id, habit_id, entry_date, status, actual_time_minutes, points, streak_on_day, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [effectiveEntryId, habit_id, entry_date, finalStatus, finalMinutes, earnedPoints, streakOnDay, note || null]
      );
    }

    let updateQuery = `UPDATE habits 
                   SET total_points = total_points + ?, 
                       current_streak = ?, 
                       longest_streak = ?, 
                       last_completed_date = ?,
                       last_active_date = ?`;

    let updateParams: any[] = [earnedPoints, newStreak, newLongest, newLastCompleted, newLastActive];

    if (formData.notification_ids) {
      updateQuery += `, notification_ids = ?`;
      updateParams.push(formData.notification_ids);
    }

    updateQuery += ` WHERE id = ?`;
    updateParams.push(habit_id);

    await db.runAsync(updateQuery, updateParams);

    const updatedHabit: any = await db.getFirstAsync(
      `SELECT total_points, current_streak, longest_streak, last_completed_date, last_active_date, notification_ids FROM habits WHERE id = ?`,
      [habit_id]
    );

    await db.runAsync('COMMIT');

    return {
      entry_id: effectiveEntryId,
      habit_id,
      entry_date,
      status: finalStatus,
      actual_time_minutes: finalMinutes,
      points: earnedPoints,
      streak_on_day: streakOnDay,
      note,
      habit_stats: updatedHabit,
    };
  } catch (error) {
    await db.runAsync('ROLLBACK');
    console.error('Error adding habit entry:', error);
    throw error;
  }
}

export async function recalculateStreaks() {
  const db = await getDb();
  try {
    await db.runAsync(
      `UPDATE habits SET current_streak = 0 
       WHERE current_streak > 0 
       AND (
         (last_active_date IS NOT NULL AND DATE(last_active_date) < DATE('now', '-1 day'))
         OR (last_active_date IS NULL AND last_completed_date IS NOT NULL AND DATE(last_completed_date) < DATE('now', '-1 day'))
       )`
    );
  } catch (error) {
    console.error('Error recalculating streaks:', error);
  }
}

export async function updateHabit(habitData: any) {
  const db = await getDb();
  try {
    await db.runAsync(
      `UPDATE habits SET 
        name = ?, 
        description = ?, 
        color = ?, 
        frequency = ?, 
        planned_time_minutes = ?, 
        interval = ?, 
        target_days = ?, 
        notify = ?, 
        notify_time = ?, 
        base_points = ?,
        notification_ids = ?,
        updated_at = datetime('now')
       WHERE id = ?`,
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
        habitData.base_points,
        habitData.notification_ids,
        habitData.id,
      ]
    );
    return habitData;
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
}

export const updateHabitNotificationIds = async ({ id, notification_ids }: { id: string, notification_ids: string }) => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE habits SET notification_ids = ? WHERE id = ?;`,
    [notification_ids, id]
  );
};