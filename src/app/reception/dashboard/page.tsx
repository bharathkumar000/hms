import { createClient } from '@/utils/supabase/server';
import { Users, Calendar, Clock, ClipboardList, ArrowRightCircle, PlusCircle, CreditCard, UserPlus, Activity, LogOut } from 'lucide-react';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default async function ReceptionDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch basic profile info
  let receptionName = 'Receptionist';
  if (user) {
    const { data: profile } = await supabase
      .from('reception_staff')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();
    
    if (profile) {
      receptionName = `${profile.first_name} ${profile.last_name}`;
    } else if (user.role === 'reception' || user.email?.includes('reception')) {
      receptionName = 'Demo Reception';
    }
  }

  // Fetch today's data
  const today = new Date().toISOString().split('T')[0];

  const [appointments, queue, bills, profiles, admissionsData, notifications] = await Promise.all([
    supabase.from('appointments').select('*').eq('appointment_date', today),
    supabase.from('patient_queue').select('*, profiles(first_name, last_name)').gte('check_in_time', `${today}T00:00:00Z`).order('check_in_time', { ascending: false }).limit(5),
    supabase.from('bills').select('amount').gte('created_at', `${today}T00:00:00Z`),
    supabase.from('profiles').select('id').gte('created_at', `${today}T00:00:00Z`),
    supabase.from('admissions').select('status, admission_date, discharge_date').or(`admission_date.gte.${today}T00:00:00Z,discharge_date.gte.${today}T00:00:00Z`),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5)
  ]);

  const appointmentsCount = appointments.data?.length || 0;
  const waitingCount = queue.data?.filter(q => q.status === 'Waiting').length || 0;
  const newPatientsCount = profiles.data?.length || 0;
  const walkInCount = queue.data?.filter(q => q.appointment_id === null).length || 0;
  
  const admissionsToday = admissionsData.data?.filter(a => a.admission_date && a.admission_date.startsWith(today)).length || 0;
  const dischargesToday = admissionsData.data?.filter(a => a.discharge_date && a.discharge_date.startsWith(today)).length || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {receptionName}</h1>
          <p className={styles.subtitle}>Here is today's front-desk overview.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Calendar size={24} />
            </div>
            <h2 className={styles.cardTitle}>Appointments</h2>
          </div>
          <div className={styles.statValue}>{appointmentsCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Clock size={24} />
            </div>
            <h2 className={styles.cardTitle}>Patients Waiting</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#a16207' }}>{waitingCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <UserPlus size={24} />
            </div>
            <h2 className={styles.cardTitle}>New Registrations</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>{newPatientsCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Users size={24} />
            </div>
            <h2 className={styles.cardTitle}>Walk-ins</h2>
          </div>
          <div className={styles.statValue}>{walkInCount}</div>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <ClipboardList size={24} />
            </div>
            <h2 className={styles.cardTitle}>Admissions Today</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>{admissionsToday}</div>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Activity size={24} />
            </div>
            <h2 className={styles.cardTitle}>Discharges Today</h2>
          </div>
          <div className={styles.statValue}>{dischargesToday}</div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Quick Actions */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/reception/registration" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--color-text)' }}>
              <UserPlus size={20} color="var(--color-primary)" />
              <span style={{ fontWeight: '500' }}>Register New Patient</span>
            </Link>
            <Link href="/reception/appointments" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--color-text)' }}>
              <Calendar size={20} color="var(--color-primary)" />
              <span style={{ fontWeight: '500' }}>Book Appointment</span>
            </Link>
            <Link href="/reception/admissions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--color-text)' }}>
              <ClipboardList size={20} color="var(--color-primary)" />
              <span style={{ fontWeight: '500' }}>Admit Patient</span>
            </Link>
            <Link href="/reception/billing" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--color-text)' }}>
              <CreditCard size={20} color="var(--color-primary)" />
              <span style={{ fontWeight: '500' }}>Process Billing</span>
            </Link>
          </div>
        </div>

        {/* Live Queue Overview */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Recent Check-ins
          </h2>
          
          <div className={styles.list}>
            {queue.data && queue.data.length > 0 ? (
              queue.data.map((q: any) => (
                <div key={q.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{q.profiles?.first_name} {q.profiles?.last_name}</div>
                    <div className={styles.itemSub}>Token: {q.token_number} | Time: {new Date(q.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                  <div>
                    <span className={`${styles.status} ${q.status === 'Completed' ? styles.statusCompleted : q.status === 'Waiting' ? styles.statusWaiting : styles.statusInConsultation}`}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No patients checked in yet.</p>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Recent Notifications
          </h2>
          <div className={styles.list}>
            {notifications.data && notifications.data.length > 0 ? (
              notifications.data.map((n: any) => (
                <div key={n.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{n.title}</div>
                    <div className={styles.itemSub}>{n.message}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No new notifications.</p>
            )}
            <Link href="/reception/notifications" style={{ display: 'block', marginTop: '1rem', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '500' }}>
              View all notifications <ArrowRightCircle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
