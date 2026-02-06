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

async function checkSchema() {
    console.log('--- Checking students schema ---');
    const { data: columns, error } = await supabase.rpc('get_table_columns', { table_name: 'students' });

    if (error) {
        // Fallback: just select one row and look at keys
        const { data } = await supabase.from('students').select('*').limit(1).single();
        console.log('Columns from sample row:', Object.keys(data || {}));
    } else {
        console.log('Columns:', columns);
    }
}

checkSchema();
