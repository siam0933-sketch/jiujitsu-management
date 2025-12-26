'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { registerBatch } from '../actions'
import { useRouter } from 'next/navigation'

export default function BulkUploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            readExcel(selectedFile)
        }
    }

    const readExcel = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const data = e.target?.result
            if (data) {
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(sheet)
                mapAndPreviewData(jsonData)
            }
        }
        reader.readAsBinaryString(file)
    }

    const mapAndPreviewData = (rawData: any[]) => {
        const mapped = rawData.map((row: any) => {
            // Mapping Logic based on User Request
            const genderRaw = row['성별'] || ''
            let gender = 'male'
            if (genderRaw.includes('여')) gender = 'female'

            // Date Parsing
            const parseDate = (val: any) => {
                if (!val) return null

                // Handle YYYYMMDD format (Number or String)
                const strVal = String(val).trim()
                if (/^\d{8}$/.test(strVal)) {
                    const y = strVal.substring(0, 4)
                    const m = strVal.substring(4, 6)
                    const d = strVal.substring(6, 8)
                    const date = new Date(`${y}-${m}-${d}`)
                    if (!isNaN(date.getTime())) return date
                }

                if (typeof val === 'number') {
                    // Excel serial date to JS Date
                    return new Date(Math.round((val - 25569) * 86400 * 1000))
                }
                if (typeof val === 'string') {
                    // Replace dots/slashes with dashes for standard parsing
                    const normalized = val.replace(/\./g, '-').replace(/\//g, '-')
                    const date = new Date(normalized)
                    if (!isNaN(date.getTime())) return date
                }
                return null
            }

            // Allow multiple column names (aliases)
            const getCol = (aliases: string[]) => {
                for (const alias of aliases) {
                    if (row[alias] !== undefined && row[alias] !== null) return String(row[alias]).trim()
                }
                return undefined
            }

            // Special handling for Address (combine 주소1 + 주소2 if available)
            let address = getCol(['주소', '집주소', '거주지', 'Address'])
            if (!address) {
                const addr1 = getCol(['주소1', '기본주소'])
                const addr2 = getCol(['주소2', '상세주소'])
                if (addr1 || addr2) {
                    address = `${addr1 || ''} ${addr2 || ''}`.trim()
                }
            }

            return {
                name: getCol(['이름', '성명', '회원명']),
                gender: gender,
                access_code: getCol(['출결번호', '핀번호', '출결번호(핀번호)', '고유번호', '비밀번호', 'PIN']),
                school: getCol(['학교', '재학중인학교']),
                grade: getCol(['학년']),
                phone: getCol(['원생전화번호', '전화번호', '휴대폰', '연락처', '원생연락처', 'H.P', 'Mobile', '전화']),
                guardian_phone: getCol(['보호자연락처', '부모님전화번호', '부모님연락처', '보호자휴대폰', '비상연락처', 'Parent']),
                birth_date: parseDate(getCol(['생일', '생년월일', 'Birthday'])),
                joined_at: parseDate(getCol(['입학일', '등록일', '입학일(등록일)', '가입일'])) || parseDate(getCol(['등록일'])),
                payment_due_day: getCol(['수납청구일', '결제일', '청구일', '납부일']),
                address: address
            }
        }).filter(item => item.name) // Filter out empty rows without name

        setPreviewData(mapped)
    }

    const handleUpload = async () => {
        if (previewData.length === 0) return

        setIsUploading(true)
        setError(null)

        try {
            const result = await registerBatch(previewData)
            if (result.error) {
                setError(result.error)
            } else {
                alert(`${previewData.length}명의 회원이 성공적으로 등록되었습니다.`)
                router.push('/dashboard/members')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">회원 일괄 등록 (엑셀)</h1>
                <p className="mt-2 text-sm text-gray-600">
                    가지고 계신 엑셀 파일을 업로드하면 자동으로 등록됩니다.
                </p>
                <div className="mt-2 bg-blue-50 p-4 rounded-md text-sm text-blue-800">
                    <strong>인식 가능한 엑셀 항목:</strong> 이름, 성별, 출결번호(핀번호), 학교, 학년, 원생전화번호, 보호자연락처, 생일, 입학일(등록일), 수납청구일
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    엑셀 파일 선택 (.xlsx, .xls)
                </label>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {previewData.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">미리보기 ({previewData.length}명)</h2>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className={`px-4 py-2 rounded-md text-white font-semibold ${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                            {isUploading ? '등록 중...' : '일괄 등록하기'}
                        </button>
                    </div>

                    <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성별</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생년월일</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주소 (확인용)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">핀번호</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">청구일</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previewData.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row.gender === 'male' ? '남' : row.gender === 'female' ? '여' : row.gender}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row.birth_date instanceof Date ? row.birth_date.toLocaleDateString() : row.birth_date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={row.address}>
                                            {row.address || <span className="text-red-300">미인식</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.access_code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.payment_due_day}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
