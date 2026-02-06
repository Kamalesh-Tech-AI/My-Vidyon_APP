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

async function checkAssignments() {
    console.log('--- Checking Faculty Assignments for Class 9th Section A ---');

    // 1. Get class IDs for "9th"
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('name', '9th');

    const classIds = classes?.map(c => c.id) || [];
    console.log(`Class IDs for "9th":`, classIds);

    // 2. Get assignments
    const { data: assignments } = await supabase
        .from('faculty_subjects')
        .select('*, profiles(full_name, email)')
        .in('class_id', classIds)
        .eq('section', 'A');

    console.log('Assignments:', JSON.stringify(assignments, null, 2));

    // 3. Check if any matches Madhan Kumar's specific class/section
    // Wait, Madhan Kumar's student record says class_name = "9th", section = "A".
}

checkAssignments();
