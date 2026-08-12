'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';
import { User, Save, Lock } from 'lucide-react';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setEmail(user.email || '');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data) {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
      }
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', user.id);
        
      if (error) {
        showAlert('Error updating profile: ' + error.message);
      } else {
        showAlert('Profile updated successfully!');
      }
    }
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      showAlert('Password must be at least 6 characters.');
      return;
    }
    
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    if (error) {
      showAlert('Error updating password: ' + error.message);
    } else {
      showAlert('Password updated successfully!');
      setPassword('');
    }
    setSaving(false);
  };

  if (loading) return <div className={styles.container}><p>Loading profile...</p></div>;

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
          <h2 className={styles.cardTitle}>
            <User size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Personal Information
          </h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              type="email" 
              className={styles.input} 
              value={email} 
              disabled 
            />
            <small style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', display: 'block' }}>Email cannot be changed.</small>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>First Name</label>
            <input 
              type="text" 
              className={styles.input} 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Last Name</label>
            <input 
              type="text" 
              className={styles.input} 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Role</label>
            <input 
              type="text" 
              className={styles.input} 
              value={profile?.role || 'Billing Staff'} 
              disabled
            />
          </div>

          <button 
            className={styles.btnPrimary} 
            onClick={handleUpdateProfile}
            disabled={saving}
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Lock size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Security Settings
          </h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <button 
            className={styles.btnPrimary} 
            onClick={handleUpdatePassword}
            disabled={saving || !password}
          >
            <Lock size={18} /> {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
