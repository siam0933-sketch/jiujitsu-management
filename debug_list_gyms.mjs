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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPendingGyms() {
    console.log("Checking all gyms in the database...");
    const { data: gyms, error } = await supabase
        .from('gyms')
        .select('id, name, status, owner_id')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch failed:", error);
    } else {
        console.log("Found gyms:");
        console.log(gyms);
    }
}

checkPendingGyms();
