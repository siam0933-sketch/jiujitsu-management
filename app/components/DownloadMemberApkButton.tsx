'use client'

import { useState } from 'react'
import { getMemberApkDownloadUrl } from '@/app/actions/download-apk'

interface Props {
    className?: string
    buttonText?: string
    onDownloadStart?: () => void
}

export default function DownloadMemberApkButton({ 
    className = "px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors", 
    buttonText = "앱 다운로드",
    onDownloadStart 
}: Props) {
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault()
        
        const confirmDownload = window.confirm(
            "수강생 전용 자체 앱(.apk)을 다운로드 하시겠습니까?\n\n* '출처를 알 수 없는 앱 설치' 권한 허용이 필요할 수 있습니다."
        )
        
        if (!confirmDownload) return

        if (onDownloadStart) onDownloadStart()
        
        setIsDownloading(true)
        const res = await getMemberApkDownloadUrl()
        setIsDownloading(false)

        if (res.error) {
            alert(res.error)
        } else if (res.url) {
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
            className={className}
        >
            {isDownloading ? '준비 중...' : buttonText}
        </button>
    )
}
