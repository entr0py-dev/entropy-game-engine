import { createClient } from '@supabase/supabase-js';

// 1. Load variables (with fallbacks to prevent crashes)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// 2. Debugging (Check your browser console to see if these load!)
if (typeof window !== 'undefined') {
    if (!supabaseUrl) console.error("❌ Supabase URL missing! Check NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) console.error("❌ Supabase Key missing! Check NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// 3. Create Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
