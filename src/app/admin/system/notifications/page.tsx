'use client';

import { ShieldCheck, Bell } from 'lucide-react';
import styles from '../../users/users.module.css';

export default function AdminNotifications() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Notifications</h1>
          <p className={styles.details}>Manage automated alerts and global notifications.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: 'var(--color-text-secondary)' }}>
          <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>No active notifications</h2>
          <p style={{ marginTop: '0.5rem' }}>The system is running smoothly. Alerts will appear here.</p>
        </div>
      </div>
    </div>
  );
}
