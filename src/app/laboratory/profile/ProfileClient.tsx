'use client';

import { useState } from 'react';
import { User, Mail, Phone, Lock, Bell, Save, Shield } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './profile.module.css';

export default function ProfileClient({ initialProfile }: { initialProfile: any }) {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const supabase = createClient();

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.id === 'demo-id') {
      setMessage({ type: 'error', text: 'Cannot update demo profile.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase
        .from('lab_staff')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          email: profile.email
        })
        .eq('id', profile.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to update password. Ensure you are fully authenticated.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>Manage your personal information and preferences.</p>
        </div>
      </header>

      {message.text && (
        <div className={`${styles.alert} ${message.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
          {message.text}
        </div>
      )}

      <div className={styles.grid}>
        {/* Personal Information */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User size={20} color="var(--color-primary)" />
            <h2>Personal Information</h2>
          </div>
          
          <form className={styles.form} onSubmit={handleProfileUpdate}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input 
                  type="text" 
                  value={profile.first_name || ''} 
                  onChange={e => setProfile({...profile, first_name: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={profile.last_name || ''} 
                  onChange={e => setProfile({...profile, last_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label><Mail size={14} /> Email Address</label>
              <input 
                type="email" 
                value={profile.email || ''} 
                onChange={e => setProfile({...profile, email: e.target.value})}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label><Phone size={14} /> Phone Number</label>
              <input 
                type="tel" 
                value={profile.phone_number || ''} 
                onChange={e => setProfile({...profile, phone_number: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label><Shield size={14} /> Role</label>
              <input 
                type="text" 
                value={profile.role || 'Technician'} 
                disabled
                className={styles.disabledInput}
              />
              <span className={styles.helpText}>Role changes must be done by an Administrator.</span>
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              <Save size={16} /> Save Changes
            </button>
          </form>
        </div>

        {/* Security & Preferences */}
        <div className={styles.column}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Lock size={20} color="var(--color-primary)" />
              <h2>Change Password</h2>
            </div>
            
            <form className={styles.form} onSubmit={handlePasswordUpdate}>
              <div className={styles.formGroup}>
                <label>New Password</label>
                <input 
                  type="password" 
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwords.confirm}
                  onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className={styles.btnSecondary} disabled={loading}>
                Update Password
              </button>
            </form>
          </div>

          <div className={styles.card} style={{ marginTop: '1.5rem' }}>
            <div className={styles.cardHeader}>
              <Bell size={20} color="var(--color-primary)" />
              <h2>Notification Preferences</h2>
            </div>
            
            <div className={styles.preferences}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" defaultChecked />
                Email me when a new urgent test is requested
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" defaultChecked />
                Browser notifications for new sample collections
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" defaultChecked />
                Weekly performance summary
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
