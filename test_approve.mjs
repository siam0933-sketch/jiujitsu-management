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

async function testApprove() {
    console.log("Fetching a pending gym...");
    const { data: gyms, error: fetchErr } = await supabase
        .from('gyms')
        .select('id, name, status')
        .eq('status', 'pending')
        .limit(1);

    if (fetchErr || !gyms || gyms.length === 0) {
        console.log("No pending gyms found or error:", fetchErr);
        return;
    }

    const targetGymId = gyms[0].id;
    console.log(`Approving gym ID: ${targetGymId} (${gyms[0].name})`);

    const { error: updateErr } = await supabase
        .from('gyms')
        .update({ status: 'active' })
        .eq('id', targetGymId);

    if (updateErr) {
        console.error("Update failed:", updateErr);
    } else {
        console.log("Update succeeded! Verifying...");
        const { data: verifyData } = await supabase.from('gyms').select('status').eq('id', targetGymId);
        console.log("Verified status:", verifyData);

        // Revert for UI test
        await supabase.from('gyms').update({ status: 'pending' }).eq('id', targetGymId);
        console.log("Reverted to pending.");
    }
}

testApprove();
