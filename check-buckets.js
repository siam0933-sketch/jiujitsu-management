const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;
    
    console.log('Buckets:', buckets.map(b => ({ name: b.name, public: b.public })));
    
    for (const b of buckets) {
        const { data: files1, error: e1 } = await supabase.storage.from(b.name).list('apk');
        if (files1 && files1.length > 0) {
            console.log(`Files in ${b.name}/apk:`, files1.map(f => f.name));
        }
        
        // Also check root just in case
        const { data: files2 } = await supabase.storage.from(b.name).list();
        if (files2 && files2.length > 0) {
            console.log(`Files in ${b.name} (root):`, files2.filter(f => f.name.includes('apk') || f.name.includes('Kiosk')).map(f => f.name));
        }
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
