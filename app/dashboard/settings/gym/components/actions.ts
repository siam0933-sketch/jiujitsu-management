'use server'

import { createAdminClient } from '@/utils/supabase/server'

export async function getKioskApkDownloadUrl() {
    try {
        const supabase = await createAdminClient()
        // KIOSK 비공개 버킷에 있는 app-debug.apk 파일을 1분간 유효한 다운로드 링크로 변환
        const { data, error } = await supabase.storage
            .from('KIOSK')
            .createSignedUrl('app-debug.apk', 60, {
                download: 'My_jiujitsu_Kiosk.apk' // 다운로드될 때 저장될 이름
            })

        if (error || !data) {
            console.error('getKioskApkDownloadUrl Error:', error)
            return { error: 'APK 파일을 찾을 수 없습니다. (Supabase Storage 확인 필요)' }
        }

        return { url: data.signedUrl }
    } catch (e) {
        return { error: '서버 오류가 발생했습니다.' }
    }
}
