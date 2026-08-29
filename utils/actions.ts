import { CustomAlert as Alert } from "@/utils/custom-alert";
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDb } from './database';
import { getHabitTotalReminders } from './notifications';
import { Habit, HabitEntry } from "./types";

export async function getHabits(): Promise<Habit[]> {
  const db = await getDb();
  const todayISO = new Date().toISOString().split('T')[0];
  try {
    const result = await db.getAllAsync<Habit>(
      `SELECT 
         h.*,
         COALESCE((
           SELECT COUNT(*) 
           FROM habit_entries he 
           WHERE he.habit_id = h.id 
             AND DATE(he.entry_date) = ? 
             AND he.status IN ('Completed', 'Partial')
         ), 0) AS today_completed_count,
         COALESCE((
           SELECT SUM(he.actual_time_minutes) 
           FROM habit_entries he 
           WHERE he.habit_id = h.id 
             AND DATE(he.entry_date) = ?
         ), 0) AS today_tracked_minutes
       FROM habits h`,
      [todayISO, todayISO]
    );
    return result || [];
  } catch (error: any) {
    Alert.alert('Error fetching habits', error.message);
    return [];
  }
}

export async function getHabitById(habitId: string): Promise<Habit | null> {
  const db = await getDb();
  const todayISO = new Date().toISOString().split('T')[0];
  try {
    const result = await db.getFirstAsync<Habit>(
      `SELECT 
         h.*,
         COALESCE((
           SELECT COUNT(*) 
           FROM habit_entries he 
           WHERE he.habit_id = h.id 
             AND DATE(he.entry_date) = ? 
             AND he.status IN ('Completed', 'Partial')
         ), 0) AS today_completed_count,
         COALESCE((
           SELECT SUM(he.actual_time_minutes) 
           FROM habit_entries he 
           WHERE he.habit_id = h.id 
             AND DATE(he.entry_date) = ?
         ), 0) AS today_tracked_minutes
       FROM habits h
       WHERE h.id = ?`,
      [todayISO, todayISO, habitId]
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

export async function getHabitCompletedDates(habitId: string): Promise<{ date: string; status: string }[]> {
  const db = await getDb();
  try {
    const rows = await db.getAllAsync<{ entry_date: string; status: string }>(
      `SELECT DISTINCT DATE(entry_date) as entry_date, status
       FROM habit_entries
       WHERE habit_id = ? AND status IN ('Completed', 'Skipped', 'Partial')
       ORDER BY entry_date ASC`,
      [habitId]
    );
    return rows.map(r => ({ date: r.entry_date, status: r.status })) || [];
  } catch (error: any) {
    Alert.alert('Error fetching completed dates', error.message);
    return [];
  }
}

export async function createHabit(habitData: any) {
  const db = await getDb();
  try {
    const fullHabit = {
      id: habitData.id || Crypto.randomUUID(),
      user_id: habitData.user_id || null,
      name: habitData.name,
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
      `INSERT INTO habits (id, user_id, name, description, color, frequency, planned_time_minutes, interval, target_days, notify, notify_time, start_date, base_points, notification_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullHabit.id, fullHabit.user_id, fullHabit.name, fullHabit.description, fullHabit.color, fullHabit.frequency, fullHabit.planned_time_minutes, fullHabit.interval, fullHabit.target_days, fullHabit.notify, fullHabit.notify_time, fullHabit.start_date, fullHabit.base_points, fullHabit.notification_ids, fullHabit.created_at]
    );

    return fullHabit;
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
}

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

    const habit: any = await db.getFirstAsync(`SELECT notify, notify_time FROM habits WHERE id = ?`, [habit_id]);
    const totalReminders = getHabitTotalReminders(habit);
    const todayISO = new Date().toISOString().split('T')[0];
    const todayEntriesCount = (await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) = ? AND status IN ('Completed', 'Partial')`,
      [habit_id, todayISO]
    ))?.cnt || 0;

    const newLongestStreak = stats?.max_streak || 0;
    let newLastCompleted = stats?.last_completed || null;
    if (todayEntriesCount < totalReminders) {
      const prevCompleted: any = await db.getFirstAsync(
        `SELECT entry_date FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) < ? AND status = 'Completed' ORDER BY entry_date DESC LIMIT 1`,
        [habit_id, todayISO]
      );
      newLastCompleted = prevCompleted?.entry_date || null;
    }

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

export async function untrackHabitToday(habit_id: string) {
  const db = await getDb();
  const todayISO = new Date().toISOString().split('T')[0];
  try {
    const todayEntry: any = await db.getFirstAsync(
      `SELECT id FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) = ? ORDER BY entry_date DESC LIMIT 1`,
      [habit_id, todayISO]
    );
    if (todayEntry) {
      return await deleteEntry(todayEntry.id, habit_id);
    }
    return null;
  } catch (error) {
    console.error('Error untracking habit today:', error);
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
  const todayISO = new Date(entry_date).toISOString().split('T')[0];

  const yesterday = new Date(entry_date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];

  try {
    const habit: any = await db.getFirstAsync(
      `SELECT * FROM habits WHERE id = ?`,
      [habit_id]
    );

    if (!habit) return { ...formData, entry_id };

    const totalReminders = getHabitTotalReminders(habit);

    const todayEntries: any = await db.getFirstAsync(
      `SELECT COUNT(*) as count, SUM(actual_time_minutes) as total_minutes, SUM(points) as total_points
       FROM habit_entries 
       WHERE habit_id = ? AND DATE(entry_date) = ? AND status IN ('Completed', 'Partial')`,
      [habit_id, todayISO]
    );

    const todayCount = todayEntries?.count || 0;

    const yesterdayEntry: any = await db.getFirstAsync(
      `SELECT streak_on_day, status FROM habit_entries WHERE habit_id = ? AND DATE(entry_date) = ? AND status IN ('Completed', 'Partial', 'Skipped') ORDER BY entry_date DESC LIMIT 1`,
      [habit_id, yesterdayISO]
    );

    const addedMinutes = actual_time_minutes || habit.planned_time_minutes || 0;
    const pointsPerMin = habit.base_points || 1;
    const earnedPoints = status === 'Skipped' ? 0 : Math.round(pointsPerMin * addedMinutes);

    let newStreak = habit.current_streak || 0;
    let newLongest = habit.longest_streak || 0;
    let newLastCompleted = habit.last_completed_date;
    let newLastActive = entry_date;
    let streakOnDay = newStreak;

    const countsForStreak = status === 'Completed' || status === 'Partial';

    if (status === 'Missed') {
      newStreak = 0;
      streakOnDay = 0;
    } else if (status === 'Skipped') {
      streakOnDay = newStreak;
    } else if (countsForStreak) {
      if (todayCount === 0) {
        const yesterdayKeepsStreak = yesterdayEntry && yesterdayEntry.streak_on_day > 0;
        newStreak = yesterdayKeepsStreak ? yesterdayEntry.streak_on_day + 1 : 1;
        newLongest = Math.max(newStreak, habit.longest_streak || 0);
        streakOnDay = newStreak;
      } else {
        streakOnDay = newStreak;
      }
    }

    const newTodayCount = todayCount + (countsForStreak ? 1 : 0);
    if (newTodayCount >= totalReminders) {
      newLastCompleted = entry_date;
    }

    await db.runAsync('BEGIN TRANSACTION');

    await db.runAsync(
      `INSERT INTO habit_entries (id, habit_id, entry_date, status, actual_time_minutes, points, streak_on_day, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry_id, habit_id, entry_date, status, addedMinutes, earnedPoints, streakOnDay, note || null]
    );

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
      entry_id,
      habit_id,
      entry_date,
      status,
      actual_time_minutes: addedMinutes,
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