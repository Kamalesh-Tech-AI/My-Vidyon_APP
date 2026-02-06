import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function inspectData() {
    console.log('--- Inspecting Students for "Madhan Kumar" ---');
    const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, name, full_name, class_name, section, parent_id')
        .or('name.ilike.%Madhan%,full_name.ilike.%Madhan%');

    if (studentError) console.error('Student Error:', studentError);
    else console.log('Students found:', students);

    if (students && students.length > 0) {
        const studentId = students[0].id;
        console.log(`\n--- Inspecting Leave Requests for Student ID: ${studentId} ---`);
        const { data: leaves, error: leaveError } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('student_id', studentId);

        if (leaveError) console.error('Leave Error:', leaveError);
        else console.log('Leaves found:', leaves);
    }

    console.log('\n--- Inspecting Profiles for Faculty ---');
    const { data: faculty, error: facultyError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'faculty');

    if (facultyError) console.error('Faculty Error:', facultyError);
    else {
        console.log('Faculty profiles found:', faculty.length);
        if (faculty.length > 0) {
            console.log('First faculty ID:', faculty[0].id);
            const { data: staff, error: staffError } = await supabase
                .from('staff_details')
                .select('*')
                .eq('profile_id', faculty[0].id);

            if (staffError) console.error('Staff Details Error:', staffError);
            else console.log('Staff Details for first faculty:', staff);
        }
    }
}

inspectData();
