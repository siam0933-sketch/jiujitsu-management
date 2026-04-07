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

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: routes, error: rErr } = await supabase.from('gym_shuttle_routes').select('*');
    if (rErr) console.error("Routes error:", rErr);
    else console.log("Routes:", routes);

    const { data: passengers, error: pErr } = await supabase.from('gym_shuttle_passengers').select('*');
    if (pErr) console.error("Passengers error:", pErr);
    else console.log("Passengers:", passengers);
}
check();
