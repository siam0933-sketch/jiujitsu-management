const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    envContent.split('\n').forEach(line => {
        if (!line || line.startsWith('#') || !line.includes('=')) return;
        const [key, ...values] = line.split('=');
        process.env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing config');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check Profiles
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'siam0933@gmail.com')
        .single();

    console.log('--- Profile ---');
    console.log(profile);
    if (error) console.error(error);

    // 2. Check Auth user ID
    if (profile) {
        const { data: userRoles } = await supabase.from('gyms').select('*').eq('owner_id', profile.id);
        console.log('--- Gyms Owned ---');
        console.log(userRoles);
    }
}
run();
