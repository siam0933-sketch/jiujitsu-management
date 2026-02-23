require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testQuery() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use admin key to see all Data
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Use anon key for member test, or service role for raw data
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check if there are any notices
    const { data: rawNotices, error: err1 } = await adminSupabase
        .from('gym_notices')
        .select('*');

    console.log('All Notices:', rawNotices?.length, err1);
    if (rawNotices?.length > 0) {
        console.log('First Notice:', rawNotices[0]);
    }

    // 2. Check profiles
    const { data: rawProfiles, error: err2 } = await adminSupabase
        .from('profiles')
        .select('*')
        .limit(1);
    console.log('Profiles check:', rawProfiles?.length, err2);

}

testQuery();
