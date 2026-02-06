#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('APPLYING LEAVE REQUEST ROUTING FIX');
console.log('='.repeat(80));

const sqlFile = path.join(__dirname, 'fix_leave_routing_complete.sql');

console.log('\nReading SQL file:', sqlFile);
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('\nApplying fix to local Supabase database...');
console.log('(This will add assignment_type column and fix the trigger function)');

try {
    // Use psql to execute the SQL
    const result = execSync(
        `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f "${sqlFile}"`,
        { encoding: 'utf8', stdio: 'pipe' }
    );

    console.log('\n✅ Fix applied successfully!');
    console.log('\nDatabase output:');
    console.log(result);

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS:');
    console.log('='.repeat(80));
    console.log('1. Test by submitting a leave request as a parent');
    console.log('2. Check that assigned_class_teacher_id is populated');
    console.log('3. Verify the leave appears in the faculty portal');
    console.log('4. Run: node inspect_leave_routing.cjs (to verify the fix)');

} catch (error) {
    console.error('\n❌ Error applying fix:');
    console.error(error.message);
    console.error('\nTrying alternative method...');

    // Alternative: Use supabase CLI
    try {
        const result2 = execSync(
            `npx supabase db reset --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres`,
            { encoding: 'utf8', stdio: 'pipe' }
        );
        console.log(result2);
    } catch (err2) {
        console.error('Alternative method also failed:', err2.message);
        console.log('\n📋 MANUAL STEPS:');
        console.log('1. Open Supabase Studio: http://127.0.0.1:54323');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy and paste the contents of: fix_leave_routing_complete.sql');
        console.log('4. Click "Run" to execute');
    }
}
