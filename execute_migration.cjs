const { createClient } = require('@supabase/supabase-js');

// Connect to your LOCAL Supabase instance
const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function executeSQLDirectly() {
    console.log('🔧 Applying Leave Request Migration - Direct Execution\n');

    try {
        console.log('Step 1: Adding assigned_class_teacher_id column...');

        // We need to execute raw SQL - try using the REST API directly
        const response1 = await fetch('http://127.0.0.1:54321/rest/v1/rpc/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
            },
            body: JSON.stringify({
                query: 'ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS assigned_class_teacher_id UUID REFERENCES profiles(id);'
            })
        });

        console.log('Response:', response1.status, response1.statusText);

        // Alternative: Try to detect if column exists by querying
        console.log('\nAttempting to check table schema...');
        const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .limit(0);

        if (error) {
            console.error('Error checking schema:', error);
            console.log('\n❌ Cannot execute migration programmatically.');
            console.log('\n📋 Please run this SQL manually in Supabase Studio:');
            console.log('\n1. Open: http://127.0.0.1:54323');
            console.log('2. Click SQL Editor');
            console.log('3. Run this SQL:\n');
            console.log('ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS assigned_class_teacher_id UUID REFERENCES profiles(id);');
            console.log('CREATE INDEX IF NOT EXISTS idx_leave_requests_teacher ON leave_requests(assigned_class_teacher_id, status);');
            console.log('\n4. Then refresh your app!');
        } else {
            console.log('\n✅ Successfully connected to database');
            console.log('ℹ️  Manual SQL execution required');
            console.log('\nOpen Supabase Studio (http://127.0.0.1:54323) and run the migration from apply_leave_fix.sql');
        }

    } catch (err) {
        console.error('\nError:', err.message);
        console.log('\n📋 SIMPLE FIX:');
        console.log('1. Open browser → http://127.0.0.1:54323');
        console.log('2. SQL Editor → New Query');
        console.log('3. Paste and run:');
        console.log('   ALTER TABLE leave_requests ADD COLUMN assigned_class_teacher_id UUID;');
        console.log('4. Refresh app');
    }
}

executeSQLDirectly();
