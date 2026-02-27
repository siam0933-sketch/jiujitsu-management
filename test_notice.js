const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [k, ...v] = line.split('=');
    if(k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"']/g, '');
    return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const { data: notices } = await supabase.from('gym_notices').select('*').limit(1);
    if (!notices || notices.length === 0) { console.log('no notice'); return; }
    const notice = notices[0];
    console.log('Notice ID:', notice.id);
    const { error } = await supabase.from('gym_notices').update({
        title: notice.title,
        content: notice.content,
        images: notice.images,
        updated_at: new Date().toISOString()
    }).eq('id', notice.id);
    console.log('Update Error:', JSON.stringify(error, null, 2));
})();
