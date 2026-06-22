import { createClient } from '@supabase/supabase-js'

// Supabase connection. The anon key is a public, client-safe key (it ships in
// the browser bundle by design and is gated by row-level security), so the
// literal fallbacks keep the deployed demo working even without env vars set.
// Override locally via .env.local with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://jtjxhvzhevoeqixkhmok.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0anhodnpoZXZvZXFpeGtobW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDA0MDMsImV4cCI6MjA5NzcxNjQwM30.b81_sQTWYCZpYev7Kf16x4dFJK4NWfiHMMjl_kbEuX0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
