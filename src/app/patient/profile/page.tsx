'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './profile.module.css';

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone_number: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: '',
    insurance_provider: '',
    insurance_policy_number: ''
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setProfile(data);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          ...profile,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        setMessage({ text: 'Error updating profile. Please try again.', type: 'error' });
      } else {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      }
    }
    setSaving(false);
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
      </div>
      
      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name</label>
              <input 
                type="text" 
                name="first_name" 
                value={profile.first_name || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name</label>
              <input 
                type="text" 
                name="last_name" 
                value={profile.last_name || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Date of Birth</label>
              <input 
                type="date" 
                name="date_of_birth" 
                value={profile.date_of_birth || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Gender</label>
              <select 
                name="gender" 
                value={profile.gender || ''} 
                onChange={handleChange as any}
                className={styles.input}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input 
                type="text" 
                name="phone_number" 
                value={profile.phone_number || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Blood Group</label>
              <input 
                type="text" 
                name="blood_group" 
                value={profile.blood_group || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Address</label>
            <input 
              type="text" 
              name="address" 
              value={profile.address || ''} 
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Emergency Contact</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contact Name</label>
              <input 
                type="text" 
                name="emergency_contact_name" 
                value={profile.emergency_contact_name || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contact Phone</label>
              <input 
                type="text" 
                name="emergency_contact_phone" 
                value={profile.emergency_contact_phone || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Insurance Information</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Provider Name</label>
              <input 
                type="text" 
                name="insurance_provider" 
                value={profile.insurance_provider || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Policy Number</label>
              <input 
                type="text" 
                name="insurance_policy_number" 
                value={profile.insurance_policy_number || ''} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
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
