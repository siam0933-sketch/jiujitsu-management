'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { extractImagePathsFromHtml, deleteImagesFromStorage } from '@/utils/storage'

export async function optimizeStorage() {
    try {
        const supabase = await createAdminClient()
        
        // 1. Fetch all contents from tables that use the NoticeEditor
        const [
            { data: gymNotices, error: err1 },
            { data: teamNotices, error: err2 },
            { data: sysNotices, error: err3 },
            { data: manuals, error: err4 }
        ] = await Promise.all([
            supabase.from('gym_notices').select('content'),
            supabase.from('team_notices').select('content'),
            supabase.from('system_notices').select('content'),
            supabase.from('system_manuals').select('content')
        ])

        if (err1 || err2 || err3 || err4) {
            console.error('Errors fetching contents:', err1, err2, err3, err4)
            return { error: '데이터를 불러오는 중 오류가 발생했습니다.' }
        }

        // 2. Extract valid image paths from all HTML
        const validPaths = new Set<string>()
        
        const extractFromList = (list: any[] | null) => {
            if (!list) return
            list.forEach(item => {
                const paths = extractImagePathsFromHtml(item.content)
                paths.forEach(p => validPaths.add(p))
            })
        }

        extractFromList(gymNotices)
        extractFromList(teamNotices)
        extractFromList(sysNotices)
        extractFromList(manuals)

        // 3. Fetch all files from the 'notices' bucket
        // Uses limit 10000. In massive scale, pagination would be applied.
        const { data: files, error: storageError } = await supabase.storage.from('notices').list('', {
            limit: 10000,
            offset: 0,
        })

        if (storageError) {
            console.error('Error fetching storage list:', storageError)
            return { error: '스토리지 파일 목록을 불러오지 못했습니다.' }
        }

        // 4. Find orphaned files (files in bucket but not in validPaths)
        // Ignoring empty names or hidden files (like '.emptyFolderPlaceholder')
        const orphanedPaths = (files || [])
            .filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
            .filter(f => !validPaths.has(f.name))
            .map(f => f.name)

        if (orphanedPaths.length === 0) {
            return { success: true, message: '삭제할 불필요한 찌꺼기 사진 파일이 없습니다. (최적 상태)' }
        }

        // 5. Delete them
        const { count, error, success } = await deleteImagesFromStorage(orphanedPaths)
        
        if (!success) {
            return { error: error || '찌꺼기 파일 삭제 중 오류가 발생했습니다.' }
        }

        return { 
            success: true, 
            message: `성공적으로 ${count}개의 불필요한 남은 사진(찌꺼기)을 청소 완료했습니다!` 
        }

    } catch (e: any) {
        console.error('optimizeStorage error:', e)
        return { error: `서버 오류: ${e.message}` }
    }
}
