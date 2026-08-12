'use client';

import { User } from 'lucide-react';
import styles from '../../users/users.module.css';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminProfile() {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Profile</h1>
          <p className={styles.details}>View and manage your account details.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
              <User size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{profile ? `${profile.first_name} ${profile.last_name}` : 'Admin User'}</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Administrator</p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>First Name</label>
            <input type="text" value={profile?.first_name || ''} readOnly disabled />
          </div>
          
          <div className={styles.formGroup}>
            <label>Last Name</label>
            <input type="text" value={profile?.last_name || ''} readOnly disabled />
          </div>
          
          <div className={styles.formGroup}>
            <label>Role</label>
            <input type="text" value={profile?.role || 'admin'} readOnly disabled />
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Note: Admin profiles are managed centrally. Contact Super Admin to modify root account details.
          </p>
        </div>
      </div>
    </div>
  );
}
