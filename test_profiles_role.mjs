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

async function testProfilesRoleInsert() {
    console.log("Testing direct insert of profile with role gym_master...");

    // We can't insert into profiles because we need an auth.users id.
    // We use the existing test gym member user id to update role.
    const testUserId = '97ffc6a7-776d-430c-a862-42b2853014d3';

    const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'gym_master' })
        .eq('id', testUserId)
        .select();

    if (error) {
        console.error("Update failed:", error);
    } else {
        console.log("Update succeeded!", data);
        // revert it back
        await supabase.from('profiles').update({ role: 'gym_member' }).eq('id', testUserId);
    }
}

testProfilesRoleInsert();
