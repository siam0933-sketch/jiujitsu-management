/**
 * Shared utility to insert a point log for a specific trigger type.
 * Returns the inserted point log's ID, or null if no active setting / error.
 */
import { createAdminClient } from '@/utils/supabase/server'

export async function grantAutoPoints(
    gymId: string,
    memberId: string,
    type: 'auto_portal' | 'auto_kiosk' | 'auto_payment'
): Promise<string | null> {
    try {
        const supabase = await createAdminClient()

        // Find the active point setting for this type
        const { data: setting } = await supabase
            .from('gym_point_settings')
            .select('id, name, points')
            .eq('gym_id', gymId)
            .eq('type', type)
            .eq('is_active', true)
            .maybeSingle()

        if (!setting) return null // No active setting for this type — skip silently

        const { data, error } = await supabase
            .from('gym_point_logs')
            .insert({
                gym_id: gymId,
                member_id: memberId,
                setting_id: setting.id,
                name: setting.name,
                points: setting.points,
            })
            .select('id')
            .single()

        if (error) {
            console.error('[grantAutoPoints] Insert error:', error)
            return null
        }

        return data?.id ?? null
    } catch (e) {
        console.error('[grantAutoPoints] Error:', e)
        return null
    }
}

/**
 * Revokes a previously granted point log by deleting it.
 * Call this when an attendance record is cancelled.
 */
export async function revokeAutoPoints(pointLogId: string): Promise<void> {
    try {
        const supabase = await createAdminClient()
        const { error } = await supabase
            .from('gym_point_logs')
            .delete()
            .eq('id', pointLogId)

        if (error) {
            console.error('[revokeAutoPoints] Error:', error)
        }
    } catch (e) {
        console.error('[revokeAutoPoints] Error:', e)
    }
}
