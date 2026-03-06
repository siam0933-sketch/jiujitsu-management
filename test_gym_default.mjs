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

async function testFunction() {
    console.log("Testing generate_invitation_code via a dummy insert...");
    // We can insert a gym to see if the default function errors out
    const testOwnerId = 'b2bc8cbd-f0e2-41bc-8d03-f05b3ea1c9dd';

    const { data, error } = await supabase
        .from('gyms')
        .insert({
            name: 'Trigger Debug Gym',
            owner_id: testOwnerId
        })
        .select();

    if (error) {
        console.error("Insert failed with default value generation:", error);
    } else {
        console.log("Insert succeeded, Default worked:", data[0].invitation_code);
        await supabase.from('gyms').delete().eq('id', data[0].id);
    }
}

testFunction();
