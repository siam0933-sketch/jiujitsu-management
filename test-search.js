import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSearch() {
    const input = "1234"
    // just try the query without gymId to see if fields exist
    const { data, error } = await supabase
        .from('gym_members')
        .select('id, name, phone, user_id, access_code, attendance_count, remaining_sessions')
        .or(`phone.ilike.%${input},access_code.eq.${input}`)
        .limit(1)

    if (error) {
        console.error("SEARCH ERROR:", error)
    } else {
        console.log("SUCCESS, data:", data)
    }
}

testSearch()
