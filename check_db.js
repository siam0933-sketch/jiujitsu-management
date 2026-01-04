const { createClient } = require('@supabase/supabase-js')

const url = 'https://gtbhbaqcytargeqiclwy.supabase.co'
const key = 'sb_publishable_R7nTCQpLJae-ql1SK4MJYQ_ODaasPJx'
const supabase = createClient(url, key)

async function check() {
    console.log('Checking gym_promotion_logs table...')
    const { data, error } = await supabase.from('gym_promotion_logs').select('count', { count: 'exact', head: true })
    if (error) {
        console.error('Error selecting from gym_promotion_logs:', error)
    } else {
        console.log('gym_promotion_logs table exists. Count result accessible (or restricted but table exists).')
    }
}

check()
