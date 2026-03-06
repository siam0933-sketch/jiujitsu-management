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

async function testInsert() {
    console.log("Testing direct insert into gyms table...");

    // Use a known existing owner_id for test
    const testOwnerId = 'b2bc8cbd-f0e2-41bc-8d03-f05b3ea1c9dd';

    const { data, error } = await supabase
        .from('gyms')
        .insert({
            name: 'Direct Insert Test Gym',
            owner_id: testOwnerId,
            address: 'Test Address',
            phone: '010-0000-0000',
            business_registration_number: '000-00-00000'
        })
        .select();

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert succeeded!", data);

        // Cleanup
        await supabase.from('gyms').delete().eq('id', data[0].id);
    }
}

testInsert();
