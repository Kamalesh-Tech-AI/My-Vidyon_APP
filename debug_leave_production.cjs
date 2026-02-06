const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for PRODUCTION
const supabase = createClient(
    'https://ccyqzcaghwaggtmkmigi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeXF6Y2FnaHdhZ2d0bWttaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MzU5NjMsImV4cCI6MjA1MjUxMTk2M30.xKnEfvhWqNjqYhPVqOCGQZaJOXjLQOQEXLrCBOQqkXo'
);

async function debugLeaveRequests() {
    console.log('='.repeat(80));
    console.log('DEBUGGING LEAVE REQUEST FETCHING ISSUE');
    console.log('='.repeat(80));

    const facultyId = '3c9d1eea-f883-4c45-822d-3722a6404a77'; // Daisy's ID from the error logs

    // 1. Check if leave_requests table has data
    console.log('\n1. Checking all leave requests in database...');
    const { data: allLeaves, error: allError } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (allError) {
        console.error('❌ Error fetching all leaves:', allError);
    } else {
        console.log(`✅ Found ${allLeaves?.length || 0} total leave requests`);
        if (allLeaves && allLeaves.length > 0) {
            console.table(allLeaves.map(l => ({
                id: l.id.substring(0, 8),
                student_id: l.student_id?.substring(0, 8),
                assigned_teacher: l.assigned_class_teacher_id?.substring(0, 8) || 'NULL',
                status: l.status,
                created: new Date(l.created_at).toLocaleString()
            })));
        }
    }

    // 2. Check leaves assigned to Daisy
    console.log(`\n2. Checking leaves assigned to faculty ${facultyId.substring(0, 8)}...`);
    const { data: assignedLeaves, error: assignedError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('assigned_class_teacher_id', facultyId);

    if (assignedError) {
        console.error('❌ Error fetching assigned leaves:', assignedError);
    } else {
        console.log(`✅ Found ${assignedLeaves?.length || 0} leaves assigned to this faculty`);
        if (assignedLeaves && assignedLeaves.length > 0) {
            console.table(assignedLeaves.map(l => ({
                id: l.id.substring(0, 8),
                student_id: l.student_id?.substring(0, 8),
                status: l.status,
                from: l.from_date,
                to: l.to_date
            })));
        }
    }

    // 3. Try the exact query from FacultyStudentLeaves.tsx
    console.log('\n3. Testing the exact query from FacultyStudentLeaves.tsx...');
    const { data: leaves, error } = await supabase
        .from('leave_requests')
        .select(`
      *,
      student_id (
        id,
        name,
        roll_no,
        class_name,
        section
      )
    `)
        .eq('assigned_class_teacher_id', facultyId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error with join query:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
        console.log(`✅ Join query returned ${leaves?.length || 0} results`);
        if (leaves && leaves.length > 0) {
            console.log('Sample result:');
            console.log(JSON.stringify(leaves[0], null, 2));
        }
    }

    // 4. Check if students table exists and has data
    console.log('\n4. Checking students table...');
    const { data: students, error: studError } = await supabase
        .from('students')
        .select('id, name, class_name, section')
        .limit(5);

    if (studError) {
        console.error('❌ Error fetching students:', studError);
    } else {
        console.log(`✅ Found ${students?.length || 0} students`);
        if (students && students.length > 0) {
            console.table(students);
        }
    }

    // 5. Check faculty profile
    console.log('\n5. Checking faculty profile...');
    const { data: faculty, error: facError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', facultyId)
        .single();

    if (facError) {
        console.error('❌ Error fetching faculty:', facError);
    } else {
        console.log('✅ Faculty profile:', faculty);
    }

    // 6. Count pending leaves for this faculty
    console.log('\n6. Counting pending leaves (dashboard query)...');
    const { count, error: countError } = await supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_class_teacher_id', facultyId)
        .eq('status', 'Pending');

    if (countError) {
        console.error('❌ Error counting:', countError);
    } else {
        console.log(`✅ Pending count: ${count}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(80));
}

debugLeaveRequests().catch(console.error);
