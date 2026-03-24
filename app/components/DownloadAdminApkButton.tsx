'use client'

import { useState } from 'react'
import { getAdminApkDownloadUrl } from '../actions/download-apk'

interface Props {
    className?: string
    buttonText?: string
    onDownloadStart?: () => void
}

export default function DownloadAdminApkButton({ className = '', buttonText = '관장용 앱 (APK) 다운로드', onDownloadStart }: Props) {
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = async () => {
        if (isDownloading) return

        setIsDownloading(true)
        if (onDownloadStart) onDownloadStart()

        try {
            const res = await getAdminApkDownloadUrl()
            if (res.error) {
                alert(res.error)
                setIsDownloading(false)
                return
            }

            if (res.url) {
                const link = document.createElement('a')
                link.href = res.url
                link.download = 'My_jiujitsu_Admin.apk'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }
        } catch (e) {
            alert('다운로드 중 오류가 발생했습니다.')
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={className}
            type="button"
        >
            {isDownloading ? '다운로드 준비 중...' : buttonText}
        </button>
    )
}
