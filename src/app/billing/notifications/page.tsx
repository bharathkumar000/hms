'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bell, CheckCircle, Trash2, Clock } from 'lucide-react';
import styles from './notifications.module.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();

    // Setup realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      if (data) {
        setNotifications(data);
      }
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  if (loading) return <div className={styles.container}><p>Loading notifications...</p></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.details}>Stay updated with recent billing events.</p>
        </div>
        <button 
          className={styles.btnOutline} 
          onClick={markAllAsRead}
          disabled={!notifications.some(n => !n.is_read)}
        >
          <CheckCircle size={18} /> Mark all as read
        </button>
      </header>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <h3>No Notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`${styles.item} ${!notif.is_read ? styles.unread : ''}`}>
              <div className={styles.itemIcon}>
                <Bell size={20} />
              </div>
              <div className={styles.itemContent}>
                <h4 className={styles.itemTitle}>{notif.title}</h4>
                <p className={styles.itemMessage}>{notif.message}</p>
                <span className={styles.itemTime}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </div>
              <div className={styles.itemActions}>
                {!notif.is_read && (
                  <button 
                    className={styles.iconBtn} 
                    onClick={() => markAsRead(notif.id)}
                    title="Mark as read"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
                <button 
                  className={`${styles.iconBtn} ${styles.danger}`} 
                  onClick={() => deleteNotification(notif.id)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
