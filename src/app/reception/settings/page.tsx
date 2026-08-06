import { useModal } from '@/components/ModalProvider';
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Save, User } from 'lucide-react';
import styles from '../patients/patients.module.css'; // Reusing patient form styles

export default function ReceptionSettings() {
  const { showAlert, showConfirm } = useModal();

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data } = await supabase
        .from('reception_staff')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
          email: data.email || ''
        });
      }
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Upsert profile
    const { error } = await supabase
      .from('reception_staff')
      .upsert({
        user_id: userId,
        ...profile
      }, { onConflict: 'user_id' });

    if (error) {
      showAlert('Error updating profile: ' + error.message);
    } else {
      showAlert('Profile updated successfully!');
    }
    
    setSaving(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.details}>Manage your account preferences and profile.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.formGroupFull} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'var(--color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
             <User size={32} />
           </div>
           <div>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Profile Information</h2>
             <p className={styles.details} style={{ marginTop: 0 }}>Update your personal details here.</p>
           </div>
        </div>

        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <form onSubmit={handleSave}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>First Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={profile.first_name} 
                  onChange={e => setProfile({...profile, first_name: e.target.value})} 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Last Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={profile.last_name} 
                  onChange={e => setProfile({...profile, last_name: e.target.value})} 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input 
                  type="tel" 
                  className={styles.input} 
                  value={profile.phone_number} 
                  onChange={e => setProfile({...profile, phone_number: e.target.value})} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  value={profile.email} 
                  onChange={e => setProfile({...profile, email: e.target.value})} 
                />
              </div>
            </div>

            <div className={styles.formActions} style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
