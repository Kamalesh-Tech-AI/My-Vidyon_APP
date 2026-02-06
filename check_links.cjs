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

async function checkLinks() {
    const parentId = '9ca41f84-b017-46e8-a5c6-96291bbd7661';
    console.log(`--- Checking links for parent ${parentId} ---`);

    const { data: links } = await supabase
        .from('student_parents')
        .select('*')
        .eq('parent_id', parentId);

    console.log('Links:', JSON.stringify(links, null, 2));

    if (links && links.length > 0) {
        const studentIds = links.map(l => l.student_id);
        const { data: students } = await supabase
            .from('students')
            .select('id, name')
            .in('id', studentIds);

        console.log('Linked Students found in students table:', JSON.stringify(students, null, 2));
    }
}

checkLinks();
