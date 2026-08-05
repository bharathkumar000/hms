import { createClient } from '@/utils/supabase/server';
import { Users, Calendar, Clock, CreditCard } from 'lucide-react';
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

  const [appointments, queue, bills, profiles] = await Promise.all([
    supabase.from('appointments').select('*').eq('appointment_date', today),
    supabase.from('patient_queue').select('*, profiles(first_name, last_name)').gte('check_in_time', `${today}T00:00:00Z`).order('check_in_time', { ascending: false }).limit(5),
    supabase.from('bills').select('amount').gte('created_at', `${today}T00:00:00Z`),
    supabase.from('profiles').select('id').gte('created_at', `${today}T00:00:00Z`)
  ]);

  const appointmentsCount = appointments.data?.length || 0;
  const waitingCount = queue.data?.filter(q => q.status === 'Waiting').length || 0;
  const newPatientsCount = profiles.data?.length || 0;
  const billingTotal = bills.data?.reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {receptionName}</h1>
          <p className={styles.subtitle}>Here is today's front-desk overview.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Calendar size={24} />
            </div>
            <h2 className={styles.cardTitle}>Today's Appointments</h2>
          </div>
          <div className={styles.statValue}>{appointmentsCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Clock size={24} />
            </div>
            <h2 className={styles.cardTitle}>Waiting in Queue</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#a16207' }}>{waitingCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <Users size={24} />
            </div>
            <h2 className={styles.cardTitle}>New Registrations</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>{newPatientsCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <CreditCard size={24} />
            </div>
            <h2 className={styles.cardTitle}>Today's Billing</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>${billingTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className={styles.grid}>
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
      </div>
    </div>
  );
}
