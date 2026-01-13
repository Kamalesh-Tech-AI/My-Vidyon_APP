# 🔍 ANALYTICS DATA NOT SHOWING - DIAGNOSTIC GUIDE

## Issue
Global Performance Indicators showing:
- Total Students: **0** (should be **1**)
- Faculty Count: **0** (should be **5**)

## ✅ Fix Applied

Updated `AdminInstitutionAnalytics.tsx` to:
1. Fetch ALL students and staff when no `institution_id` is in URL
2. Filter by `institution_id` when viewing specific institution
3. Check BOTH `profiles` and `staff_details` tables for staff count
4. Added debug logging to console

## 🔍 Diagnostic Steps

### Step 1: Check Browser Console
1. Open the Analytics page
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for log message: `Analytics Data Fetched:`
5. Check the values:
   ```javascript
   {
     institutionId: "...",  // Should match your institution
     studentCount: 1,       // Should be 1
     profilesStaffCount: X, // Count from profiles table
     staffDetailsCount: Y,  // Count from staff_details table
     finalStaffCount: 5     // Should be 5 (max of above two)
   }
   ```

### Step 2: Verify Data in Supabase

Run these queries in **Supabase SQL Editor**:

```sql
-- 1. Check total students
SELECT COUNT(*) as total_students FROM students;

-- 2. Check students by institution
SELECT 
  institution_id,
  COUNT(*) as student_count,
  STRING_AGG(name, ', ') as student_names
FROM students
GROUP BY institution_id;

-- 3. Check faculty in profiles table
SELECT COUNT(*) as faculty_count FROM profiles WHERE role = 'faculty';

-- 4. Check faculty by institution
SELECT 
  institution_id,
  COUNT(*) as faculty_count,
  STRING_AGG(email, ', ') as faculty_emails
FROM profiles
WHERE role = 'faculty'
GROUP BY institution_id;

-- 5. Check staff_details table
SELECT COUNT(*) as staff_details_count FROM staff_details;

-- 6. Check staff_details by institution
SELECT 
  institution_id,
  COUNT(*) as staff_count
FROM staff_details
GROUP BY institution_id;
```

### Step 3: Check URL Parameter

The Analytics page URL should be one of:
- `/admin/analytics` (shows ALL data across all institutions)
- `/admin/analytics/INST001` (shows data for institution INST001)

**Check**: What URL are you on? Copy it here: _______________

### Step 4: Verify institution_id Matches

Run this query to see all your institution IDs:

```sql
SELECT 
  institution_id,
  name,
  (SELECT COUNT(*) FROM students WHERE institution_id = i.institution_id) as students,
  (SELECT COUNT(*) FROM profiles WHERE institution_id = i.institution_id AND role = 'faculty') as faculty_profiles,
  (SELECT COUNT(*) FROM staff_details WHERE institution_id = i.institution_id) as faculty_staff_details
FROM institutions i;
```

This shows each institution with its student and staff counts.

## 🔧 Common Issues & Fixes

### Issue A: institution_id Mismatch
**Symptom**: Console shows `studentCount: 0, staffCount: 0`

**Cause**: The `institution_id` in the URL doesn't match the `institution_id` in the database

**Fix**:
```sql
-- Find the correct institution_id
SELECT institution_id, name FROM institutions;

-- Check what institution_id your student has
SELECT institution_id, name FROM students;

-- Check what institution_id your staff have
SELECT institution_id, email FROM profiles WHERE role = 'faculty';
```

Then navigate to: `/admin/analytics/YOUR_CORRECT_INSTITUTION_ID`

### Issue B: Data in Wrong Table
**Symptom**: Console shows `profilesStaffCount: 0` but you have 5 staff

**Cause**: Staff are in `staff_details` table, not `profiles` table

**Solution**: The code now checks BOTH tables and uses the maximum count!

### Issue C: Wrong Role Value
**Symptom**: Console shows `profilesStaffCount: 0` even though data exists

**Cause**: Staff have `role = 'teacher'` or `role = 'staff'` instead of `role = 'faculty'`

**Fix**:
```sql
-- Check what roles exist
SELECT DISTINCT role FROM profiles;

-- Update to 'faculty' if needed
UPDATE profiles 
SET role = 'faculty' 
WHERE email IN ('staff1@example.com', 'staff2@example.com', ...);
```

### Issue D: No institution_id on Records
**Symptom**: Console shows counts but they're 0 when filtering by institution

**Cause**: Students/staff records have NULL or empty `institution_id`

**Fix**:
```sql
-- Find records without institution_id
SELECT * FROM students WHERE institution_id IS NULL OR institution_id = '';
SELECT * FROM profiles WHERE institution_id IS NULL OR institution_id = '';

-- Update them
UPDATE students SET institution_id = 'YOUR_INSTITUTION_ID' WHERE institution_id IS NULL;
UPDATE profiles SET institution_id = 'YOUR_INSTITUTION_ID' WHERE institution_id IS NULL AND role = 'faculty';
```

## 📊 Expected Behavior After Fix

1. **Navigate to Analytics page**
2. **Console shows**:
   ```
   Analytics Data Fetched: {
     institutionId: "INST001",
     studentCount: 1,
     profilesStaffCount: 5,  // or 0 if staff are in staff_details
     staffDetailsCount: 0,   // or 5 if staff are here
     finalStaffCount: 5
   }
   ```
3. **Page displays**:
   - Total Students: **1**
   - Faculty Count: **5**
   - Retention Rate: **96.2%**
   - Active Sessions: **42** (or higher based on total users)

## 🚀 Testing Auto-Refresh

1. **Keep Analytics page open**
2. **In another tab**, go to Institution Panel → User Management
3. **Add a new student**
4. **Watch Analytics page** - should auto-update to show 2 students
5. **Add a new staff member**
6. **Watch Analytics page** - should auto-update to show 6 staff

## 📝 Report Back

After following these steps, please share:

1. **Console log output**: What does it show?
2. **SQL query results**: How many students/staff in each table?
3. **URL**: What URL are you viewing?
4. **institution_id**: What is your institution's ID?

This will help identify the exact issue!
