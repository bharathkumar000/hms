import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL is missing in environment variables.');
  }
  
  if (!supabaseAnonKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in environment variables.');
  }

  const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));
  const finalUrl = isValidUrl ? supabaseUrl : 'https://placeholder.com';

  return createBrowserClient(
    finalUrl,
    supabaseAnonKey || 'placeholder-key'
  )
}
