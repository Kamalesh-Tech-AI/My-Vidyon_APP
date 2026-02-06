# CRITICAL: Apply This SQL Migration Now

## The Problem
Your app is showing 400 errors because the `assigned_class_teacher_id` column doesn't exist.

## The Fix (30 seconds)

### Open Supabase Studio
```
http://127.0.0.1:54323
```

### Click "SQL Editor" → "New Query"

### Copy & Paste This SQL:
```sql
ALTER TABLE leave_requests 
ADD COLUMN assigned_class_teacher_id UUID REFERENCES profiles(id);

CREATE INDEX idx_leave_requests_teacher 
ON leave_requests(assigned_class_teacher_id, status);
```

### Click "Run" (or Ctrl+Enter)

### ✅ Success Message:
```
Success. No rows returned
```

## Then Test

1. Refresh your app
2. Login as faculty
3. Go to Faculty → Student Leave Requests
4. **You should now see the leave requests!**

---

**If You See Errors**: 
- Make sure Supabase is running (check http://127.0.0.1:54323 loads)
- Copy the SQL exactly as shown above
- No semicolons missing!
