'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLatestManual() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('system_manuals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching manual:', error)
    }
    
    return data
}

export async function saveManual(title: string, content: string) {
    const supabase = await createAdminClient()
    
    // We'll just insert a new record so there's a simple history, and viewers will always pull the latest.
    const { error } = await supabase
        .from('system_manuals')
        .insert({ title, content })

    if (error) {
        console.error('Error saving manual:', error)
        return { error: '저장 실패: ' + error.message }
    }
    
    revalidatePath('/super-admin/manual')
    revalidatePath('/dashboard/manual')
    return { success: true }
}
