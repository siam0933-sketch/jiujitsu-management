'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { getKioskApkDownloadUrl } from './actions'

export default function DownloadKioskApkButton() {
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault()
        
        const confirmDownload = window.confirm(
            "안드로이드 전용 키오스크 앱(.apk)을 다운로드 하시겠습니까?\n\n* 다운로드 후 태블릿에서 파일 관리자를 통해 설치해 주세요.\n* '출처를 알 수 없는 앱 설치' 권한 허용이 필요할 수 있습니다."
        )
        
        if (!confirmDownload) return

        setIsDownloading(true)
        const res = await getKioskApkDownloadUrl()
        setIsDownloading(false)

        if (res.error) {
            alert(res.error)
        } else if (res.url) {
            // 새 창이나 현재 창에서 프로그래밍 방식으로 다운로드 트리거
            const link = document.createElement('a')
            link.href = res.url
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 font-medium text-white text-sm rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
            <Download size={18} />
            {isDownloading ? '준비 중...' : '키오스크 앱(.apk) 다운로드'}
        </button>
    )
}
