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

async function checkLeaves() {
    console.log('--- Checking Raw Leave Requests ---');

    // Check leave_requests
    const { data: leaves, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (leaveError) {
        console.error('Error fetching leaves:', leaveError);
    } else {
        console.log('Raw Leave Requests:', JSON.stringify(leaves, null, 2));
    }
}

checkLeaves();
