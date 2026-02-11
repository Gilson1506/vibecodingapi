import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('[DEBUG] Supabase URL:', supabaseUrl);
console.log('[DEBUG] Supabase URL check:', supabaseUrl !== 'https://your-project.supabase.co');
console.log('[DEBUG] Supabase Key exists:', !!supabaseServiceKey);

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseServiceKey !== 'your_service_key_here') {
    // Create Supabase client with service role (bypasses RLS)
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    console.log('✅ Supabase client initialized');
} else {
    console.log('⚠️ Supabase credentials not configured - database features disabled');
}

export { supabase };
