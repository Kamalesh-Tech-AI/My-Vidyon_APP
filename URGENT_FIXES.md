# 🚨 URGENT: Apply These Fixes Now

## Issue 1: RLS Policies Blocking Access (400 Errors)

### Open Supabase Studio
```
http://127.0.0.1:54323
```

### SQL Editor → Run This First:
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Parents can create leave requests for their children" ON leave_requests;
DROP POLICY IF EXISTS "Parents can view their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Faculty can view leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Faculty can update leave requests" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_select_policy" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_policy" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_policy" ON leave_requests;

-- Create new policies
CREATE POLICY "parents_insert_leave_requests"
ON leave_requests FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM parents p WHERE p.profile_id = auth.uid() AND p.id = parent_id)
);

CREATE POLICY "parents_select_leave_requests"
ON leave_requests FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM parents p WHERE p.profile_id = auth.uid() AND p.id = parent_id)
);

CREATE POLICY "faculty_select_assigned_leave_requests"
ON leave_requests FOR SELECT TO authenticated
USING (assigned_class_teacher_id = auth.uid());

CREATE POLICY "faculty_update_assigned_leave_requests"
ON leave_requests FOR UPDATE TO authenticated
USING (assigned_class_teacher_id = auth.uid())
WITH CHECK (assigned_class_teacher_id = auth.uid());
```

## Issue 2: Class "9th" Not Found

**Problem**: Students have class_name = "9th" but classes table doesn't have this class.

### Check Results
Run: `node diagnose_class_issue.cjs`

### Likely Fix (after diagnosis):
```sql
-- Add missing class to classes table
INSERT INTO classes (name, institution_id)
VALUES ('9th', (SELECT id FROM institutions LIMIT 1))
ON CONFLICT DO NOTHING;

-- OR update students to match existing class names
-- (Check diagnose script output first!)
```

## ✅ After Applying Fixes

1. Refresh app
2. Try submitting leave again
3. Check console for:
   - `✅ Final Assigned Teacher ID: <uuid>` (not null!)
   - No more 400 errors
