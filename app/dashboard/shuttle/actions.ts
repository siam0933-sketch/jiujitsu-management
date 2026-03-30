'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ShuttleRoute = {
    id: string
    gym_id: string
    day_of_week: number
    time: string
    stop_name: string
    passengers: ShuttlePassenger[]
}

export type ShuttlePassenger = {
    id: string
    route_id: string
    passenger_name: string
}

// 1. Fetch Routes & Passengers
export async function getShuttleData(gymId: string) {
    const supabase = await createClient()

    // Fetch Routes
    const { data: routes, error: routesError } = await supabase
        .from('gym_shuttle_routes')
        .select('*')
        .eq('gym_id', gymId)
        .order('time', { ascending: true })

    if (routesError) {
        console.error('Error fetching routes:', routesError)
        return []
    }

    if (!routes || routes.length === 0) return []

    const routeIds = routes.map((r: any) => r.id)

    // Fetch Passengers
    const { data: passengers, error: passengersError } = await supabase
        .from('gym_shuttle_passengers')
        .select('*')
        .in('route_id', routeIds)
        .order('created_at', { ascending: true })

    if (passengersError) {
        console.error('Error fetching passengers:', passengersError)
        return []
    }

    // Combine
    const combined: ShuttleRoute[] = routes.map((r: any) => ({
        ...r,
        // Remove seconds from time string for cleaner UI if present (e.g. 15:30:00 -> 15:30)
        time: r.time.slice(0, 5),
        passengers: (passengers || []).filter((p: any) => p.route_id === r.id)
    }))

    return combined
}

// 2. Save Route (Insert or Update)
export async function saveShuttleRoute(
    gymId: string,
    days: number[], // Array of day_of_week
    time: string,   // "HH:mm"
    stopName: string,
    passengers: string[], // Array of passenger names
    existingRouteIdToUpdate?: string
) {
    const supabase = await createClient()

    // Ensure seconds are included for TIME column format
    const timeFormatted = time.length === 5 ? `${time}:00` : time

    if (existingRouteIdToUpdate && days.length === 1) {
        // Update Single Existing Route
        const { error: updateError } = await supabase
            .from('gym_shuttle_routes')
            .update({
                day_of_week: days[0],
                time: timeFormatted,
                stop_name: stopName
            })
            .eq('id', existingRouteIdToUpdate)
            .eq('gym_id', gymId)

        if (updateError) throw updateError

        // Delete old passengers
        const { error: deletePassError } = await supabase
            .from('gym_shuttle_passengers')
            .delete()
            .eq('route_id', existingRouteIdToUpdate)

        if (deletePassError) throw deletePassError

        // Insert new passengers
        if (passengers.length > 0) {
            const passInserts = passengers.map(name => ({
                route_id: existingRouteIdToUpdate,
                passenger_name: name
            }))
            const { error: insError } = await supabase
                .from('gym_shuttle_passengers')
                .insert(passInserts)
            if (insError) throw insError
        }

    } else {
        // Insert Multiple Routes (one for each checked day)
        // If it was an edit with multiple days checked, we shouldn't necessarily delete the 'other' days automatically, 
        // but if we are editing an existing route AND checked multiple days, we can update the original day and insert the new days.
        // For simplicity, if editing and multiple days are checked, we delete the original and recreate it.
        
        if (existingRouteIdToUpdate) {
            await deleteShuttleRoute(existingRouteIdToUpdate)
        }

        for (const day of days) {
            const { data: newRoute, error: insertError } = await supabase
                .from('gym_shuttle_routes')
                .insert({
                    gym_id: gymId,
                    day_of_week: day,
                    time: timeFormatted,
                    stop_name: stopName
                })
                .select()
                .single()

            if (insertError || !newRoute) throw insertError || new Error("Failed to insert route")

            if (passengers.length > 0) {
                const passInserts = passengers.map(name => ({
                    route_id: newRoute.id,
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
}

// 3. Delete Route
export async function deleteShuttleRoute(routeId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_shuttle_routes')
        .delete()
        .eq('id', routeId)
    
    if (error) throw error
    revalidatePath('/dashboard/shuttle')
}
