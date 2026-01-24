# Step-by-Step Migration Guide

## Running the Academic Year Management Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the Migration SQL**
   - Open the file: `supabase/migrations/add_academic_year_management.sql`
   - Copy ALL the contents (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

5. **Verify Success**
   - You should see "Success. No rows returned" message
   - Check the "Table Editor" to verify new columns exist:
     - `institutions` table should have `status` and `current_academic_year` columns
     - `students` table should have `academic_year` column

### Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   cd C:\Users\DELL\Desktop\my-vidyon-main\my-vidyon
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Run Migration**
   ```bash
   supabase db push
   ```

### Option 3: Direct Database Connection (Advanced)

1. **Get Connection String**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the "Connection string" (URI format)

2. **Run Migration with psql**
   ```bash
   psql "YOUR_CONNECTION_STRING" -f supabase/migrations/add_academic_year_management.sql
   ```

## Verification Steps

After running the migration, verify the changes:

### 1. Check Institutions Table
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'institutions' 
AND column_name IN ('status', 'current_academic_year');
```

Expected result:
- `status` column with TEXT type and default 'active'
- `current_academic_year` column with TEXT type and default '2025-26'

### 2. Check Students Table
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name = 'academic_year';
```

Expected result:
- `academic_year` column with TEXT type and default '2025-26'

### 3. Check Existing Data
```sql
-- Check if existing students have academic year set
SELECT academic_year, COUNT(*) 
FROM students 
GROUP BY academic_year;

-- Check institution statuses
SELECT status, COUNT(*) 
FROM institutions 
GROUP BY status;
```

## Troubleshooting

### Error: "relation does not exist"
**Solution**: The migration now handles this automatically. It only modifies tables that exist.

### Error: "column already exists"
**Solution**: The migration checks if columns exist before adding them. Safe to re-run.

### Error: "permission denied"
**Solution**: Make sure you're using the correct database credentials with ALTER TABLE permissions.

### Migration Runs But No Changes
**Possible Causes**:
1. Columns already exist (check with verification queries above)
2. Wrong database selected
3. Using read-only connection

**Solution**: Run verification queries to check current state.

## Post-Migration Steps

1. **Update Institution Status** (Optional)
   ```sql
   -- Set specific institutions as inactive
   UPDATE institutions 
   SET status = 'inactive' 
   WHERE institution_id = 'INST001';
   ```

2. **Set Current Academic Year** (Optional)
   ```sql
   -- Update current academic year for all institutions
   UPDATE institutions 
   SET current_academic_year = '2025-26';
   ```

3. **Test Login Blocking**
   - Set an institution to 'inactive'
   - Try logging in with a user from that institution
   - Should see error: "Your institution is currently inactive"

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove added columns
ALTER TABLE institutions DROP COLUMN IF EXISTS status;
ALTER TABLE institutions DROP COLUMN IF EXISTS current_academic_year;
ALTER TABLE students DROP COLUMN IF EXISTS academic_year;
ALTER TABLE student_attendance DROP COLUMN IF EXISTS academic_year;
ALTER TABLE assignments DROP COLUMN IF EXISTS academic_year;
```

**Warning**: This will delete all data in these columns!

## Next Steps

After successful migration:
1. ✅ Test institution status blocking
2. ✅ Implement academic year filter in Institution Dashboard
3. ✅ Update all data queries to include academic year filtering
4. ✅ Test with real data

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify your database schema in Table Editor
3. Run verification queries above
4. Check that you have the latest migration file
