# Faculty Creation Error - Action Required

## Current Status

You're getting: **"Edge Function returned a non-2xx status code"** (400 error)

This means the Edge Function is rejecting the request due to a validation error or database constraint.

---

## ✅ What I've Done

1. **Enhanced error logging** - The console will now show detailed error information
2. **Improved error messages** - You'll see the actual error from the database

---

## 🎯 **NEXT STEP: Try Adding Faculty Again**

Please try adding a faculty member one more time with the **browser console open** (F12).

### Use These Test Values:
```
Name: Test Faculty
Staff ID: TESTFAC001
Email: testfaculty@example.com  
Password: test123456
Role: Teacher
Department: (select any)
Subjects: (select at least one)
```

---

## 📋 What to Look For in Console

After clicking "Add Staff", you should see these logs:

```javascript
[STAFF] Creating faculty with data: { ... }
[STAFF] Edge Function response: { ... }
[STAFF] Error properties: { ... }
[STAFF] Error context: { ... }
[STAFF] Attempting to parse error body...
[STAFF] Parsed error body: { error: "...", details: "...", hint: "..." }
```

**The `Parsed error body` will show the EXACT error!**

---

## 🔍 Common Errors You Might See

### Error 1: Duplicate Email
```json
{
  "error": "duplicate key value violates unique constraint \"profiles_email_key\"",
  "details": "Key (email)=(test@example.com) already exists"
}
```
**Solution:** Use a different email address

### Error 2: Duplicate Staff ID  
```json
{
  "error": "duplicate key value violates unique constraint \"staff_details_staff_id_key\"",
  "details": "Key (staff_id)=(STF001) already exists"
}
```
**Solution:** Use a different Staff ID

### Error 3: Missing Table
```json
{
  "error": "relation \"staff_details\" does not exist"
}
```
**Solution:** Run database migrations

### Error 4: Foreign Key Violation
```json
{
  "error": "insert or update on table \"staff_details\" violates foreign key constraint",
  "details": "Key (institution_id)=(...) is not present in table \"institutions\""
}
```
**Solution:** Check institution_id is valid

---

## 🛠️ Quick Fixes

### If Email Already Exists:
1. Use a completely new email
2. Or delete the existing user from Supabase Dashboard

### If Staff ID Already Exists:
1. Use a unique Staff ID (e.g., `FAC-2024-001`)
2. Or check existing staff members

### If Table Missing:
Run migrations in Supabase:
```sql
-- Check if table exists
SELECT * FROM staff_details LIMIT 1;
```

---

## 📸 What to Share

If the error persists, please share:

1. **Screenshot of the console** showing all `[STAFF]` logs
2. **The parsed error body** (the JSON object)
3. **The data you're trying to submit**

This will help me provide an exact solution!

---

## 🚀 Try Now!

1. Open browser console (F12)
2. Try adding a faculty member
3. Check the console logs
4. Share the `Parsed error body` with me

The enhanced logging is already active - just try it now! 🎯
