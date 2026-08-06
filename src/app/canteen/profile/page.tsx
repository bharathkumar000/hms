'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';

export default function ProfilePage() {
  const { showAlert } = useModal();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.id === 'demo-user-id') {
          setProfile({ first_name: 'Canteen', last_name: 'Manager', role: 'Staff' });
        } else {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setProfile(data);
        }
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showAlert('Profile updated successfully.');
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 700 }}>Profile</h1>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>First Name</label>
              <input value={profile.first_name} readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', background: '#f9fafb' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Last Name</label>
              <input value={profile.last_name} readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', background: '#f9fafb' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Role</label>
            <input value={profile.role} readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', background: '#f9fafb' }} />
          </div>
          <button type="submit" style={{ padding: '0.75rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
