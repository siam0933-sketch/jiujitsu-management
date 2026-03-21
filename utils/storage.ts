import { createAdminClient } from './supabase/server'

/**
 * Extracts all Supabase 'notices' bucket file paths from an HTML content string.
 * This looks for image src URLs matching the Supabase storage public URL pattern.
 */
export function extractImagePathsFromHtml(html: string | null | undefined): string[] {
    if (!html) return []
    
    // Pattern matches the object name after /notices/ in the public URL.
    // Example: https://[project-ref].supabase.co/storage/v1/object/public/notices/some-uuid-file.jpg
    const regex = /\/storage\/v1\/object\/public\/notices\/([^"'\s>]+)/g
    const paths = new Set<string>()
    let match
    
    while ((match = regex.exec(html)) !== null) {
        if (match[1]) {
            paths.add(match[1]) // match[1] is the filename like 'uuid.jpg'
        }
    }
    
    return Array.from(paths)
}

/**
 * Given an array of file paths from the 'notices' bucket, deletes them definitively.
 * Uses the admin client for direct deletion irrespective of RLS policies if necessary,
 * although standard client may also work depending on policies.
 */
export async function deleteImagesFromStorage(paths: string[]) {
    if (!paths || paths.length === 0) return { success: true, count: 0 }
    
    const supabase = await createAdminClient()
    const { data, error } = await supabase.storage.from('notices').remove(paths)
    
    if (error) {
        console.error('Error deleting images from storage:', error)
        return { success: false, error: error.message }
    }
    
    return { success: true, count: data?.length || 0 }
}
