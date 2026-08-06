'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './profile.module.css';

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userId, setUserId] = useState<string | null>(null);
  
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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || (await supabase.auth.getUser()).data.user;
      
      if (user) {
        setUserId(user.id);
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
    
    try {
      let activeUserId = userId;
      
      // Fallback if state was lost
      if (!activeUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        activeUserId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id;
      }
      
      if (!activeUserId) {
        setMessage({ text: 'Error: User not authenticated. Please refresh the page.', type: 'error' });
        setSaving(false);
        return;
      }

      // Convert empty strings to null for better database compatibility
      const cleanData = {
        id: activeUserId, 
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        date_of_birth: profile.date_of_birth ? profile.date_of_birth : null,
        gender: profile.gender || null,
        phone_number: profile.phone_number || null,
        address: profile.address || null,
        emergency_contact_name: profile.emergency_contact_name || null,
        emergency_contact_phone: profile.emergency_contact_phone || null,
        blood_group: profile.blood_group || null,
        insurance_provider: profile.insurance_provider || null,
        insurance_policy_number: profile.insurance_policy_number || null,
        updated_at: new Date().toISOString()
      };

      // If this is the mock demo user, simulate a successful save to avoid PostgreSQL UUID & RLS errors
      if (activeUserId === 'demo-user-id') {
        // We simulate saving to local storage so the form retains the data in demo mode if desired,
        // but for now, we just show the success message.
        setTimeout(() => {
          setMessage({ text: 'Profile updated successfully! (Demo Mode)', type: 'success' });
          setSaving(false);
        }, 800);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(cleanData);
        
      if (error) {
        console.error('Profile save error:', error);
        setMessage({ text: `Error updating profile: ${error.message}`, type: 'error' });
      } else {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setMessage({ text: `An unexpected error occurred: ${err.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setSaving(false);
    }
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
