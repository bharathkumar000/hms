'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bell, CheckCircle } from 'lucide-react';
import styles from '../prescriptions/prescriptions.module.css';

export default function PharmacyNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.details}>Stay updated with system alerts and inventory changes.</p>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length > 0 ? (
          <div className={styles.list}>
            {notifications.map(notif => (
              <div key={notif.id} className={styles.listItem} style={{ backgroundColor: notif.is_read ? 'transparent' : 'rgba(41, 92, 255, 0.05)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: notif.is_read ? 'var(--color-text-secondary)' : 'var(--color-primary)', marginTop: '0.25rem' }}>
                    <Bell size={20} />
                  </div>
                  <div>
                    <div className={styles.itemMain} style={{ fontWeight: notif.is_read ? 500 : 700 }}>
                      {notif.title}
                    </div>
                    <div className={styles.itemSub} style={{ color: notif.is_read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                      {notif.message}
                    </div>
                    <div className={styles.itemSub} style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {!notif.is_read && (
                  <button className={styles.btnOutline} onClick={() => markAsRead(notif.id)} style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)' }}>
            <Bell size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>You have no new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
