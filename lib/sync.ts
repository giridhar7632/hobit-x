import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getDb } from '@/utils/database';
import { Habit, HabitEntry } from '@/utils/types';
import { Platform } from 'react-native';

/**
 * Pulls all habits and habit entries for the authenticated user from Supabase
 * and merges them into the local SQLite database.
 */
export async function pullFromCloud(userId: string): Promise<{ success: boolean; count?: number }> {
  if (!isSupabaseConfigured() || !userId) return { success: false };

  try {
    // 1. Fetch remote habits
    const { data: remoteHabits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    if (habitsError) {
      console.error('[Sync] Error fetching remote habits:', habitsError);
      return { success: false };
    }

    // 2. Fetch remote habit entries
    const { data: remoteEntries, error: entriesError } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', userId);

    if (entriesError) {
      console.error('[Sync] Error fetching remote entries:', entriesError);
      return { success: false };
    }

    if (Platform.OS !== 'web') {
      const db = await getDb();
      try {
        await db.withTransactionAsync(async () => {
          // Upsert habits into local SQLite
          for (const habit of remoteHabits || []) {
            await db.runAsync(
              `INSERT OR REPLACE INTO habits (
                id, user_id, name, description, color, time_spent, planned_time_minutes,
                frequency, target_days, interval, start_date, end_date, created_at,
                updated_at, notify, notify_time, base_points, total_points,
                current_streak, longest_streak, last_completed_date, last_active_date,
                notification_ids
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                habit.id,
                habit.user_id,
                habit.name,
                habit.description,
                habit.color,
                habit.time_spent ?? 0,
                habit.planned_time_minutes ?? 0,
                habit.frequency,
                typeof habit.target_days === 'string' ? habit.target_days : JSON.stringify(habit.target_days || []),
                habit.interval ?? 1,
                habit.start_date,
                habit.end_date,
                habit.created_at,
                habit.updated_at,
                habit.notify ?? 0,
                habit.notify_time,
                habit.base_points,
                habit.total_points ?? 0,
                habit.current_streak ?? 0,
                habit.longest_streak ?? 0,
                habit.last_completed_date,
                habit.last_active_date,
                typeof habit.notification_ids === 'string' ? habit.notification_ids : JSON.stringify(habit.notification_ids || []),
              ]
            );
          }

          // Upsert habit entries into local SQLite
          for (const entry of remoteEntries || []) {
            await db.runAsync(
              `INSERT OR REPLACE INTO habit_entries (
                id, habit_id, user_id, note, actual_time_minutes, entry_date,
                status, created_at, updated_at, points, streak_on_day
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                entry.id,
                entry.habit_id,
                entry.user_id,
                entry.note,
                entry.actual_time_minutes ?? 0,
                entry.entry_date,
                entry.status,
                entry.created_at,
                entry.updated_at,
                entry.points ?? 0,
                entry.streak_on_day ?? 0,
              ]
            );
          }
        });
      } catch (e) {
        console.error('[Sync] Error inserting remote data into SQLite transaction:', e);
        return { success: false };
      }
    }

    return {
      success: true,
      count: (remoteHabits?.length || 0) + (remoteEntries?.length || 0),
    };
  } catch (error) {
    console.error('[Sync] Pull from cloud exception:', error);
    return { success: false };
  }
}

/**
 * Pushes any existing local habits and entries to Supabase for the signed-in user.
 * Useful on first sign-in when the user created habits in guest mode.
 */
export async function pushAllToCloud(userId: string): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured() || !userId || Platform.OS === 'web') {
    return { success: false };
  }

  try {
    const db = await getDb();
    
    // 1. Assign local SQLite guest records to the authenticated user ID
    await db.runAsync(`UPDATE habits SET user_id = ? WHERE user_id IS NULL OR user_id != ?`, [userId, userId]);
    await db.runAsync(`UPDATE habit_entries SET user_id = ? WHERE user_id IS NULL OR user_id != ?`, [userId, userId]);

    // 2. Fetch the updated local habits and entries for this user
    const localHabits = (await db.getAllAsync<Habit>(`SELECT * FROM habits WHERE user_id = ?`, [userId])) || [];
    const localEntries = (await db.getAllAsync<HabitEntry>(`SELECT * FROM habit_entries WHERE user_id = ?`, [userId])) || [];

    if (localHabits.length > 0) {
      const habitsToUpload = localHabits.map((h) => ({
        id: h.id,
        user_id: userId,
        name: h.name,
        description: h.description,
        color: h.color,
        time_spent: h.time_spent ?? 0,
        planned_time_minutes: h.planned_time_minutes ?? 0,
        frequency: h.frequency || 'daily',
        target_days:
          typeof h.target_days === 'string'
            ? h.target_days
            : JSON.stringify(h.target_days || []),
        interval: h.interval ?? 1,
        start_date: h.start_date,
        end_date: h.end_date,
        notify: h.notify ?? 0,
        notify_time: h.notify_time,
        base_points: h.base_points,
        total_points: h.total_points ?? 0,
        current_streak: h.current_streak ?? 0,
        longest_streak: h.longest_streak ?? 0,
        last_completed_date: h.last_completed_date,
        last_active_date: h.last_active_date,
        notification_ids:
          typeof h.notification_ids === 'string'
            ? h.notification_ids
            : JSON.stringify(h.notification_ids || []),
        updated_at: new Date().toISOString(),
      }));

      const { error: habitsError } = await supabase.from('habits').upsert(habitsToUpload);
      if (habitsError) {
        console.error('[Sync] Error pushing habits to cloud:', habitsError);
        return { success: false };
      }
    }

    if (localEntries.length > 0) {
      const entriesToUpload = localEntries.map((e) => ({
        id: e.id,
        habit_id: e.habit_id,
        user_id: userId,
        note: e.note || null,
        actual_time_minutes: e.actual_time_minutes ?? 0,
        entry_date: e.entry_date,
        status: e.status,
        points: e.points ?? 0,
        streak_on_day: e.streak_on_day ?? 0,
        updated_at: new Date().toISOString(),
      }));

      const { error: entriesError } = await supabase.from('habit_entries').upsert(entriesToUpload);
      if (entriesError) {
        console.error('[Sync] Error pushing entries to cloud:', entriesError);
        return { success: false };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Sync] Push to cloud exception:', error);
    return { success: false };
  }
}
