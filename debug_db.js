
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim().replace(/"/g, ''); // Simple cleanup
    }
});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
    console.log("Inspecting gym_attendance_logs...");

    // 1. Check one record to guess schema types
    const { data: logs, error } = await supabase
        .from('gym_attendance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching logs:", error);
        return;
    }

    console.log("Recent Logs:", JSON.stringify(logs, null, 2));

    if (logs.length > 0) {
        const sample = logs[0];
        console.log("Sample Date value:", sample.date, "Type:", typeof sample.date);

        // Check for duplicates
        const dates = logs.map(l => l.date);
        console.log("Dates found:", dates);
    }
}

inspect();
