'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ShuttlePassenger {
    id: string
    stop_id: string
    passenger_name: string
}

export interface ShuttleStop {
    id: string
    route_id: string
    day_of_week: number
    time: string
    stop_name: string
    passengers: ShuttlePassenger[]
}

export interface ShuttleRoute {
    id: string
    gym_id: string
    name: string
    days: number[]
    stops: ShuttleStop[]
}

// ==========================================
// 1. DATA FETCHING
// ==========================================
export async function getShuttleData(gymId: string): Promise<ShuttleRoute[]> {
    const supabase = await createClient()

    // Fetch Routes
    const { data: routes, error: routesError } = await supabase
        .from('gym_shuttle_routes')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: true })

    if (routesError) {
        console.error('Error fetching routes:', routesError)
        return []
    }
    if (!routes || routes.length === 0) return []

    const routeIds = routes.map((r: any) => r.id)

    // Fetch Stops
    const { data: stops, error: stopsError } = await supabase
        .from('gym_shuttle_stops')
        .select('*')
        .in('route_id', routeIds)
        .order('time', { ascending: true })

    if (stopsError) {
        console.error('Error fetching stops:', stopsError)
        return []
    }

    const stopIds = (stops || []).map((s: any) => s.id)

    // Fetch Passengers
    let passengers: any[] = []
    if (stopIds.length > 0) {
        const { data: pData, error: pError } = await supabase
            .from('gym_shuttle_passengers')
            .select('*')
            .in('stop_id', stopIds)
            .order('created_at', { ascending: true })
        if (!pError && pData) {
            passengers = pData
        }
    }

    // Combine
    const combinedRoutes: ShuttleRoute[] = routes.map((r: any) => ({
        id: r.id,
        gym_id: r.gym_id,
        name: r.name,
        days: r.days || [],
        stops: (stops || [])
            .filter((s: any) => s.route_id === r.id)
            .map((s: any) => ({
                id: s.id,
                route_id: s.route_id,
                day_of_week: s.day_of_week,
                time: s.time.slice(0, 5), // '15:30:00' -> '15:30'
                stop_name: s.stop_name,
                passengers: passengers.filter(p => p.stop_id === s.id)
            }))
    }))

    return combinedRoutes
}

// ==========================================
// 2. ROUTE ACTIONS (노선 CRUD)
// ==========================================
export async function saveShuttleRouteMaster(
    gymId: string,
    name: string,
    days: number[],
    existingRouteId?: string
) {
    const supabase = await createClient()

    if (existingRouteId) {
        // Update
        const { error } = await supabase
            .from('gym_shuttle_routes')
            .update({ name, days })
            .eq('id', existingRouteId)
            .eq('gym_id', gymId)
        if (error) throw error
    } else {
        // Insert
        const { error } = await supabase
            .from('gym_shuttle_routes')
            .insert({ gym_id: gymId, name, days })
        if (error) throw error
    }

    revalidatePath('/dashboard/shuttle')
    return { success: true }
}

export async function deleteShuttleRouteMaster(routeId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_shuttle_routes')
        .delete()
        .eq('id', routeId)

    if (error) throw error
    revalidatePath('/dashboard/shuttle')
    return { success: true }
}


// ==========================================
// 3. STOP ACTIONS (정류장 및 탑승객 CRUD)
// ==========================================
export async function saveShuttleStopDetailed(
    routeId: string,
    days: number[],
    time: string,
    stopName: string,
    passengers: string[],
    existingStopIdToUpdate?: string
) {
    const supabase = await createClient()
    const timeFormatted = time.length === 5 ? `${time}:00` : time

    if (existingStopIdToUpdate) {
        // 단일 요일 수정의 경우
        const { error: updateError } = await supabase
            .from('gym_shuttle_stops')
            .update({
                route_id: routeId,
                time: timeFormatted,
                stop_name: stopName
            })
            .eq('id', existingStopIdToUpdate)

        if (updateError) throw updateError

        // 1) Delete old passengers
        await supabase
            .from('gym_shuttle_passengers')
            .delete()
            .eq('stop_id', existingStopIdToUpdate)

        // 2) Insert new passengers
        if (passengers.length > 0) {
            const passInserts = passengers.map(name => ({
                stop_id: existingStopIdToUpdate,
                passenger_name: name
            }))
            const { error: passErr } = await supabase
                .from('gym_shuttle_passengers')
                .insert(passInserts)
            if (passErr) throw passErr
        }
    } else {
        // 새 정류장 생성 (선택된 여러 요일에 복사)
        for (const day of days) {
            const { data: newStop, error: insertError } = await supabase
                .from('gym_shuttle_stops')
                .insert({
                    route_id: routeId,
                    day_of_week: day,
                    time: timeFormatted,
                    stop_name: stopName
                })
                .select()
                .single()

            if (insertError || !newStop) throw insertError || new Error("Failed to insert stop")

            if (passengers.length > 0) {
                const passInserts = passengers.map(name => ({
                    stop_id: newStop.id,
                    passenger_name: name
                }))
                const { error: passErr } = await supabase
                    .from('gym_shuttle_passengers')
                    .insert(passInserts)
                if (passErr) throw passErr
            }
        }
    }

    revalidatePath('/dashboard/shuttle')
    return { success: true }
}

export async function deleteShuttleStop(stopId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_shuttle_stops')
        .delete()
        .eq('id', stopId)

    if (error) throw error
    revalidatePath('/dashboard/shuttle')
    return { success: true }
}
