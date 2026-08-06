import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

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

  const supabaseClient = createServerClient(
    finalUrl,
    supabaseAnonKey || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  );

  // DEMO AUTHENTICATION LAYER
  // Intercept auth.getUser() to return a mock user if the demo cookie is present
  const originalGetUser = supabaseClient.auth.getUser.bind(supabaseClient.auth);
  
  supabaseClient.auth.getUser = async () => {
    const demoAuthCookie = cookieStore.get('demo_auth');
    if (demoAuthCookie && demoAuthCookie.value) {
      return {
        data: {
          user: {
            id: '11111111-1111-1111-1111-111111111111',
            email: `demo@${demoAuthCookie.value}.com`,
            role: demoAuthCookie.value,
          }
        },
        error: null
      } as any;
    }
    return originalGetUser();
  };

  return supabaseClient;
}
