'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export interface PortalShuttlePassenger {
    id: string
    stop_id: string
    passenger_name: string
}

export interface PortalShuttleStop {
    id: string
    route_id: string
    day_of_week: number
    time: string
    stop_name: string
    passengers: PortalShuttlePassenger[]
}

export interface PortalShuttleRoute {
    id: string
    gym_id: string
    name: string
    days: number[]
    stops: PortalShuttleStop[]
}

export async function getPortalShuttleData(): Promise<PortalShuttleRoute[]> {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')
    
    if (!sessionCookie) {
        return []
    }

    const session = JSON.parse(sessionCookie.value)
    if (!session.gymId) return []

    const supabase = await createAdminClient()

    // 1. Fetch Routes
    const { data: routes, error: routesError } = await supabase
        .from('gym_shuttle_routes')
        .select('id, gym_id, name, days')
        .eq('gym_id', session.gymId)
        .order('created_at', { ascending: true })

    if (routesError || !routes || routes.length === 0) return []

    const routeIds = routes.map((r: any) => r.id)

    // 2. Fetch Stops
    const { data: stops, error: stopsError } = await supabase
        .from('gym_shuttle_stops')
        .select('id, route_id, day_of_week, time, stop_name')
        .in('route_id', routeIds)
        .order('time', { ascending: true })

    if (stopsError) return []

    const stopIds = (stops || []).map((s: any) => s.id)

    // 3. Fetch Passengers
    let passengers: any[] = []
    if (stopIds.length > 0) {
        const { data: pData } = await supabase
            .from('gym_shuttle_passengers')
            .select('id, stop_id, passenger_name')
            .in('stop_id', stopIds)
        
        if (pData) {
            passengers = pData
        }
    }

    // 4. Combine
    const combinedRoutes: PortalShuttleRoute[] = routes.map((r: any) => ({
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
