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
const supabase = createClient(
    env['VITE_SUPABASE_URL'],
    env['SUPABASE_SERVICE_ROLE_KEY']
);

async function inspectIds() {
    const studentId = '9e24ea75-4594-410b-9524-3927394bc7c2';
    const parentId = '9ca41f84-b017-46e8-a5c6-96291bbd7661';

    console.log(`--- Inspecting IDs ---`);
    console.log(`Student ID: ${studentId}`);
    console.log(`Parent ID: ${parentId}`);

    const { data: student } = await supabase
        .from('students')
        .select('*, classes(name)')
        .eq('id', studentId)
        .single();

    console.log('Student Data:', JSON.stringify(student, null, 2));

    const { data: parent } = await supabase
        .from('parents')
        .select('*')
        .eq('id', parentId)
        .single();

    console.log('Parent Data:', JSON.stringify(parent, null, 2));

    if (student) {
        console.log(`Searching for faculty assigned to Class: ${student.class_name}, Section: ${student.section}`);

        // Find faculty_subjects
        const { data: assignments } = await supabase
            .from('faculty_subjects')
            .select('*, profiles(full_name, email)')
            .eq('section', student.section)
            .eq('assignment_type', 'class_teacher');

        // We need to filter by class name if class_id is used.
        // Let's get the class_id for this student's class name.
        if (student.class_name) {
            const { data: classes } = await supabase
                .from('classes')
                .select('id')
                .eq('name', student.class_name);

            const classIds = classes?.map(c => c.id) || [];
            console.log(`Matching Class IDs for "${student.class_name}":`, classIds);

            const filteredAssignments = assignments?.filter(a => classIds.includes(a.class_id)) || [];
            console.log('Matching Faculty Assignments:', JSON.stringify(filteredAssignments, null, 2));
        }
    }
}

inspectIds();
