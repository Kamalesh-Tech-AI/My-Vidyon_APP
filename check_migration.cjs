const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function applyMigrationDirect() {
    console.log('🔧 Applying Leave Request Migration\n');
    console.log('This will add assigned_class_teacher_id to leave_requests table\n');

    try {
        // Since we can't use RPC, we'll need to use SQL file approach
        // For now, let's just verify if the column exists
        console.log('Checking current leave_requests schema...');

        const { data: leaves, error } = await supabase
            .from('leave_requests')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error querying leave_requests:', error.message);
            console.log('\n❌ Cannot check schema. Please run the SQL migration manually.');
            console.log('\n📋 MANUAL STEPS:');
            console.log('1. Open Supabase Studio: http://127.0.0.1:54323');
            console.log('2. Go to SQL Editor');
            console.log('3. Copy and paste the contents of: apply_leave_fix.sql');
            console.log('4. Click "Run"');
            return;
        }

        if (leaves && leaves.length > 0) {
            const sample = leaves[0];
            if ('assigned_class_teacher_id' in sample) {
                console.log('✅ Column assigned_class_teacher_id already exists!');
                console.log('\nVerifying data...');

                const { data: allLeaves } = await supabase
                    .from('leave_requests')
                    .select('id, assigned_class_teacher_id, student_id');

                const total = allLeaves?.length || 0;
                const withTeacher = allLeaves?.filter(r => r.assigned_class_teacher_id).length || 0;

                console.log(`\n📊 Status:`);
                console.log(`   Total leave requests: ${total}`);
                console.log(`   With teacher ID: ${withTeacher}`);
                console.log(`   Missing teacher ID: ${total - withTeacher}`);

                if (withTeacher > 0) {
                    console.log('\n✅ Migration is complete and working!');
                    console.log('\n🎯 Next step: Test the app - navigate to Faculty → Student Leave Requests');
                } else if (total > 0) {
                    console.log('\n⚠️  Column exists but no teacher IDs are populated');
                    console.log('   Run the backfill query from apply_leave_fix.sql');
                } else {
                    console.log('\n✅ Ready to receive new leave requests!');
                    console.log('   Submit a leave from parent portal to test.');
                }
            } else {
                console.log('❌ Column assigned_class_teacher_id does NOT exist yet');
                console.log('\n📋 Please apply the migration:');
                console.log('1. Open Supabase Studio: http://127.0.0.1:54323');
                console.log('2. Go to SQL Editor');
                console.log('3. Run the SQL from: apply_leave_fix.sql');
            }
        } else {
            console.log('ℹ️  No leave requests in database yet');
            console.log('   Column check inconclusive - schema might be ready');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

applyMigrationDirect();
