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

    // Get max order for this group
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

    // 1. Get current group stats
    const { data: targetGroup } = await supabase
        .from('gym_price_options')
        .select('group_order')
        .eq('gym_id', gym.id)
        .eq('group_name', groupName)
        .limit(1)
        .single()

    if (!targetGroup) return { error: 'Group not found' }

    const currentOrder = targetGroup.group_order

    // 2. Find adjacent group
    let adjacentQuery = supabase
        .from('gym_price_options')
        .select('group_name, group_order')
        .eq('gym_id', gym.id)
        .neq('group_name', groupName)

    if (direction === 'up') {
        adjacentQuery = adjacentQuery
            .lt('group_order', currentOrder)
            .order('group_order', { ascending: false })
            .limit(1)
    } else {
        adjacentQuery = adjacentQuery
            .gt('group_order', currentOrder)
            .order('group_order', { ascending: true })
            .limit(1)
    }

    const { data: adjacentGroup } = await adjacentQuery.maybeSingle()

    if (!adjacentGroup) return { success: true } // Already at top/bottom

    const adjacentOrder = adjacentGroup.group_order
    const adjacentName = adjacentGroup.group_name

    // 3. Swap group_order for ALL items in both groups
    const { error: e1 } = await supabase
        .from('gym_price_options')
        .update({ group_order: adjacentOrder })
        .eq('gym_id', gym.id)
        .eq('group_name', groupName)

    if (e1) return { error: e1.message }

    const { error: e2 } = await supabase
        .from('gym_price_options')
        .update({ group_order: currentOrder })
        .eq('gym_id', gym.id)
        .eq('group_name', adjacentName)

    if (e2) return { error: e2.message }

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
