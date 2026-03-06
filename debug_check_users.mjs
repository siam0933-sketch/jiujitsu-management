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

async function checkAuthUsers() {
    console.log("--- Recent Auth Users ---");
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error(error);
    } else {
        const recent = data.users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        console.log(recent.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })));
    }
}

checkAuthUsers();
