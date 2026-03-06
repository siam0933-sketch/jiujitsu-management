import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[key] = value;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentData() {
    console.log("--- Recent Profiles ---");
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    if (pErr) console.error(pErr);
    else console.log(profiles);

    console.log("\n--- Recent Gyms ---");
    const { data: gyms, error: gErr } = await supabase
        .from('gyms')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
    if (gErr) console.error(gErr);
    else console.log(gyms);
}

checkRecentData();
