# Fix for Missing Staff Count (Showing 4 instead of 5)

## Issue
You have 5 staff members but only 4 are showing on the Institution card.

## Root Cause
Staff data might be stored in two different tables:
1. `profiles` table (where `role = 'faculty'`)
2. `staff_details` table

The code was only checking the `profiles` table, so if one staff member was only in `staff_details`, they wouldn't be counted.

## Solution Applied ✅

Updated `src/pages/admin/AdminInstitutions.tsx` to check BOTH tables and use the maximum count:

```typescript
// Now checks both tables
const [profilesStaffResult, staffDetailsResult] = await Promise.all([
  supabase.from('profiles')...  // Check profiles table
  supabase.from('staff_details')...  // Check staff_details table
]);

// Use whichever has more records
const staffCount = Math.max(
  profilesStaffResult.count || 0,
  staffDetailsResult.count || 0
);
```

## Next Steps

### 1. Refresh the page
The code is now updated. Refresh your browser to see if it shows 5 staff members.

### 2. If still showing 4, run the diagnostic queries
Open `supabase/admin/debug_staff_count.sql` and run it in your Supabase SQL Editor.

This will show you:
- Total count in each table
- Which staff members are in which table
- Any staff with missing/incorrect `institution_id`
- Any staff with wrong `role` value

### 3. Common Issues to Check

**Issue A: Wrong institution_id**
```sql
-- Find staff with wrong/missing institution_id
SELECT email, institution_id FROM profiles WHERE role = 'faculty';
```

**Issue B: Wrong role value**
```sql
-- Check if role is spelled differently
SELECT DISTINCT role FROM profiles;
```

**Issue C: Inactive status**
```sql
-- Check if one staff is marked inactive
SELECT email, status FROM profiles WHERE role = 'faculty';
```

### 4. Fix Data Issues

If you find the missing staff member, update their record:

```sql
-- Fix institution_id
UPDATE profiles 
SET institution_id = 'YOUR_INSTITUTION_ID' 
WHERE email = 'missing-staff@example.com';

-- Fix role
UPDATE profiles 
SET role = 'faculty' 
WHERE email = 'missing-staff@example.com';

-- Fix status
UPDATE profiles 
SET status = 'active' 
WHERE email = 'missing-staff@example.com';
```

## Files Created

1. ✅ `debug_staff_count.sql` - Diagnostic queries to find the issue
2. ✅ `STAFF_COUNTING_OPTIONS.js` - Reference showing different counting methods
3. ✅ Updated `AdminInstitutions.tsx` - Now counts from both tables

## Expected Result

After refreshing the page, you should see **5** staff members displayed on the Institution card.

If you're still seeing 4, run the diagnostic queries to identify which staff member is missing and why.
