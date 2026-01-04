
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
    console.log('--- Checking gym_promotion_criteria ---');

    // Try to select from the table to see if it exists
    const { data, error } = await supabase
        .from('gym_promotion_criteria')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting from gym_promotion_criteria:', error.message);
        if (error.code === '42P01') {
            console.log('Result: TABLE DOES NOT EXIST (42P01)');
        }
    } else {
        console.log('Table exists. Rows found:', data.length);
    }

    // Check policies via internal postgres tables if possible, but simple select/insert test is easier.
    // Actually, let's try to query information_schema columns
    /*
    const { data: cols, error: colError } = await supabase.rpc('get_columns', { table_name: 'gym_promotion_criteria' });
    // RPC might not exist.
    */
}

checkTable();
