'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { extractImagePathsFromHtml, deleteImagesFromStorage } from '@/utils/storage'

export type SystemManual = {
    id: string
    title: string
    content: string
    created_at: string
}

export async function getManuals() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('system_manuals')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        
    if (error) {
        console.error('Error fetching manuals:', error)
        return []
    }
    return data as Pick<SystemManual, 'id' | 'title' | 'created_at'>[]
}

export async function getManualById(id: string) {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('system_manuals')
        .select('*')
        .eq('id', id)
        .single()
        
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching manual:', error)
    }
    return data as SystemManual | null
}

export async function createManual(title: string, content: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('system_manuals')
        .insert({ title, content })

    if (error) {
        console.error('Error creating manual:', error)
        return { error: '저장 실패: ' + error.message }
    }
    
    revalidatePath('/super-admin/manual')
    revalidatePath('/dashboard/manual')
    return { success: true }
}

export async function updateManual(id: string, title: string, content: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('system_manuals')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error updating manual:', error)
        return { error: '수정 실패: ' + error.message }
    }
    
    revalidatePath('/super-admin/manual')
    revalidatePath(`/super-admin/manual/${id}`)
    revalidatePath('/dashboard/manual')
    revalidatePath(`/dashboard/manual/${id}`)
    return { success: true }
}

export async function deleteManual(id: string) {
    const supabase = await createAdminClient()
    
    // Fetch content to extract images before deletion
    const { data: manual } = await supabase.from('system_manuals').select('content').eq('id', id).single()

    const { error } = await supabase
        .from('system_manuals')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting manual:', error)
        return { error: '삭제 실패: ' + error.message }
    }
    
    // Clean up images from storage bucket
    if (manual?.content) {
        const paths = extractImagePathsFromHtml(manual.content)
        if (paths.length > 0) {
            await deleteImagesFromStorage(paths)
        }
    }
    
    revalidatePath('/super-admin/manual')
    revalidatePath('/dashboard/manual')
    return { success: true }
}
