
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
let envContent = ''
try {
    envContent = fs.readFileSync(envPath, 'utf-8')
} catch (e) {
    console.error('.env.local not found')
    process.exit(1)
}

const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        env[key] = value
    }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkJoinedAt() {
    const { data, error } = await supabase
        .from('gym_members')
        .select('joined_at')

    if (error) {
        console.error('Error fetching members:', error)
        return
    }

    const dateCounts: Record<string, number> = {}
    let nullCount = 0

    data.forEach((member: any) => {
        if (!member.joined_at) {
            nullCount++
            return
        }
        const date = new Date(member.joined_at).toISOString().split('T')[0]
        dateCounts[date] = (dateCounts[date] || 0) + 1
    })

    console.log('Total members:', data.length)
    console.log('Null joined_at:', nullCount)
    console.log('Date Distribution:', dateCounts)
}

checkJoinedAt()
