
const { createClient } = require('@supabase/supabase-js');

// Using keys from .env.local
const supabaseUrl = 'https://gtbhbaqcytargeqiclwy.supabase.co';
const supabaseKey = 'sb_publishable_R7nTCQpLJae-ql1SK4MJYQ_ODaasPJx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log('Testing authenticate_member RPC...');

    // Random credentials that likely don't exist, just to check if function executes
    const { data, error } = await supabase.rpc('authenticate_member', {
        p_name: 'TEST_USER_DOES_NOT_EXIST',
        p_password: 'TEST_PASSWORD'
    });

    if (error) {
        console.error('RPC Call Failed:', error);
        if (error.code === '42883') {
            console.error('CONCLUSION: The function "authenticate_member" does not exist in the database.');
            console.error('Please run the "db_member_login_rpc.sql" file in your Supabase SQL Editor.');
        } else {
            console.error('CONCLUSION: The function exists but failed with another error.');
        }
    } else {
        console.log('RPC Executed Successfully (returned empty data as expected for invalid user).');
        console.log('CONCLUSION: The RPC function is properly installed.');
    }
}

testRpc();
