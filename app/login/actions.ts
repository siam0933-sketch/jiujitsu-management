'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = String(formData.get('email'))
    const password = String(formData.get('password'))

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login Error:', error.message)
        return { message: error.message, success: false }
    }

    revalidatePath('/', 'layout')
    return { message: '', success: true }
}
