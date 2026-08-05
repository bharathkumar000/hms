'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../profile/profile.module.css';

export default function SettingsPage() {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      setSaving(false);
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setMessage({ text: 'Password should be at least 6 characters.', type: 'error' });
      setSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new_password
    });
      
    if (error) {
      setMessage({ text: error.message || 'Error updating password. Please try again.', type: 'error' });
    } else {
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setPasswordForm({ new_password: '', confirm_password: '' });
    }
    
    setSaving(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
      </div>
      
      <div className={styles.card}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Change Password</h2>
        <form onSubmit={handlePasswordUpdate}>
          <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
            <label className={styles.label}>New Password</label>
            <input 
              type="password" 
              name="new_password" 
              value={passwordForm.new_password} 
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup} style={{ maxWidth: '400px', marginBottom: '2rem' }}>
            <label className={styles.label}>Confirm New Password</label>
            <input 
              type="password" 
              name="confirm_password" 
              value={passwordForm.confirm_password} 
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Updating...' : 'Update Password'}
          </button>
          
          {message.text && (
            <div className={message.type === 'error' ? styles.errorMessage : styles.successMessage}>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
