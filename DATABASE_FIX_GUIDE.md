# Database Issues - Quick Fix Guide

## Current Errors

You're seeing these errors because some tables don't exist in your database:

1. ❌ `grades` table - 404 Not Found
2. ❌ `academic_events` table - 400 Bad Request
3. ❌ `assignments` table - 400 Bad Request
4. ❌ `students` table - 400 Bad Request (column issue)

## Solution: Run the Complete Database Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run the Complete Setup**
   - Open file: `complete_database_setup.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Run the Migration**
   - After the main setup completes
   - Open file: `supabase/migrations/add_academic_year_management.sql`
   - Copy contents
   - Paste into a new query
   - Click "Run"

### Option 2: Quick Fix - Create Missing Tables

If you don't want to run the full setup, run this SQL to create missing tables:

```sql
-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    marks DECIMAL NOT NULL,
    total_marks DECIMAL NOT NULL DEFAULT 100,
    exam_type TEXT,
    date DATE NOT NULL,
    grade_letter TEXT,
    remarks TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create academic_events table
CREATE TABLE IF NOT EXISTS public.academic_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for grades
CREATE POLICY "Users can view grades from their institution"
    ON public.grades FOR SELECT
    USING (
        institution_id IN (
            SELECT institution_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Create RLS policies for academic_events
CREATE POLICY "Users can view events from their institution"
    ON public.academic_events FOR SELECT
    USING (
        institution_id IN (
            SELECT institution_id FROM public.profiles WHERE id = auth.uid()
        )
    );
```

### Verification

After running the setup, verify tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('grades', 'academic_events', 'assignments', 'students', 'institutions');

-- Check columns in institutions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'institutions';
```

## Why This Happened

Your database is missing some core tables. This usually happens when:
1. The initial database setup wasn't run completely
2. Tables were accidentally deleted
3. You're using a fresh Supabase project

## Next Steps

1. ✅ Run `complete_database_setup.sql` in Supabase SQL Editor
2. ✅ Run `supabase/migrations/add_academic_year_management.sql`
3. ✅ Refresh your application
4. ✅ Test login and navigation

The errors should disappear once all tables are created!
