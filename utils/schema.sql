-- Supabase PostgreSQL Schema for Hobit (Offline-First Habit Tracker)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    notify INTEGER DEFAULT 0 NOT NULL,
    notify_time TEXT,
    base_points REAL,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date TEXT,
    last_active_date TEXT,
    notification_ids TEXT DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Habit Entries Table
CREATE TABLE IF NOT EXISTS public.habit_entries (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note TEXT,
    actual_time_minutes INTEGER DEFAULT 0,
    entry_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Completed', 'Missed', 'Skipped', 'Partial')),
    points INTEGER DEFAULT 0,
    streak_on_day INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_id ON public.habit_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_id ON public.habit_entries(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_entry_date ON public.habit_entries(entry_date);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for `habits`
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
CREATE POLICY "Users can view their own habits"
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habits" ON public.habits;
CREATE POLICY "Users can insert their own habits"
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
CREATE POLICY "Users can update their own habits"
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;
CREATE POLICY "Users can delete their own habits"
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);

-- 7. RLS Policies for `habit_entries`
DROP POLICY IF EXISTS "Users can view their own habit entries" ON public.habit_entries;
CREATE POLICY "Users can view their own habit entries"
    ON public.habit_entries FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habit entries" ON public.habit_entries;
CREATE POLICY "Users can insert their own habit entries"
    ON public.habit_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habit entries" ON public.habit_entries;
CREATE POLICY "Users can update their own habit entries"
    ON public.habit_entries FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habit entries" ON public.habit_entries;
CREATE POLICY "Users can delete their own habit entries"
    ON public.habit_entries FOR DELETE
    USING (auth.uid() = user_id);
