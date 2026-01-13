# Students and Staff Data Fetching - Setup Guide

## Problem
The Institution cards are showing 0 for both Students and Staff counts.

## Solution Implemented

### 1. Code Changes ✅
Updated `src/pages/admin/AdminInstitutions.tsx` to fetch real counts from Supabase:
- Fetches student count from `students` table
- Fetches staff count from `profiles` table where `role = 'faculty'`
- Displays the actual counts on Institution cards

### 2. Database Setup Required

You need to ensure the following tables exist in your Supabase database:

#### Required Tables:
1. **`students`** table - stores student information
2. **`profiles`** table - stores all user profiles (including faculty with `role = 'faculty'`)

### 3. Steps to Fix

#### Step 1: Run the SQL Script in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/admin/setup_students_staff_tables.sql`
4. Copy and paste the entire content into the SQL Editor
5. Click **Run** to execute

This will:
- Create the `students` table if it doesn't exist
- Create the `staff_details` table (optional)
- Set up proper Row Level Security (RLS) policies
- Create indexes for better performance

#### Step 2: Verify Tables Exist
Run these queries in Supabase SQL Editor to verify:

```sql
-- Check if students table exists and has data
SELECT COUNT(*) as total_students FROM public.students;

-- Check students grouped by institution
SELECT 
  institution_id,
  COUNT(*) as student_count
FROM public.students
GROUP BY institution_id;

-- Check faculty/staff from profiles table
SELECT 
  institution_id,
  COUNT(*) as faculty_count
FROM public.profiles
WHERE role = 'faculty'
GROUP BY institution_id;
```

#### Step 3: Add Sample Data (if tables are empty)

If you don't have any data yet, you can add sample students:

```sql
-- Add sample students (replace 'YOUR_INSTITUTION_ID' with actual institution_id)
INSERT INTO public.students (institution_id, name, register_number, class_name, section, email)
VALUES 
  ('YOUR_INSTITUTION_ID', 'John Doe', 'STU001', '10', 'A', 'john@example.com'),
  ('YOUR_INSTITUTION_ID', 'Jane Smith', 'STU002', '10', 'A', 'jane@example.com'),
  ('YOUR_INSTITUTION_ID', 'Bob Johnson', 'STU003', '9', 'B', 'bob@example.com');
```

And sample faculty:

```sql
-- Add sample faculty (replace 'YOUR_INSTITUTION_ID' with actual institution_id)
-- First, you need to create auth users, then update their profiles
UPDATE public.profiles 
SET role = 'faculty', institution_id = 'YOUR_INSTITUTION_ID'
WHERE email = 'teacher@example.com';
```

### 4. How the Data Fetching Works

The updated code in `AdminInstitutions.tsx`:

```typescript
// For each institution, we fetch:
const { count: studentsCount } = await supabase
  .from('students')
  .select('id', { count: 'exact', head: true })
  .eq('institution_id', inst.institution_id);

const { count: staffCount } = await supabase
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .eq('institution_id', inst.institution_id)
  .eq('role', 'faculty');
```

### 5. Troubleshooting

If counts are still showing 0:

1. **Check institution_id matching**:
   - Ensure the `institution_id` in the `students` table matches the `institution_id` in the `institutions` table
   - Check case sensitivity

2. **Check RLS policies**:
   - Make sure you're authenticated when viewing the page
   - Verify RLS policies allow SELECT for authenticated users

3. **Check browser console**:
   - Open DevTools (F12)
   - Look for any Supabase errors in the Console tab
   - Check Network tab for failed API calls

4. **Verify data exists**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM public.students LIMIT 5;
   SELECT * FROM public.profiles WHERE role = 'faculty' LIMIT 5;
   ```

### 6. Alternative: Using Staff_Details Table

If you want to use a separate `staff_details` table instead of the `profiles` table:

Update the query in `AdminInstitutions.tsx` line 38-42:

```typescript
// Replace this:
const { count: staffCount } = await supabase
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .eq('institution_id', inst.institution_id)
  .eq('role', 'faculty');

// With this:
const { count: staffCount } = await supabase
  .from('staff_details')
  .select('id', { count: 'exact', head: true })
  .eq('institution_id', inst.institution_id);
```

## Summary

✅ **Code Updated**: AdminInstitutions.tsx now fetches real counts
✅ **SQL Scripts Created**: Ready to run in Supabase
⏳ **Action Required**: Run the SQL script in your Supabase dashboard

After running the SQL script and adding some data, the counts should display correctly!
