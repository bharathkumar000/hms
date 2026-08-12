'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertTriangle, FileText, Settings, Info } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './notifications.module.css';

export default function NotificationsClient({ initialNotifications, userId }: { initialNotifications: any[], userId: string }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new notifications using Supabase Realtime
    const channel = supabase
      .channel('realtime:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          // Could also trigger a browser notification here
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const markAsRead = async (id: string, isVirtual: boolean = false) => {
    if (isVirtual) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      return;
    }
    
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      if (userId) {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string, isVirtual: boolean = false) => {
    if (isVirtual) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      return;
    }
    
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to delete notification');
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Urgent': return <AlertTriangle size={20} color="#dc2626" />;
      case 'Report': return <FileText size={20} color="#2563eb" />;
      case 'Maintenance': return <Settings size={20} color="#d97706" />;
      default: return <Info size={20} color="#4b5563" />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>Stay updated with lab activities and alerts.</p>
        </div>
        <button className={styles.btnSecondary} onClick={markAllAsRead}>
          <Check size={18} /> Mark All as Read
        </button>
      </header>

      <div className={styles.list}>
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`${styles.notificationCard} ${!notification.is_read ? styles.unread : ''}`}
            >
              <div className={styles.iconWrapper}>
                {getIcon(notification.type)}
              </div>
              
              <div className={styles.content}>
                <div className={styles.contentHeader}>
                  <h3 className={styles.notificationTitle}>{notification.title}</h3>
                  <span className={styles.timestamp}>
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
                <p className={styles.message}>{notification.message}</p>
              </div>

              <div className={styles.actions}>
                {!notification.is_read && (
                  <button 
                    className={styles.iconBtn} 
                    onClick={() => markAsRead(notification.id, notification.isVirtual)}
                    title="Mark as Read"
                  >
                    <Check size={18} color="var(--color-primary)" />
                  </button>
                )}
                <button 
                  className={styles.iconBtnDanger} 
                  onClick={() => deleteNotification(notification.id, notification.isVirtual)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <Bell size={48} color="var(--color-text-secondary)" />
            <h3>All Caught Up!</h3>
            <p>You have no new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
