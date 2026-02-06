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

async function checkSchemas() {
    console.log('--- Students Columns ---');
    const { data: sData } = await supabase.from('students').select('*').limit(1).single();
    console.log(Object.keys(sData || {}));

    console.log('--- Faculty Subjects Columns ---');
    const { data: fsData } = await supabase.from('faculty_subjects').select('*').limit(1).single();
    console.log(Object.keys(fsData || {}));

    console.log('--- Leave Requests Columns ---');
    const { data: lrData } = await supabase.from('leave_requests').select('*').limit(1).single();
    console.log(Object.keys(lrData || {}));
}

checkSchemas();
