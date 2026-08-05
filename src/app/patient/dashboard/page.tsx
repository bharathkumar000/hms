import { redirect } from 'next/navigation';
import { Calendar, Activity, Bell } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import styles from './dashboard.module.css';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  // Fetch upcoming appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, doctors(first_name, last_name, specialization)')
    .eq('patient_id', user.id)
    .eq('status', 'Upcoming')
    .order('appointment_date', { ascending: true })
    .limit(3);

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Welcome back, {profile?.first_name || 'Patient'}
          </h1>
          <p className={styles.subtitle}>Here is your health overview for today.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Appointments Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Calendar size={24} />
            </div>
            <h2 className={styles.cardTitle}>Upcoming Appointments</h2>
          </div>
          <div className={styles.cardContent}>
            {appointments && appointments.length > 0 ? (
              <div className={styles.list}>
                {appointments.map((apt) => (
                  <div key={apt.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemMain}>Dr. {apt.doctors?.first_name} {apt.doctors?.last_name}</div>
                      <div className={styles.itemSub}>{apt.doctors?.specialization}</div>
                      <div className={styles.itemSub}>{new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}</div>
                    </div>
                    <span className={`${styles.status} ${styles.statusUpcoming}`}>Upcoming</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>You have no upcoming appointments.</p>
            )}
            <Link href="/patient/appointments" className={styles.itemSub} style={{ display: 'block', marginTop: '1rem', color: 'var(--color-primary)' }}>
              View all appointments &rarr;
            </Link>
          </div>
        </div>

        {/* Health Summary Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Activity size={24} />
            </div>
            <h2 className={styles.cardTitle}>Health Summary</h2>
          </div>
          <div className={styles.cardContent}>
            <p>Your recent lab results are normal. Keep up the good work!</p>
            <Link href="/patient/records" className={styles.itemSub} style={{ display: 'block', marginTop: '1rem', color: 'var(--color-primary)' }}>
              View medical records &rarr;
            </Link>
          </div>
        </div>

        {/* Notifications Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Bell size={24} />
            </div>
            <h2 className={styles.cardTitle}>Recent Notifications</h2>
          </div>
          <div className={styles.cardContent}>
            {notifications && notifications.length > 0 ? (
              <div className={styles.list}>
                {notifications.map((notif) => (
                  <div key={notif.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemMain}>{notif.title}</div>
                      <div className={styles.itemSub}>{notif.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No new notifications.</p>
            )}
            <Link href="/patient/notifications" className={styles.itemSub} style={{ display: 'block', marginTop: '1rem', color: 'var(--color-primary)' }}>
              View all notifications &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
