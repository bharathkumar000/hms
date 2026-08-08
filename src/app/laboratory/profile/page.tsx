import { createClient } from '@/utils/supabase/server';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Handling case where auth is disabled for demo, but we need a user
    // We'll pass a dummy profile if no real auth is found, for preview purposes.
  }

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('lab_staff')
      .select('*')
      .eq('user_id', user.id)
      .single();
    profile = data;
  }

  // Fallback demo profile
  if (!profile) {
    profile = {
      id: 'demo-id',
      first_name: 'Demo',
      last_name: 'Technician',
      email: user?.email || 'demo.tech@hospital.com',
      phone_number: '+1 234 567 8900',
      role: 'Technician',
    };
  }

  return <ProfileClient initialProfile={profile} />;
}
