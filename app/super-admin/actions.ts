'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveGym(formData: FormData) {
    const gymId = formData.get('gymId')
    if (!gymId) return { error: 'No gym ID provided' }

    try {
        const supabase = await createAdminClient()

        // Update the gym status to active and return the updated row
        const { data, error } = await supabase
            .from('gyms')
            .update({ status: 'active' })
            .eq('id', gymId)
            .select()

        if (error) {
            console.error('Failed to approve gym:', error)
            return { error: `DB Error: ${error.message}` }
        }

        if (!data || data.length === 0) {
            console.error(`Gym update returned 0 rows for ID: ${gymId}`)
            return { error: 'DB 업데이트가 0건입니다. (권한 문제이거나 Vercel 환경변수 누락 의심)' }
        }

        revalidatePath('/super-admin')
        return { success: true }
    } catch (err: any) {
        console.error('Server action catch error:', err)
        return { error: `Server Error: ${err.message}` }
    }
}

export async function rejectGym(formData: FormData) {
    const gymId = formData.get('gymId')
    if (!gymId) return { error: 'No gym ID provided' }

    try {
        const supabase = await createAdminClient()

        // Actually delete the gym or set it to 'rejected'. For now, let's set it to 'rejected' for record keeping.
        const { data, error } = await supabase
            .from('gyms')
            .update({ status: 'rejected' })
            .eq('id', gymId)
            .select()

        if (error) {
            console.error('Failed to reject gym:', error)
            return { error: `DB Error: ${error.message}` }
        }

        if (!data || data.length === 0) {
            console.error(`Gym update returned 0 rows for ID: ${gymId}`)
            return { error: 'DB 업데이트가 0건입니다. (권한 문제이거나 Vercel 환경변수 누락 의심)' }
        }

        revalidatePath('/super-admin')
        return { success: true }
    } catch (err: any) {
        console.error('Server action catch error:', err)
        return { error: `Server Error: ${err.message}` }
    }
}

export async function createSystemNotice(title: string, content: string, is_active: boolean = true) {
    const supabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('system_notices')
        .insert({
            title,
            content,
            is_active,
            author_id: user.id
        })

    if (error) {
        console.error('Failed to create notice:', error)
        return { error: '공지사항 작성에 실패했습니다.' }
    }

    revalidatePath('/super-admin/notices')
    revalidatePath('/dashboard') // Also invalidate dashboard so gyms see it
    return { success: true }
}

export async function updateSystemNotice(id: string, title: string, content: string, is_active: boolean) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('system_notices')
        .update({ title, content, is_active })
        .eq('id', id)

    if (error) {
        console.error('Failed to update notice:', error)
        return { error: '공지사항 수정에 실패했습니다.' }
    }

    revalidatePath('/super-admin/notices')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteSystemNotice(id: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('system_notices')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Failed to delete notice:', error)
        return { error: '공지사항 삭제에 실패했습니다.' }
    }

    revalidatePath('/super-admin/notices')
    revalidatePath('/dashboard')
    return { success: true }
}
