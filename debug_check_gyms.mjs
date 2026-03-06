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

async function runTest() {
    const { data, error } = await supabase
        .from('gyms')
        .select(`
            id,
            name,
            address,
            phone,
            business_registration_number,
            status,
            created_at,
            owner:profiles!gyms_owner_id_fkey(
                id,
                full_name,
                email,
                phone
            )
        `)
        .order('created_at', { ascending: false })
        .limit(2);

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Supabase Data:", JSON.stringify(data, null, 2));
    }
}

runTest();
