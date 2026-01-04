
const { createClient } = require('@supabase/supabase-js');

// Helper to load env from .env.local
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '.env.local');

let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            SUPABASE_URL = line.split('=')[1].trim().replace(/"/g, '');
        }
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1].trim().replace(/"/g, ''); // Use ANON as fallback
        }
    });
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Could not find Supabase credentials');
    // process.exit(1); 
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPauseTable() {
    console.log('Checking for gym_membership_pauses table...');

    // Attempt to select from the table
    const { data, error } = await supabase
        .from('gym_membership_pauses')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying table:', error.message);
        if (error.code === '42P01') { // undefined_table
            console.log('RESULT: TABLE MISSING');
        } else {
            console.log('RESULT: ERROR (Other)');
        }
    } else {
        console.log('RESULT: TABLE EXISTS');
        console.log('Records found:', data.length);
    }
}

checkPauseTable();
