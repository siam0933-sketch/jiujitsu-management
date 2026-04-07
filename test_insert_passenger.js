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
const anonClient = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    console.log("Testing insert as Admin (ignores RLS)");
    // Get a route id
    const { data: route } = await adminClient.from('gym_shuttle_routes').select('*').limit(1).single();
    if (!route) return console.log("No route found");

    console.log("Route ID:", route.id);
    
    // Test Admin insert
    const { data: ins1, error: err1 } = await adminClient.from('gym_shuttle_passengers').insert({
        route_id: route.id,
        passenger_name: 'Admin Test'
    }).select();
    console.log("Admin Insert:", ins1, err1);

}
check();
