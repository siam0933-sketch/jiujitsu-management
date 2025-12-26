'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(prevState: any, formData: FormData) {
    console.log('[Login Action] Started')
    try {
        const supabase = await createClient()
        console.log('[Login Action] Supabase Client Created')

        const email = String(formData.get('email'))
        const password = String(formData.get('password'))

        console.log('[Login Action] Attempting Auth for:', email)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('[Login Action] Auth Error:', error.message)
            return { message: error.message, success: false }
        }

        console.log('[Login Action] Success. Revalidating...')
        revalidatePath('/', 'layout')
        return { message: '', success: true }
    } catch (err: any) {
        console.error('[Login Action] CRITICAL CRASH:', err)
        return { message: 'Server crashed during login: ' + err.message, success: false }
    }
}
