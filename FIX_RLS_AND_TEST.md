# Apply RLS Fix + Test Leave Submission

## Step 1: Fix RLS Policies (REQUIRED)

Open Supabase Studio: **http://127.0.0.1:54323**

Click "SQL Editor" → "New Query" → Paste this:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Parents can create leave requests for their children" ON leave_requests;
DROP POLICY IF EXISTS "Parents can view their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Faculty can view leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Faculty can update leave requests" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_select_policy" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_policy" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_policy" ON leave_requests;

-- Re-create with proper permissions
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

Click **"Run"**

## Step 2: Test in Browser Console

After refreshing the app, check browser console for:

```
[Parent Leave Submit] Student data: {...}
[Parent Leave Submit] Looking for class: "Class 10"
[Parent Leave Submit] Class lookup result: {...}
[Parent Leave Submit] Faculty lookup result: {...}
[Parent Leave Submit] ✅ Final Assigned Teacher ID: <uuid or null>
```

## Expected Results:

**If Teacher ID is NULL**:
- Class not found in `classes` table
- OR Faculty not assigned to that class
- Check `classes` and `faculty_subjects` tables

**If Teacher ID is present but 400 error**:
- RLS policy still blocking
- Re-run the SQL above

**If both working**:
- Leave request submits successfully ✅
- Faculty can see it in their portal ✅
