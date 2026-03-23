'use client'

import { Download } from 'lucide-react'

export default function DownloadKioskApkButton({ supabaseUrl }: { supabaseUrl: string }) {
    // SUPABASE URL에서 APK 경로를 구성합니다.
    // 실제 APK 파일은 Supabase Storage의 'public' 버킷 내에 'apk/Kiosk.apk' 경로로 업로드되어야 합니다.
    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/public/apk/Kiosk.apk`

    return (
        <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 font-medium text-white text-sm rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
            onClick={(e) => {
                // 다운로드 모달이나 추가 안내가 필요하면 여기에 작성
                const confirmDownload = window.confirm(
                    "안드로이드 전용 키오스크 앱(.apk)을 다운로드 하시겠습니까?\n\n* 다운로드 후 태블릿에서 파일 관리자를 통해 설치해 주세요.\n* '출처를 알 수 없는 앱 설치' 권한 허용이 필요할 수 있습니다."
                )
                if (!confirmDownload) {
                    e.preventDefault()
                }
            }}
        >
            <Download size={18} />
            키오스크 앱(.apk) 다운로드
        </a>
    )
}
