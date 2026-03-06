import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[key] = value;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupMember() {
    console.log("Attempting sign up as gym_member...");
    const { data, error } = await supabase.auth.signUp({
        email: 'test_member_999@example.com',
        password: 'password123',
        options: {
            data: {
                full_name: 'Test Gym Member',
                phone: '010-9999-9999',
                role: 'gym_member'
            }
        }
    });

    if (error) {
        console.error("Member Sign up failed:", error);
    } else {
        console.log("Member Sign up succeeded!", data.user?.id);
    }
}

testSignupMember();
