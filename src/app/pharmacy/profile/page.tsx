'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Save, Lock } from 'lucide-react';
import styles from './profile.module.css';

export default function PharmacyProfile() {
  const { showAlert } = useModal();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setProfile(prev => ({ ...prev, email: user.email || '' }));

      const { data } = await supabase
        .from('pharmacists')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: user.email || '',
          phone: data.phone_number || '',
          license_number: data.license_number || ''
        });
      }
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('pharmacists')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone,
          license_number: profile.license_number
        })
        .eq('user_id', user.id);

      if (!error) {
        showAlert('Profile updated successfully!');
      } else {
        showAlert('Error updating profile: ' + error.message);
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlert('Passwords do not match!');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    });

    if (!error) {
      showAlert('Password updated successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } else {
      showAlert('Error updating password: ' + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.details}>Manage your personal information and security settings.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <User size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Personal Information</h2>
          </div>
          
          {loading ? <p>Loading profile...</p> : (
            <form onSubmit={handleUpdateProfile}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>First Name</label>
                  <input required type="text" value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Last Name</label>
                  <input required type="text" value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Email Address (Cannot be changed)</label>
                <input type="email" value={profile.email} disabled style={{ backgroundColor: 'var(--color-light)', cursor: 'not-allowed' }} />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
              </div>
              
              <div className={styles.formGroup}>
                <label>Pharmacy License Number</label>
                <input type="text" value={profile.license_number} onChange={e => setProfile({...profile, license_number: e.target.value})} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="submit" className={styles.btnPrimary}><Save size={16} style={{ display:'inline', marginRight:'4px', verticalAlign:'text-bottom' }} /> Save Changes</button>
              </div>
            </form>
          )}
        </div>

        <div className={styles.card} style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <Lock size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Security Settings</h2>
          </div>
          
          <form onSubmit={handleUpdatePassword}>
            <div className={styles.formGroup}>
              <label>New Password</label>
              <input required type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} minLength={6} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Confirm New Password</label>
              <input required type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} minLength={6} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" className={styles.btnPrimary}><Save size={16} style={{ display:'inline', marginRight:'4px', verticalAlign:'text-bottom' }} /> Update Password</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
