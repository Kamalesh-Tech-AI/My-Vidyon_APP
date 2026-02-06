const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(__dirname, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const vars = {};
    lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            vars[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return vars;
}

const env = getEnv();
const supabase = createClient(env['VITE_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function simulateFlow() {
    const parentProfileId = '1998deef-e6b9-448d-9f5f-0d76f28b59b0';
    const facultyProfileId = '26dd3454-a5e2-4824-82b5-96e8940803f4';
    const studentId = '9e24ea75-4594-410b-9524-3927394bc7c2'; // Madhan Kumar

    console.log('--- Step 1: Parent queries their students ---');
    const { data: parent } = await supabase.from('parents').select('id').eq('profile_id', parentProfileId).single();
    if (!parent) { console.log('Parent not found for profile:', parentProfileId); return; }

    const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', parent.id);
    const sIds = links?.map(l => l.student_id) || [];
    console.log('Parent student IDs:', sIds);

    const { data: students } = await supabase.from('students').select('*').in('id', sIds);
    console.log('Parent found students data:', students?.length || 0);

    console.log('--- Step 2: Check for Leave Requests of those students ---');
    const { data: leaves } = await supabase.from('leave_requests').select('*').in('student_id', sIds);
    console.log('Total leaves for parent students:', leaves?.length || 0);

    console.log('--- Step 3: Faculty queries their assignments ---');
    const { data: assignments } = await supabase
        .from('faculty_subjects')
        .select('*, classes(*)')
        .eq('faculty_profile_id', facultyProfileId)
        .eq('assignment_type', 'class_teacher');

    console.log('Faculty has class teacher assignments:', assignments?.length || 0);

    console.log('--- Step 4: Faculty queries their students ---');
    let fStudents = [];
    if (assignments) {
        for (const a of assignments) {
            if (a.classes && a.classes.name) {
                const { data: cur } = await supabase
                    .from('students')
                    .select('*')
                    .eq('class_name', a.classes.name)
                    .eq('section', a.section);
                if (cur) fStudents = [...fStudents, ...cur];
            }
        }
    }
    console.log('Faculty found students:', fStudents.length);
    const fStudentIds = fStudents.map(s => s.id);

    console.log('--- Step 5: Faculty queries Leave Requests ---');
    const { data: fLeaves } = await supabase.from('leave_requests').select('*').in('student_id', fStudentIds);
    console.log('Faculty found leaves:', fLeaves?.length || 0);
    if (fLeaves) fLeaves.forEach(l => console.log(` - Leave ID: ${l.id}, Student ID: ${l.student_id}, From: ${l.from_date}, Status: ${l.status}`));
}

simulateFlow();
