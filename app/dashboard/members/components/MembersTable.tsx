'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { deleteMembers } from '../actions'
import MemberModal from './MemberModal'

interface Member {
    id: string
    name: string
    phone: string
    gender: string
    joined_at: string
    gym_id: string
    // ... add other fields if used in the table directly
    [key: string]: any
}

interface Props {
    initialMembers: Member[]
    count: number
}

export default function MembersTable({ initialMembers, count }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // URL Params for Sorting
    const sort = searchParams.get('sort') || 'joined_at'
    const order = searchParams.get('order') || 'desc'

    // Modal State provided by URL, but we just check the param here? 
    // Actually the page handles the Modal rendering based on URL, 
    // so this component mainly handles the Table list and client-side selection.
    // The Modal is unrelated to selection state.

    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedIds(next)
    }

    const toggleAll = () => {
        if (selectedIds.size === initialMembers.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(initialMembers.map(m => m.id)))
        }
    }

    const handleDelete = async () => {
        if (!confirm(`${selectedIds.size}명의 회원을 삭제하시겠습니까?`)) return

        setIsDeleting(true)
        const ids = Array.from(selectedIds)

        const res = await deleteMembers(ids)

        if (res?.error) {
            alert(res.error)
        } else {
            alert('삭제되었습니다.')
            setSelectedIds(new Set())
            setIsEditMode(false)
            router.refresh()
        }
        setIsDeleting(false)
    }

    const SortLink = ({ column, label }: { column: string, label: string }) => {
        const isCurrent = sort === column
        const nextOrder = isCurrent && order === 'desc' ? 'asc' : 'desc'

        // When clicking sort, we persist selection? Probably better to clear it or keep it.
        // It's a Link, so full navigation occurs. State might be lost unless in URL. 
        // For simplicity, we lose selection on sort (acceptable).

        return (
            <Link
                href={`/dashboard/members?sort=${column}&order=${nextOrder}`}
                scroll={false}
                className="group inline-flex items-center cursor-pointer"
            >
                {label}
                <span className={`ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible ${isCurrent ? 'visible text-gray-900' : 'invisible'}`}>
                    {isCurrent ? (order === 'desc' ? '↓' : '↑') : '↕'}
                </span>
            </Link>
        )
    }

    return (
        <div>
            {/* Header Actions */}
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">회원 관리</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        총 {count}명의 회원이 등록되어 있습니다.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
                    {isEditMode ? (
                        <>
                            <button
                                onClick={handleDelete}
                                disabled={selectedIds.size === 0 || isDeleting}
                                className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                            >
                                {isDeleting ? '삭제 중...' : `선택 삭제 (${selectedIds.size})`}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditMode(false)
                                    setSelectedIds(new Set())
                                }}
                                className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                취소
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                일괄 편집
                            </button>
                            <Link
                                href="/dashboard/members/new"
                                className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                신규 회원 등록
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-16">
                                            {isEditMode ? (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.size === initialMembers.length && initialMembers.length > 0}
                                                    onChange={toggleAll}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                                />
                                            ) : (
                                                'No.'
                                            )}
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            <SortLink column="name" label="이름" />
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            연락처
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            <SortLink column="gender" label="성별" />
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            <SortLink column="joined_at" label="등록일" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {initialMembers && initialMembers.length > 0 ? (
                                        initialMembers.map((member, index) => (
                                            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                                                    {isEditMode ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(member.id)}
                                                            onChange={() => toggleSelection(member.id)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                                        />
                                                    ) : (
                                                        (count || 0) - index
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                    <Link
                                                        href={`/dashboard/members?${new URLSearchParams({ ...Object.fromEntries(searchParams), id: member.id }).toString()}`}
                                                        scroll={false}
                                                        className="text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                                                    >
                                                        {member.name || '이름 없음'}
                                                    </Link>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {member.phone || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {member.gender === 'male' ? '남' : member.gender === 'female' ? '여' : '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(member.joined_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                                                등록된 회원이 없습니다. 신규 회원을 등록해주세요.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
