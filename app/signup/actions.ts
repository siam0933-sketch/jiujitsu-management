'use server'

import { createAdminClient } from '@/utils/supabase/server'

export async function searchTeamsForSignup(query: string) {
    if (!query.trim()) return []
    try {
        const supabaseAdmin = await createAdminClient()
        const { data, error } = await supabaseAdmin
            .from('teams')
            .select('id, name, representative_name')
            .ilike('name', `%${query}%`)
            .limit(10)

        if (error) {
            console.error('[searchTeamsForSignup]', error)
            return []
        }
        return data || []
    } catch (e) {
        console.error('[searchTeamsForSignup] Fetch Error:', e)
        return []
    }
}
