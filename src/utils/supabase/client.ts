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

  const supabaseClient = createBrowserClient(
    finalUrl,
    supabaseAnonKey || 'placeholder-key'
  );

  // DEMO AUTHENTICATION LAYER (Matching server implementation)
  const originalGetUser = supabaseClient.auth.getUser.bind(supabaseClient.auth);
  const originalGetSession = supabaseClient.auth.getSession.bind(supabaseClient.auth);
  
  const getDemoUser = () => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )demo_auth=([^;]+)'));
      if (match) {
        return {
          id: '11111111-1111-1111-1111-111111111111',
          email: `demo@${match[2]}.com`,
          role: match[2],
        };
      }
    }
    return null;
  };

  supabaseClient.auth.getUser = async () => {
    const demoUser = getDemoUser();
    if (demoUser) {
      return { data: { user: demoUser }, error: null } as any;
    }
    return originalGetUser();
  };

  supabaseClient.auth.getSession = async () => {
    const demoUser = getDemoUser();
    if (demoUser) {
      return { data: { session: { user: demoUser } }, error: null } as any;
    }
    return originalGetSession();
  };

  return supabaseClient;
}
