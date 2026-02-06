const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ccyqzcaghwaggtmkmigi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeXF6Y2FnaHdhZ2d0bWttaWdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY4NTAyOCwiZXhwIjoyMDgzMjYxMDI4fQ.ywwhWFvNKwCvK-IsZcHmXLYO3XCCnx50CDbEMPZfNbs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectData() {
    console.log('--- [SERVICE ROLE] Listing ALL Students (limit 20) ---');
    const { data: students, error: studentError } = await supabase
        .from('students')
        .select('*')
        .limit(20);

    if (studentError) console.error('Student Error:', studentError);
    else console.log('Students:', JSON.stringify(students, null, 2));

    console.log('\n--- [SERVICE ROLE] Listing Leave Requests for Madhan ---');
    const { data: leaves, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .ilike('reason', '%Madhan%'); // Try searching by reason if name is not in table directly or search by student ID if found

    if (leaveError) console.error('Leave Error:', leaveError);
    else console.log('Leaves:', JSON.stringify(leaves, null, 2));

    console.log('\n--- [SERVICE ROLE] Listing ALL faculty_subjects ---');
    const { data: subjects, error: subjError } = await supabase
        .from('faculty_subjects')
        .select('*')
        .limit(20);

    if (subjError) console.error('Subject Error:', subjError);
    else console.log('Faculty Subjects:', JSON.stringify(subjects, null, 2));

    console.log('\n--- [SERVICE ROLE] Listing ALL staff_details ---');
    const { data: staff, error: staffError } = await supabase
        .from('staff_details')
        .select('*')
        .limit(20);

    if (staffError) console.error('Staff Error:', staffError);
    else console.log('Staff Details:', JSON.stringify(staff, null, 2));

    console.log('\n--- [SERVICE ROLE] Checking Table list ---');
    const { data: tables, error: tableError } = await supabase
        .rpc('get_tables'); // Check if this RPC exists or use a generic query

    if (tableError) console.log('Tables check failed (RPC missing)');
    else console.log('Tables:', tables);
}

inspectData();
