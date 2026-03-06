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

async function testSignup() {
    console.log("Attempting sign up...");
    const { data, error } = await supabase.auth.signUp({
        email: 'test_gym_999@example.com',
        password: 'password123',
        options: {
            data: {
                full_name: 'Test Gym Master',
                phone: '010-9999-9999',
                role: 'gym_master',
                gym_name: '테스트도장999',
                business_registration_number: '123-45-67890',
                gym_phone: '02-123-4567',
                gym_address: 'Seoul',
            }
        }
    });

    if (error) {
        console.error("Sign up failed:", error);
    } else {
        console.log("Sign up succeeded!", data.user?.id);
    }
}

testSignup();
