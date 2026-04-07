const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    if (line.includes('=')) {
        const [key, val] = line.split('=');
        envVars[key.trim()] = val.trim();
    }
});

const adminClient = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: logs, error: lErr } = await adminClient.from('gym_attendance_logs').select('id, point_log_id').limit(1);
    if (lErr) console.error("Error from gym_attendance_logs:", lErr);
    else console.log("gym_attendance_logs snippet:", logs);

    const { data: messages, error: mErr } = await adminClient.from('gym_messages').select('id').limit(1);
    if (mErr) console.error("Error from gym_messages:", mErr);
    else console.log("gym_messages success");

    const { data: settings, error: sErr } = await adminClient.from('gym_point_settings').select('id, icon').limit(1);
    if (sErr) console.error("Error from gym_point_settings:", sErr);
    else console.log("gym_point_settings success");
}
check();
