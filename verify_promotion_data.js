const { createClient } = require('@supabase/supabase-js')

const url = 'https://gtbhbaqcytargeqiclwy.supabase.co'
const key = 'sb_publishable_R7nTCQpLJae-ql1SK4MJYQ_ODaasPJx'
const supabase = createClient(url, key)

async function verify() {
    console.log('--- Verifying Promotion Data ---')

    // 1. Check latest promotion log
    const { data: logs, error: logError } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

    if (logError) {
        console.error('Error fetching logs:', logError)
    } else {
        console.log('Latest Log:', logs.length ? logs[0] : 'No logs found')
    }

    // 2. Check a member (if we knew the ID, but we list the most recently promoted member if possible)
    // We can use the member_id from the log if found.
    if (logs && logs.length > 0) {
        const memberId = logs[0].member_id
        console.log('Checking Member:', memberId)
        const { data: member, error: memberError } = await supabase
            .from('gym_members')
            .select('id, name, belt, last_promotion_date')
            .eq('id', memberId)
            .single()

        if (memberError) console.error('Error fetching member:', memberError)
        else console.log('Member State:', member)
    }
}

verify()
