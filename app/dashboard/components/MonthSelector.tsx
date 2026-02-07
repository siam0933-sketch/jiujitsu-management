'use client'

import { useRouter } from 'next/navigation'

export default function MonthSelector({ currentMonthStr }: { currentMonthStr: string }) {
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        router.push(`/dashboard?statsMonth=${newValue}`)
    }

    return (
        <input
            type="month"
            value={currentMonthStr}
            onChange={handleChange}
            className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
        />
    )
}
