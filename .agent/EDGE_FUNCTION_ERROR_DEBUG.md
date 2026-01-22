# Edge Function Error - Debugging Guide

## Error Encountered
**"Edge Function returned a non-2xx status code"**

This error occurs when the Supabase Edge Function `create-user` fails to create a faculty member.

---

## Improvements Made

### ✅ Enhanced Error Handling

I've added comprehensive error logging and better error messages to help identify the exact issue:

1. **Detailed Console Logging:**
   - Logs the data being sent to the Edge Function
   - Logs the complete response from the Edge Function
   - Logs the full error object with all details

2. **Better Error Messages:**
   - Extracts the actual error message from the Edge Function response
   - Adds helpful context (e.g., "Email might already be in use")
   - Shows errors for 5 seconds instead of default duration

3. **Response Validation:**
   - Checks if the response contains an error even if the HTTP call succeeded
   - Handles both HTTP errors and application-level errors

---

## Next Steps to Debug

### Step 1: Check Browser Console

1. **Open Browser DevTools** (F12 or Right-click → Inspect)
2. **Go to Console tab**
3. **Try adding a faculty member again**
4. **Look for these logs:**

```javascript
[STAFF] Creating faculty with data: { ... }
[STAFF] Edge Function response: { ... }
[STAFF] Edge Function error details: { ... }
[STAFF] Full error object: { ... }
```

### Step 2: Identify the Error

The console will now show the **exact error message** from the Edge Function. Common errors include:

#### **A. Email Already Exists**
```
Error: User with this email already exists
```
**Solution:** Use a different email address

#### **B. Staff ID Already Exists**
```
Error: Staff ID already exists
```
**Solution:** Use a different Staff ID

#### **C. Missing Required Fields**
```
Error: Missing required field: ...
```
**Solution:** Ensure all required fields are filled

#### **D. Database Constraint Violation**
```
Error: duplicate key value violates unique constraint
```
**Solution:** Check for duplicate values in unique fields

#### **E. Permission/Authorization Error**
```
Error: Unauthorized / Permission denied
```
**Solution:** Check if the Edge Function has proper permissions

---

## Common Issues & Solutions

### Issue 1: Email Already in Use

**Error Message:**
```
Failed to create staff member (Email might already be in use)
```

**Solutions:**
1. Use a different email address
2. Check if the user already exists in the system
3. Delete the existing user if it's a duplicate

---

### Issue 2: Staff ID Conflict

**Error Message:**
```
Failed to create staff member (Staff ID might already exist)
```

**Solutions:**
1. Use a unique Staff ID
2. Check existing staff members for ID conflicts
3. Implement auto-generated Staff IDs

---

### Issue 3: Edge Function Not Deployed

**Error Message:**
```
FunctionsHttpError: Edge Function not found
```

**Solutions:**
1. Deploy the `create-user` Edge Function:
   ```bash
   supabase functions deploy create-user
   ```
2. Check Supabase Dashboard → Edge Functions
3. Verify the function is active

---

### Issue 4: Database Table Missing

**Error Message:**
```
relation "faculty_profiles" does not exist
```

**Solutions:**
1. Run database migrations
2. Check if all required tables exist:
   - `profiles`
   - `faculty_profiles`
   - `staff_details`
   - `faculty_subjects`

---

### Issue 5: Invalid Data Format

**Error Message:**
```
Invalid input syntax for type ...
```

**Solutions:**
1. Check date format (should be YYYY-MM-DD)
2. Verify phone number format
3. Ensure email is valid format

---

## Testing Procedure

### Test 1: Add Faculty with Minimal Data
```
Name: Test Faculty
Staff ID: TEST001
Email: test.faculty@example.com
Password: test123456
```

**Expected:** Should create successfully or show specific error

### Test 2: Add Faculty with All Fields
```
Name: John Doe
Staff ID: FAC001
Role: Teacher
Department: Mathematics
Subjects: [Algebra, Geometry]
Email: john.doe@school.com
Phone: 1234567890
DOB: 1990-01-15
Password: secure123
```

**Expected:** Should create successfully

### Test 3: Duplicate Email
```
Use the same email as Test 1
```

**Expected:** Should show "Email might already be in use"

---

## Edge Function Checklist

Verify the `create-user` Edge Function has:

- [ ] Proper error handling
- [ ] Validation for required fields
- [ ] Unique constraint checking
- [ ] Proper database permissions
- [ ] Correct table names
- [ ] Transaction handling
- [ ] Logging for debugging

---

## Database Schema Verification

### Required Tables for Faculty Creation:

#### 1. `profiles` table
```sql
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- role (text)
- institution_id (uuid)
- created_at (timestamp)
```

#### 2. `faculty_profiles` table
```sql
- id (uuid, primary key)
- profile_id (uuid, foreign key → profiles.id)
- staff_id (text, unique)
- department (text)
- phone (text)
- date_of_birth (date)
- image_url (text)
- institution_id (uuid)
```

#### 3. `staff_details` table (if used)
```sql
- id (uuid, primary key)
- profile_id (uuid, foreign key → profiles.id)
- staff_id (text)
- department (text)
- institution_id (uuid)
```

---

## Quick Fix: Bypass Edge Function (Temporary)

If the Edge Function continues to fail, you can temporarily create users directly:

```typescript
// TEMPORARY WORKAROUND - NOT RECOMMENDED FOR PRODUCTION
const { data: authUser, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
        data: {
            full_name: data.name,
            role: 'faculty',
            institution_id: institutionId
        }
    }
});

if (authError) throw authError;

// Then create profile manually
const { error: profileError } = await supabase
    .from('faculty_profiles')
    .insert({
        profile_id: authUser.user.id,
        staff_id: data.staffId,
        department: data.department,
        // ... other fields
    });
```

**Note:** This bypasses the Edge Function but requires proper RLS policies.

---

## What to Share for Help

If you need further assistance, please share:

1. **Console logs** from the browser (all `[STAFF]` prefixed logs)
2. **Error message** shown in the toast notification
3. **Data being sent** (from the first console.log)
4. **Edge Function response** (from the second console.log)
5. **Screenshot** of the error

---

## Summary

The error handling has been significantly improved. Now when you try to add a faculty member:

1. ✅ You'll see exactly what data is being sent
2. ✅ You'll see the exact error from the Edge Function
3. ✅ You'll get helpful suggestions in the error message
4. ✅ Errors will stay visible for 5 seconds

**Next Action:** Try adding a faculty member again and check the browser console for detailed error information.

---

**Last Updated:** 2026-01-21  
**Status:** ✅ Enhanced Error Handling Implemented
