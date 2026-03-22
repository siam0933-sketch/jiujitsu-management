'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { extractImagePathsFromHtml, deleteImagesFromStorage } from '@/utils/storage'

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

    // Fetch content to extract images before deletion
    const { data: notice } = await supabase.from('system_notices').select('content').eq('id', id).single()

    const { error } = await supabase
        .from('system_notices')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Failed to delete notice:', error)
        return { error: '공지사항 삭제에 실패했습니다.' }
    }
    
    // Clean up images from storage bucket
    if (notice?.content) {
        const paths = extractImagePathsFromHtml(notice.content)
        if (paths.length > 0) {
            await deleteImagesFromStorage(paths)
        }
    }

    revalidatePath('/super-admin/notices')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function resetGymOwnerPassword(gymId: string) {
    try {
        const supabase = await createAdminClient()
        
        // 1. Get owner ID and phone from gym
        const { data: gym, error: gymErr } = await supabase
            .from('gyms')
            .select(`
                owner_id,
                owner:profiles!gyms_owner_id_fkey(
                    id,
                    phone
                )
            `)
            .eq('id', gymId)
            .single()
            
        if (gymErr) return { error: '도장 정보를 찾을 수 없습니다.' }
        
        const ownerId = gym.owner_id
        // Handle case where profile join might vary
        const phone = Array.isArray(gym.owner) ? gym.owner[0]?.phone : (gym.owner as any)?.phone || ''
        
        // 2. Generate temp password (last 4 digits of phone or '123456')
        let tempPassword = '123456'
        if (phone && phone.replace(/\D/g, '').length >= 4) {
             tempPassword = phone.replace(/\D/g, '').slice(-4)
             // padding to 6 chars minimum
             tempPassword = tempPassword.padStart(6, '0')
        }
            
        // 3. Force update via admin API
        const { error: updateErr } = await supabase.auth.admin.updateUserById(
            ownerId,
            { password: tempPassword }
        )
        
        if (updateErr) {
            console.error('Failed to reset password via admin UI:', updateErr)
            return { error: '비밀번호 초기화 실패: ' + updateErr.message }
        }
        
        return { success: true, tempPassword }
    } catch (err: any) {
        return { error: '서버 에러: ' + err.message }
    }
}
