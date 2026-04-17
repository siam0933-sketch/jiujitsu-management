'use client'

import { useEffect, useState } from 'react'
import { getSalesData, SalesData } from '../actions_sales'

export default function SalesWidget() {
    const [salesData, setSalesData] = useState<SalesData>({ totalSales: 0, payments: [] })
    const [loading, setLoading] = useState(true)

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0')
    const todayStr = now.toISOString().split('T')[0]

    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('monthly')
    const [selectedDate, setSelectedDate] = useState<string>(`${currentYear}-${currentMonthStr}`)

    useEffect(() => {
        if (viewMode === 'monthly') {
            const year = selectedDate.split('-')[0] || currentYear
            const month = selectedDate.split('-')[1] || currentMonthStr
            const start = `${year}-${month}-01`
            const end = `${year}-${month}-31`
            fetchData(start, end)
        } else {
            fetchData(selectedDate, selectedDate)
        }
    }, [viewMode, selectedDate])

    const fetchData = async (start: string, end: string) => {
        setLoading(true)
        const data = await getSalesData(start, end)
        setSalesData(data)
        setLoading(false)
    }

    return (
        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">
                        {viewMode === 'monthly' ? '월간 리포트' : '일간 리포트'} - 해당 기간 총 매출
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
                        {loading ? '...' : salesData.totalSales.toLocaleString()} <span className="text-xl font-medium text-gray-500">원</span>
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        className="rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm px-4 py-2.5 text-gray-900 dark:text-zinc-100 shadow-sm focus:ring-2 focus:ring-blue-500/20"
                        value={viewMode}
                        onChange={(e) => {
                            const newMode = e.target.value as 'daily' | 'monthly'
                            setViewMode(newMode)
                            if (newMode === 'daily') setSelectedDate(todayStr)
                            else setSelectedDate(`${currentYear}-${currentMonthStr}`)
                        }}
                    >
                        <option value="monthly">월별로 보기</option>
                        <option value="daily">일별로 보기</option>
                    </select>

                    {viewMode === 'monthly' ? (
                        <input 
                            type="month" 
                            className="rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm px-4 py-2.5 text-gray-900 dark:text-zinc-100 shadow-sm focus:ring-2 focus:ring-blue-500/20"
                            value={selectedDate.slice(0, 7)}
                            onChange={(e) => setSelectedDate(e.target.value || `${currentYear}-${currentMonthStr}`)}
                        />
                    ) : (
                        <input 
                            type="date" 
                            className="rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm px-4 py-2.5 text-gray-900 dark:text-zinc-100 shadow-sm focus:ring-2 focus:ring-blue-500/20"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value || todayStr)}
                        />
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-800">
                <div className="max-h-72 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-left relative">
                        <thead className="bg-gray-50 dark:bg-zinc-800/80 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    날짜
                                </th>
                                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    회원명
                                </th>
                                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    상품 및 옵션
                                </th>
                                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    금액
                                </th>
                                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    결제수단
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-zinc-400">
                                        데이터를 불러오는 중입니다...
                                    </td>
                                </tr>
                            ) : salesData.payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-zinc-400">
                                        해당 기간에 결제 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                salesData.payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-400">
                                            {payment.payment_date}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                            {payment.member?.name || '알 수 없음'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-zinc-300 max-w-[200px] truncate" title={`${payment.plan_snapshot?.plan_name || '기타 결제'} ${payment.plan_snapshot?.options_summary ? `(${payment.plan_snapshot.options_summary})` : ''}`}>
                                            <span className="font-medium text-gray-900 dark:text-zinc-100">
                                                {payment.plan_snapshot?.plan_name || '기타 결제'}
                                            </span>
                                            {payment.plan_snapshot?.options_summary && (
                                                <span className="ml-1.5 text-xs bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-zinc-300">
                                                    {payment.plan_snapshot.options_summary}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                            {Number(payment.amount).toLocaleString()}원
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                                                payment.payment_method === 'card' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-300' :
                                                payment.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-300' :
                                                payment.payment_method === 'transfer' ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:border-purple-800/50 dark:text-purple-300' :
                                                'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                                            }`}>
                                                {payment.payment_method === 'card' ? '카드 결제' : 
                                                 payment.payment_method === 'cash' ? '현금 결제' : 
                                                 payment.payment_method === 'transfer' ? '계좌 이체' : payment.payment_method}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
