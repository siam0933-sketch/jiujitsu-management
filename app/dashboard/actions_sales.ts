'use server'

import { createClient } from '@/utils/supabase/server'

export interface SalesData {
    totalSales: number;
    payments: any[];
}

export async function getSalesData(startDateQuery?: string, endDateQuery?: string): Promise<SalesData> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalSales: 0, payments: [] }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { totalSales: 0, payments: [] }

    const now = new Date()
    const targetYear = now.getFullYear()
    const targetMonth = String(now.getMonth() + 1).padStart(2, '0')

    const start = startDateQuery || `${targetYear}-${targetMonth}-01`
    const end = endDateQuery || `${targetYear}-${targetMonth}-31`

    const { data: payments, error } = await supabase
        .from('gym_payments')
        .select('*, member:gym_members(name)')
        .eq('gym_id', gym.id)
        .gte('payment_date', start)
        .lte('payment_date', end)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching sales data:', error)
        return { totalSales: 0, payments: [] }
    }

    const totalSales = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    return {
        totalSales,
        payments: payments || []
    }
}
