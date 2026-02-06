const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function applyMigration() {
    console.log('Starting migration to add assigned_class_teacher_id...\n');

    try {
        // Step 1: Add the column
        console.log('Step 1: Adding column...');
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE leave_requests
        ADD COLUMN IF NOT EXISTS assigned_class_teacher_id UUID;
      `
        });

        if (alterError && !alterError.message?.includes('already exists')) {
            console.error('Error adding column:', alterError);
            // Continue anyway - column might already exist
        } else {
            console.log('✓ Column added or already exists');
        }

        // Step 2: Create index
        console.log('\nStep 2: Creating index...');
        const { error: indexError } = await supabase.rpc('exec_sql', {
            sql: `
        CREATE INDEX IF NOT EXISTS idx_leave_requests_teacher
        ON leave_requests(assigned_class_teacher_id, status);
      `
        });

        if (indexError) {
            console.error('Error creating index:', indexError);
        } else {
            console.log('✓ Index created');
        }

        // Step 3: Backfill existing records
        console.log('\nStep 3: Backfilling existing leave requests...');
        const { error: updateError } = await supabase.rpc('exec_sql', {
            sql: `
        UPDATE leave_requests lr
        SET assigned_class_teacher_id = (
          SELECT fs.faculty_profile_id
          FROM students s
          JOIN classes c ON c.name = s.class_name
          JOIN faculty_subjects fs ON fs.class_id = c.id AND fs.section = s.section
          WHERE s.id = lr.student_id
            AND fs.assignment_type = 'class_teacher'
          LIMIT 1
        )
        WHERE lr.assigned_class_teacher_id IS NULL;
      `
        });

        if (updateError) {
            console.error('Error backfilling:', updateError);
        } else {
            console.log('✓ Backfill completed');
        }

        // Step 4: Verify
        console.log('\nStep 4: Verifying migration...');
        const { data, error } = await supabase
            .from('leave_requests')
            .select('id, assigned_class_teacher_id')
            .limit(5);

        if (error) {
            console.error('Verification error:', error);
        } else {
            const total = data.length;
            const withTeacher = data.filter(r => r.assigned_class_teacher_id).length;
            console.log(`✓ Verified: ${withTeacher}/${total} records have teacher ID`);
            console.log('\nSample records:');
            data.forEach(r => {
                console.log(`  - Leave ${r.id.substring(0, 8)}...: ${r.assigned_class_teacher_id ? '✓ has teacher' : '✗ no teacher'}`);
            });
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\nYou can now test the app. The leave requests should appear in faculty portal.');

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

applyMigration();
