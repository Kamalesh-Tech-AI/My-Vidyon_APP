const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function inspectLeaveRouting() {
    console.log('='.repeat(80));
    console.log('LEAVE REQUEST ROUTING INSPECTION');
    console.log('='.repeat(80));

    // 1. Check faculty_subjects table structure
    console.log('\n1. Checking faculty_subjects table structure...');
    const { data: columns, error: colError } = await supabase
        .rpc('exec_sql', {
            query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'faculty_subjects'
        ORDER BY ordinal_position;
      `
        });

    if (colError) {
        console.error('Error:', colError);
    } else {
        console.table(columns);
    }

    // 2. Check class teacher assignments
    console.log('\n2. Checking class teacher assignments...');
    const { data: classTeachers, error: ctError } = await supabase
        .from('faculty_subjects')
        .select(`
      id,
      assignment_type,
      faculty:faculty_profile_id (full_name),
      classes:class_id (name),
      section
    `)
        .eq('assignment_type', 'class_teacher');

    if (ctError) {
        console.error('Error:', ctError);
    } else {
        console.log(`Found ${classTeachers?.length || 0} class teacher assignments:`);
        console.table(classTeachers?.map(ct => ({
            faculty: ct.faculty?.full_name,
            class: ct.classes?.name,
            section: ct.section
        })));
    }

    // 3. Check students
    console.log('\n3. Checking students...');
    const { data: students, error: studError } = await supabase
        .from('students')
        .select('id, name, class_name, section')
        .limit(10);

    if (studError) {
        console.error('Error:', studError);
    } else {
        console.log(`Found ${students?.length || 0} students (showing first 10):`);
        console.table(students);
    }

    // 4. Check leave requests
    console.log('\n4. Checking leave requests...');
    const { data: leaves, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
      id,
      student:student_id (name, class_name, section),
      assigned_teacher:assigned_class_teacher_id (full_name),
      status,
      created_at
    `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (leaveError) {
        console.error('Error:', leaveError);
    } else {
        console.log(`Found ${leaves?.length || 0} leave requests (showing last 10):`);
        console.table(leaves?.map(l => ({
            student: l.student?.name,
            class: `${l.student?.class_name}-${l.student?.section}`,
            assigned_teacher: l.assigned_teacher?.full_name || 'NOT ASSIGNED',
            status: l.status,
            created_at: new Date(l.created_at).toLocaleString()
        })));
    }

    // 5. Check pending leaves by faculty
    console.log('\n5. Checking pending leaves by faculty...');
    const { data: pendingByFaculty, error: pendError } = await supabase
        .from('leave_requests')
        .select(`
      assigned_class_teacher_id,
      faculty:assigned_class_teacher_id (full_name)
    `)
        .eq('status', 'Pending');

    if (pendError) {
        console.error('Error:', pendError);
    } else {
        const grouped = {};
        pendingByFaculty?.forEach(item => {
            const name = item.faculty?.full_name || 'Unassigned';
            grouped[name] = (grouped[name] || 0) + 1;
        });
        console.table(Object.entries(grouped).map(([name, count]) => ({ faculty: name, pending_count: count })));
    }

    console.log('\n' + '='.repeat(80));
    console.log('INSPECTION COMPLETE');
    console.log('='.repeat(80));
}

inspectLeaveRouting().catch(console.error);
