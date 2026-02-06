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

async function inspectAssignments() {
    console.log('--- Faculty Assignments with Class Names ---');
    const { data: assignments, error } = await supabase
        .from('faculty_subjects')
        .select(`
            *,
            classes (name)
        `);

    if (error) console.error(error);
    else console.log(JSON.stringify(assignments, null, 2));
}

inspectAssignments();
