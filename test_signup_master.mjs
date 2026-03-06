import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        env[match[1]] = (match[2] || '').replace(/['"]/g, '');
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupMaster() {
    console.log("Attempting sign up as gym_master...");
    const { data, error } = await supabase.auth.signUp({
        email: 'new_test_master_1@example.com',
        password: 'password123',
        options: {
            data: {
                full_name: 'New Test Gym Master',
                phone: '010-8888-8888',
                role: 'gym_master',
                gym_name: 'New Test Gym',
                gym_address: 'Seoul',
                gym_phone: '02-123-4567',
                business_registration_number: '123-45-77777'
            }
        }
    });

    if (error) {
        console.error("Master Sign up failed:", error);
    } else {
        console.log("Master Sign up succeeded!", data.user?.id);
    }
}

testSignupMaster();
