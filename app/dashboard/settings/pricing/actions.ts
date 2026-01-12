'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPricingData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { plans: [], options: [] }

    // Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { plans: [], options: [] }

    const { data: plans } = await supabase
        .from('gym_price_plans')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    const { data: options } = await supabase
        .from('gym_price_options')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .order('group_order', { ascending: true })
        .order('group_name', { ascending: true })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })

    return { plans: plans || [], options: options || [] }
}

export async function createPlan(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    const name = String(formData.get('name'))
    const price = Number(formData.get('price'))
    const type = String(formData.get('type')) // 'period' | 'session'
    const duration_days = Number(formData.get('duration_days') || 30)
    const session_count = formData.get('session_count') ? Number(formData.get('session_count')) : null

    const { error } = await supabase
        .from('gym_price_plans')
        .insert({
            gym_id: gym.id,
            name,
            price,
            type,
            duration_days,
            session_count,
            is_active: true
        })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function deletePlan(planId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_price_plans')
        .update({ is_active: false })
        .eq('id', planId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function createOption(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    const group_name = String(formData.get('group_name'))
    const name = String(formData.get('name'))
    const price = Number(formData.get('price'))

    // 1. Determine group_order
    // Check if group exists
    const { data: existingGroup } = await supabase
        .from('gym_price_options')
        .select('group_order')
        .eq('gym_id', gym.id)
        .eq('group_name', group_name)
        .limit(1)
        .maybeSingle()

    let group_order = existingGroup?.group_order

    if (group_order === undefined || group_order === null) {
        // New group or existing group has null order -> get max + 1
        const { data: maxGroup } = await supabase
            .from('gym_price_options')
            .select('group_order')
            .eq('gym_id', gym.id)
            .order('group_order', { ascending: false })
            .limit(1)
            .maybeSingle()

        group_order = (maxGroup?.group_order ?? -1) + 1
    }

    // 2. Determine display_order (within group)
    const { data: maxOrder } = await supabase
        .from('gym_price_options')
        .select('display_order')
        .eq('gym_id', gym.id)
        .eq('group_name', group_name)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

    const nextOrder = (maxOrder?.display_order || 0) + 1

    const { error } = await supabase
        .from('gym_price_options')
        .insert({
            gym_id: gym.id,
            group_name,
            name,
            price,
            group_order,
            display_order: nextOrder,
            is_active: true
        })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function deleteOption(optionId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_price_options')
        .update({ is_active: false })
        .eq('id', optionId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function reorderOption(optionId: string, direction: 'up' | 'down') {
    const supabase = await createClient()
    console.log(`[Reorder] Start: id=${optionId}, dir=${direction}`)

    // 1. Get Target
    const { data: target } = await supabase
        .from('gym_price_options')
        .select('*')
        .eq('id', optionId)
        .single()

    if (!target) {
        console.error('[Reorder] Target not found')
        return { error: 'Option not found' }
    }
    console.log(`[Reorder] Target found: order=${target.display_order}, group=${target.group_name}`)

    // 2. Find Adjacent
    let adjacentQuery = supabase
        .from('gym_price_options')
        .select('*')
        .eq('gym_id', target.gym_id)
        .eq('group_name', target.group_name)
        .limit(1)

    if (direction === 'up') {
        adjacentQuery = adjacentQuery
            .lt('display_order', target.display_order)
            .order('display_order', { ascending: false })
    } else {
        adjacentQuery = adjacentQuery
            .gt('display_order', target.display_order)
            .order('display_order', { ascending: true })
    }

    const { data: adjacent } = await adjacentQuery.single()

    if (!adjacent) {
        console.log('[Reorder] No adjacent item found')
        return { success: true } // Already at top/bottom
    }
    console.log(`[Reorder] Adjacent found: id=${adjacent.id}, order=${adjacent.display_order}`)

    // 3. Swap
    const { error: e1 } = await supabase
        .from('gym_price_options')
        .update({ display_order: adjacent.display_order })
        .eq('id', target.id)

    if (e1) {
        console.error('[Reorder] Swap 1 failed:', e1)
        return { error: e1.message }
    }

    const { error: e2 } = await supabase
        .from('gym_price_options')
        .update({ display_order: target.display_order })
        .eq('id', adjacent.id)

    if (e2) {
        console.error('[Reorder] Swap 2 failed:', e2)
        return { error: e2.message }
    }

    console.log('[Reorder] Swap success')
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function reorderGroup(groupName: string, direction: 'up' | 'down') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    // 1. Fetch ALL distinct groups with their current orders
    // We fetch all active options to determine group structure
    const { data: allOptions } = await supabase
        .from('gym_price_options')
        .select('group_name, group_order, created_at')
        .eq('gym_id', gym.id)
        .eq('is_active', true)

    if (!allOptions || allOptions.length === 0) return { success: true }

    // 2. Reduce to unique groups and sort them
    // Sort logic: group_order (asc), then created_at (asc) for stability
    const uniqueGroupsMap = new Map<string, { name: string, order: number, minCreated: string }>()

    allOptions.forEach(opt => {
        const existing = uniqueGroupsMap.get(opt.group_name)
        if (!existing) {
            uniqueGroupsMap.set(opt.group_name, {
                name: opt.group_name,
                order: opt.group_order ?? 999999, // Handle nulls by pushing to end
                minCreated: opt.created_at
            })
        } else {
            // Keep strictly the same order logic (min group_order seen? usually they are same. min created_at?)
            // We assume group_order is consistent. If not, we take min.
            if (opt.group_order !== null && opt.group_order < existing.order) {
                existing.order = opt.group_order
            }
            if (opt.created_at < existing.minCreated) {
                existing.minCreated = opt.created_at
            }
        }
    })

    const groups = Array.from(uniqueGroupsMap.values()).sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return a.minCreated > b.minCreated ? 1 : -1
    })

    // 3. Find current index
    const currentIndex = groups.findIndex(g => g.name === groupName)
    if (currentIndex === -1) return { error: 'Group not found' }

    // 4. Determine Swap Target
    let targetIndex = currentIndex
    if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1
    } else if (direction === 'down' && currentIndex < groups.length - 1) {
        targetIndex = currentIndex + 1
    }

    if (targetIndex === currentIndex) return { success: true } // No move

    // 5. Swap in array
    const temp = groups[currentIndex]
    groups[currentIndex] = groups[targetIndex]
    groups[targetIndex] = temp

    // 6. Update DB with normalized indices [0, 1, 2...]
    // We update ALL groups to ensure clean state
    const updates = groups.map((g, idx) => {
        // Only update if changed or if we want to enforce normalization
        // Enforcing normalization is good to fix 'null' issues
        return supabase
            .from('gym_price_options')
            .update({ group_order: idx })
            .eq('gym_id', gym.id)
            .eq('group_name', g.name)
    })

    await Promise.all(updates)

    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function updateOption(optionId: string, data: { name?: string, price?: number, group_name?: string }) {
    const supabase = await createClient()

    // If group_name update is requested, we need to handle potential reordering or just move it. 
    // Ideally user only updates name/price for single option. Moving group is trickier via this simple edit. 
    // Let's stick to name/price for single option edit, or group_name for "Group Rename" (which affects all).
    // Actually, allowing individual option to move group is useful. 

    const { error } = await supabase
        .from('gym_price_options')
        .update(data)
        .eq('id', optionId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function updateOptionGroup(oldGroupName: string, newGroupName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Check if new group name already exists (to merge? or block?)
    // For simplicity, let's just update. If it merges, so be it? 
    // Merge might be confusing if orders mess up. But let's allow "Rename".

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    const { error } = await supabase
        .from('gym_price_options')
        .update({ group_name: newGroupName })
        .eq('gym_id', gym.id)
        .eq('group_name', oldGroupName)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}
