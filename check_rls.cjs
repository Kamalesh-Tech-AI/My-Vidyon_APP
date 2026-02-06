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

async function checkRLS() {
    console.log('--- Checking RLS Status ---');
    const tables = ['parents', 'students', 'leave_requests', 'faculty_subjects', 'classes', 'student_parents'];

    for (const table of tables) {
        const { data, error } = await supabase.rpc('check_rls_status', { t_name: table });
        if (error) {
            // Fallback: Use a direct query if RPC is missing
            const { data: policies } = await supabase.from('pg_policies').select('*').eq('tablename', table);
            console.log(`Table ${table} policies:`, JSON.stringify(policies, null, 2));
        } else {
            console.log(`Table ${table} status:`, data);
        }
    }
}

checkRLS();
