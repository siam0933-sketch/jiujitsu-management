
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const requestUrl = new URL(request.url)
    const formData = await request.formData()
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))

    // Extra fields
    const full_name = String(formData.get('full_name'))
    const phone = String(formData.get('phone'))
    const role = String(formData.get('role') || 'gym_member')

    // Gym fields
    const gym_name = String(formData.get('gym_name') || '')
    const business_registration_number = String(formData.get('business_registration_number') || '')
    const gym_phone = String(formData.get('gym_phone') || '')
    const gym_address = String(formData.get('gym_address') || '')

    // Team (Alliance) fields
    const team_action = String(formData.get('team_action') || 'none')
    const new_team_name = String(formData.get('new_team_name') || '')
    const join_team_id = String(formData.get('join_team_id') || '')
    const branch_name = String(formData.get('branch_name') || '')
    const current_belt = String(formData.get('current_belt') || '')
    const stripe = String(formData.get('stripe') || '0')
    const last_promotion_date = String(formData.get('last_promotion_date') || '')

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${requestUrl.origin}/auth/callback`,
            data: {
                full_name,
                phone,
                role,
                gym_name,
                business_registration_number,
                gym_phone,
                gym_address,
            },
        },
    })

    if (error) {
        console.error('Sign up error:', error);
        return NextResponse.redirect(
            `${requestUrl.origin}/login?message=Could not authenticate user`,
            { status: 301 }
        )
    }

    // Process Team Action after successful signup
    if (data?.user?.id && team_action !== 'none') {
        const adminClient = await createAdminClient()
        const userId = data.user.id

        if (team_action === 'create' && new_team_name) {
            const { data: newTeam, error: teamError } = await adminClient
                .from('teams')
                .insert({
                    name: new_team_name,
                    representative_name: full_name,
                    representative_id: userId
                })
                .select('id')
                .single()

            if (!teamError && newTeam) {
                const memberData: Record<string, any> = {
                    team_id: newTeam.id,
                    user_id: userId,
                    role: 'representative',
                    member_name: full_name,
                    phone: phone,
                    gym_address: gym_address,
                    gym_name: gym_name || null,
                    branch_name: new_team_name,
                    current_belt: 'black',
                    last_promotion_date: new Date().toISOString()
                }
                // Try with stripe, fall back if column not yet migrated
                const { error: insErr } = await adminClient.from('team_members').insert({ ...memberData, stripe: parseInt(stripe, 10) })
                if (insErr) await adminClient.from('team_members').insert(memberData)
            } else {
                console.error('Create Team error:', teamError)
            }
        }
        else if (team_action === 'join' && join_team_id) {
            const reqData: Record<string, any> = {
                team_id: join_team_id,
                user_id: userId,
                status: 'pending',
                member_name: full_name,
                phone: phone,
                gym_address: gym_address,
                gym_name: gym_name || null,
                branch_name: branch_name,
                current_belt: current_belt,
                last_promotion_date: last_promotion_date || new Date().toISOString()
            }
            const { error: joinError } = await adminClient.from('team_join_requests').insert({ ...reqData, stripe: parseInt(stripe, 10) })
            if (joinError) await adminClient.from('team_join_requests').insert(reqData)
        }
    }

    // Redirect based on role / team action
    if (role === 'gym_member') {
        // Members need admin approval before they can log in
        return NextResponse.redirect(
            `${requestUrl.origin}/signup/pending?type=member`,
            { status: 301 }
        )
    }

    if (team_action === 'join') {
        // Gym master joined a team — show team pending page
        return NextResponse.redirect(
            `${requestUrl.origin}/signup/pending?type=team`,
            { status: 301 }
        )
    }

    return NextResponse.redirect(
        `${requestUrl.origin}/login?message=Check email to continue sign in process`,
        { status: 301 }
    )
}
