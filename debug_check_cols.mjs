import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        env[match[1]] = (match[2] || '').replace(/['"]/g, '');
    }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function testCols() {
    const { data, error } = await supabase
        .from('gyms')
        .select('phone, business_registration_number')
        .limit(1);

    if (error) console.error("Error:", error.message);
    else console.log("Success! Columns exist.");
}

testCols();
