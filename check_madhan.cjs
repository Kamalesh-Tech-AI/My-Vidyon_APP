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

async function checkMadhan() {
    const studentId = '9e24ea75-4594-410b-9524-3927394bc7c2';
    console.log(`--- Checking Student ${studentId} ---`);

    const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

    console.log('Raw Student Data:', JSON.stringify(student, null, 2));
}

checkMadhan();
