# QUICK FIX: Staff Count Showing 4 Instead of 5

## ✅ Code Already Updated
The `AdminInstitutions.tsx` file has been updated to count from both:
- `profiles` table (where `role = 'faculty'`)
- `staff_details` table

## 🔍 Find the Missing Staff Member

### Step 1: Run Simple Diagnostic
Open **Supabase Dashboard → SQL Editor** and run this query:

```sql
-- Show all faculty members
SELECT 
  email,
  full_name,
  institution_id,
  status
FROM public.profiles
WHERE role = 'faculty'
ORDER BY email;
```

This will show you all faculty members. Count them - you should see 5.

### Step 2: Check Institution ID
Run this to see faculty grouped by institution:

```sql
SELECT 
  COALESCE(institution_id, 'NO INSTITUTION ID') as institution_id,
  COUNT(*) as faculty_count,
  STRING_AGG(email, ', ') as emails
FROM public.profiles
WHERE role = 'faculty'
GROUP BY institution_id;
```

**Look for:**
- A faculty member with `NULL` or wrong `institution_id`
- A faculty member with `status = 'inactive'`

### Step 3: Check staff_details Table
```sql
SELECT COUNT(*) FROM public.staff_details;
```

If this returns 5, then your staff are in `staff_details` table, not `profiles`.

### Step 4: Compare Both Tables
```sql
-- Replace 'YOUR_INSTITUTION_ID' with your actual institution ID
SELECT 
  'profiles (faculty)' as source,
  COUNT(*) as count
FROM public.profiles
WHERE role = 'faculty' 
  AND institution_id = 'YOUR_INSTITUTION_ID'
UNION ALL
SELECT 
  'staff_details' as source,
  COUNT(*) as count
FROM public.staff_details
WHERE institution_id = 'YOUR_INSTITUTION_ID';
```

## 🔧 Common Fixes

### Fix 1: Wrong institution_id
```sql
UPDATE public.profiles 
SET institution_id = 'CORRECT_INSTITUTION_ID' 
WHERE email = 'missing-staff@example.com';
```

### Fix 2: Inactive status
```sql
UPDATE public.profiles 
SET status = 'active' 
WHERE email = 'missing-staff@example.com';
```

### Fix 3: Wrong role
```sql
UPDATE public.profiles 
SET role = 'faculty' 
WHERE email = 'missing-staff@example.com';
```

## 📁 Files to Use

1. **`simple_staff_diagnostic.sql`** ← Use this! (No errors)
2. ~~`debug_staff_count.sql`~~ (Has been fixed but use simple version above)

## ⚠️ Important Note

Your database uses a `user_role` enum with ONLY these valid values:
- `'admin'`
- `'institution'`
- `'faculty'` ← This is for staff/teachers
- `'parent'`
- `'student'`

Do NOT use `'staff'`, `'teacher'`, or `'instructor'` - they will cause errors!

## 🎯 Expected Result

After fixing any data issues and refreshing your browser, the Institution card should show **5** staff members.
