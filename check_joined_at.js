
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.resolve(process.cwd(), '.env.local')
// console.log('Reading env from:', envPath)

let envContent = ''
try {
    envContent = fs.readFileSync(envPath, 'utf-8')
    //   console.log('Env file read success, length:', envContent.length)
} catch (e) {
    console.error('.env.local not found')
    process.exit(1)
}

const env = {}
envContent.split('\n').forEach(originalLine => {
    const line = originalLine.trim()
    if (!line || line.startsWith('#')) return

    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
        }
        env[key] = value
    }
})

// console.log('Keys found:', Object.keys(env))

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDates() {
    const { data, error } = await supabase
        .from('gym_members')
        .select('joined_at, start_date')

    if (error) {
        console.error('Error fetching members:', error)
        return
    }

    const joinedCounts = {}
    const startCounts = {}

    data.forEach(member => {
        if (member.joined_at) {
            const date = new Date(member.joined_at).toISOString().split('T')[0]
            joinedCounts[date] = (joinedCounts[date] || 0) + 1
        }
        if (member.start_date) {
            // start_date might be just YYYY-MM-DD or ISO
            let date = member.start_date
            if (date.includes('T')) date = date.split('T')[0]
            startCounts[date] = (startCounts[date] || 0) + 1
        } else {
            startCounts['null'] = (startCounts['null'] || 0) + 1
        }
    })

    console.log('Total members:', data.length)
    console.log('--- Joined At Distribution ---')
    console.log(joinedCounts)
    console.log('--- Start Date Distribution ---')
    console.log(startCounts)
}

checkDates()
