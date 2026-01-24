# Quick Fix for Institution Status Blocking

## The Issue
Users can still login even when institution is inactive.

## Debugging Steps

### 1. Open Browser Console (F12)
When you try to login, look for these logs:

```
[AUTH] Checking institution status for institutionId: ...
[AUTH] Institution query result: ...
[AUTH] Institution status: ...
```

### 2. Check What You'll See

**If status column doesn't exist:**
```
[AUTH] Status column does not exist. Migration not run. Allowing login.
```
→ **Fix:** Run `add_academic_year_management.sql`

**If institution not found:**
```
[AUTH] Institution not found for id: ...
```
→ **Fix:** institutionId mismatch - check database

**If status is null or 'active':**
```
[AUTH] Institution status: active
```
→ **Fix:** Manually set status to inactive

### 3. Manual Database Check

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check if status column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'institutions' 
AND column_name = 'status';

-- 2. Check institution status
SELECT id, institution_id, name, status 
FROM institutions;

-- 3. Check user's institution_id
SELECT id, email, institution_id, role 
FROM profiles 
WHERE email = 'YOUR_USER_EMAIL';

-- 4. Manually set institution to inactive
UPDATE institutions 
SET status = 'inactive' 
WHERE institution_id = 'YOUR_INST_ID';
```

### 4. Force Status Check

Add this to your browser console BEFORE logging in:

```javascript
localStorage.setItem('DEBUG_AUTH', 'true');
```

Then login and check the console for detailed logs.

### 5. Nuclear Option - Force Logout

If users are already logged in, they won't be re-checked. Force logout:

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Most Likely Causes

1. **Migration Not Run** (90% likely)
   - Status column doesn't exist
   - Fix: Run `add_academic_year_management.sql`

2. **Status Not Set** (8% likely)
   - Column exists but value is NULL or 'active'
   - Fix: UPDATE institutions SET status = 'inactive'

3. **Cached Session** (2% likely)
   - User already logged in before status check was added
   - Fix: Logout and login again

## Quick Test

1. Open Supabase SQL Editor
2. Run: `SELECT status FROM institutions LIMIT 1;`
3. If error "column status does not exist" → Run migration
4. If returns NULL or 'active' → Update status manually
5. If returns 'inactive' → Check console logs

**Share the console logs and I'll tell you exactly what's wrong!**
