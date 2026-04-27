'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ClassTemplate = {
    id: string
    gym_id: string
    title: string
    subtitle: string | null
    details: string | null
    color_tag: string
    color_name: string | null
    created_at: string
}

export type CalendarClass = {
    id: string
    gym_id: string
    template_id: string
    class_date: string
    sort_order: number // added
    created_at: string
    template?: ClassTemplate
}

export async function getClassTemplates() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return []

    const { data } = await supabase
        .from('gym_class_templates')
        .select('*')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false })

    return (data || []) as ClassTemplate[]
}

export async function createClassTemplate(data: {
    title: string,
    subtitle?: string,
    details?: string,
    color_tag: string,
    color_name?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { error: 'Gym not found' }

    const { error } = await supabase
        .from('gym_class_templates')
        .insert({
            gym_id: gym.id,
            title: data.title,
            subtitle: data.subtitle || null,
            details: data.details || null,
            color_tag: data.color_tag,
            color_name: data.color_name || null
        })

    if (error) {
        console.error(error)
        return { error: '수업(템플릿) 생성 실패' }
    }

    revalidatePath('/dashboard/plan')
    return { success: true }
}

export async function deleteClassTemplate(id: string) {
    const supabase = await createClient()
    
    // Check ownership first or just rely on RLS
    const { error } = await supabase
        .from('gym_class_templates')
        .delete()
        .eq('id', id)

    if (error) return { error: '삭제 실패' }
    
    revalidatePath('/dashboard/plan')
    return { success: true }
}

export async function getCalendarClasses(startDate: string, endDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return []

    const { data } = await supabase
        .from('gym_calendar_classes')
        .select(`
            *,
            template:gym_class_templates(*)
        `)
        .eq('gym_id', gym.id)
        .gte('class_date', startDate)
        .lte('class_date', endDate)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

    return (data || []) as CalendarClass[]
}

export async function addClassToCalendar(templateId: string, classDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { error: 'Gym not found' }

    const { error } = await supabase
        .from('gym_calendar_classes')
        .insert({
            gym_id: gym.id,
            template_id: templateId,
            class_date: classDate
        })

    if (error) {
        console.error(error)
        return { error: '달력에 수업 추가 실패' }
    }

    revalidatePath('/dashboard/plan')
    return { success: true }
}

export async function removeClassFromCalendar(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_calendar_classes')
        .delete()
        .eq('id', id)


    if (error) return { error: '달력에서 수업 제거 실패' }

    revalidatePath('/dashboard/plan')
    return { success: true }
}

export type ColorSetting = {
    color_tag: string
    label_name: string | null
}

export async function getColorSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return []

    const { data } = await supabase
        .from('gym_class_colors')
        .select('*')
        .eq('gym_id', gym.id)

    return (data || []) as ColorSetting[]
}

export async function saveColorSettings(settings: { color_tag: string, label_name: string }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { error: 'Gym not found' }

    // Upsert the settings
    const upserts = settings.map(s => ({
        gym_id: gym.id,
        color_tag: s.color_tag,
        label_name: s.label_name || null // null if empty string
    }))

    const { error } = await supabase
        .from('gym_class_colors')
        .upsert(upserts, { onConflict: 'gym_id,color_tag' })

    if (error) {
        console.error(error)
        return { error: '설정 저장 실패' }
    }

    revalidatePath('/dashboard/plan')
    return { success: true }
}

export async function updateClassTemplate(id: string, data: {
    title: string,
    subtitle?: string,
    details?: string,
    color_tag: string,
    color_name?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('gym_class_templates')
        .update({
            title: data.title,
            subtitle: data.subtitle || null,
            details: data.details || null,
            color_tag: data.color_tag,
            color_name: data.color_name || null
        })
        .eq('id', id)

    if (error) {
        console.error(error)
        return { error: '수업 수정 실패' }
    }

    revalidatePath('/dashboard/plan')
    return { success: true }
}

export async function updateCalendarClassPositions(items: { id: string, class_date: string, sort_order: number }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { error: 'Gym not found' }

    // Update each item
    for (const item of items) {
        await supabase
            .from('gym_calendar_classes')
            .update({ class_date: item.class_date, sort_order: item.sort_order })
            .eq('id', item.id)
            .eq('gym_id', gym.id)
    }

    revalidatePath('/dashboard/plan')
    return { success: true }
}
