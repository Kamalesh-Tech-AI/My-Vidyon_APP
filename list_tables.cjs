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

async function listTables() {
    let output = '--- Listing Tables ---\n';
    const tables = [
        'students', 'parents', 'profiles', 'leave_requests',
        'faculty_subjects', 'staff_details', 'classes', 'student_parents'
    ];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            output += `Table ${table}: Error - ${error.message}\n`;
        } else {
            output += `Table ${table}: ${count} rows\n`;
        }
    }

    fs.writeFileSync('table_counts.txt', output);
    console.log('Results written to table_counts.txt');
}

listTables();
