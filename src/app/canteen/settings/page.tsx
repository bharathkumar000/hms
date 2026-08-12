'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';

export default function SettingsPage() {
  const { showAlert } = useModal();
  const supabase = createClient();
  const [settings, setSettings] = useState({
    is_open: true,
    opening_time: '07:00:00',
    closing_time: '22:00:00',
    notification_email: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('canteen_settings').select('*').limit(1).single();
      if (data) setSettings(data);
      setLoading(false);
    };
    fetchSettings();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('canteen_settings').update(settings).eq('is_open', settings.is_open); // simplistic update
    if (!error) showAlert('Settings saved successfully.');
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 700 }}>Settings</h1>
      
      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>Restaurant Availability</h2>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
            <input 
              type="checkbox" 
              checked={settings.is_open}
              onChange={e => setSettings({...settings, is_open: e.target.checked})}
              style={{ width: '1.25rem', height: '1.25rem' }}
            />
            Canteen is currently open for orders
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Opening Time</label>
              <input 
                type="time" 
                value={settings.opening_time}
                onChange={e => setSettings({...settings, opening_time: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Closing Time</label>
              <input 
                type="time" 
                value={settings.closing_time}
                onChange={e => setSettings({...settings, closing_time: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Notification Email</label>
            <input 
              type="email" 
              placeholder="e.g., kitchen@hospital.com"
              value={settings.notification_email || ''}
              onChange={e => setSettings({...settings, notification_email: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} 
            />
          </div>
          
          <button type="submit" style={{ padding: '0.75rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
