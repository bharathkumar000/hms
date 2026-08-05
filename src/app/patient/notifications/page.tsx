import { createClient } from '@/utils/supabase/server';
import styles from './notifications.module.css';
import { redirect } from 'next/navigation';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Mark all as read (simple approach for demo, would normally be an API call)
  if (notifications && notifications.some(n => !n.is_read)) {
    // Fire and forget update
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
      </div>

      <div className={styles.card}>
        {(!notifications || notifications.length === 0) ? (
          <div style={{ padding: '2rem' }}>
            <p>You have no notifications.</p>
          </div>
        ) : (
          <div className={styles.notifList}>
            {notifications.map((notif) => (
              <div key={notif.id} className={`${styles.notifItem} ${!notif.is_read ? styles.notifUnread : ''}`}>
                <div className={styles.notifHeader}>
                  <span className={styles.notifTitle}>{notif.title}</span>
                  <span className={styles.notifDate}>
                    {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className={styles.notifMessage}>{notif.message}</div>
                {notif.type && (
                  <span className={styles.notifType}>{notif.type}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
