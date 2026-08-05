import { createClient } from '@/utils/supabase/server';
import { Calendar, AlertCircle, Users, Activity } from 'lucide-react';
import styles from './dashboard.module.css';

export default async function DoctorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch basic profile info (falling back to generic if not found)
  let doctorName = 'Doctor';
  if (user) {
    const { data: profile } = await supabase
      .from('doctors')
      .select('first_name, last_name, specialization')
      .eq('user_id', user.id)
      .single();
    
    if (profile) {
      doctorName = `Dr. ${profile.first_name} ${profile.last_name}`;
    } else if (user.role === 'doctor' || user.email?.includes('doctor')) {
      doctorName = 'Dr. Demo';
    }
  }

  // Fetch today's appointments
  const today = new Date().toISOString().split('T')[0];
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, profiles(first_name, last_name)')
    .eq('appointment_date', today)
    .order('appointment_time', { ascending: true })
    .limit(5);

  // Fetch emergency cases
  const { data: emergencies } = await supabase
    .from('emergency_cases')
    .select('*, profiles(first_name, last_name)')
    .eq('status', 'Active')
    .order('priority', { ascending: false }) // e.g. Critical first
    .limit(3);

  // Stats
  const appointmentsCount = appointments?.length || 0;
  const emergenciesCount = emergencies?.length || 0;
  const pendingConsultationsCount = appointments?.filter(a => a.status === 'Upcoming').length || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {doctorName}</h1>
          <p className={styles.subtitle}>Here's your schedule and updates for today.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Users size={24} />
            </div>
            <h2 className={styles.cardTitle}>Today's Patients</h2>
          </div>
          <p className={styles.cardContent}>{appointmentsCount} patients scheduled for today.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Activity size={24} />
            </div>
            <h2 className={styles.cardTitle}>Pending Consultations</h2>
          </div>
          <p className={styles.cardContent}>{pendingConsultationsCount} consultations pending.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperAlert}>
              <AlertCircle size={24} />
            </div>
            <h2 className={styles.cardTitle}>Emergency Cases</h2>
          </div>
          <p className={styles.cardContent}>{emergenciesCount} active emergency alerts.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Today's Schedule List */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Calendar size={24} />
            </div>
            <h2 className={styles.cardTitle}>Today's Schedule</h2>
          </div>
          
          <div className={styles.list}>
            {appointments && appointments.length > 0 ? (
              appointments.map((apt: any) => (
                <div key={apt.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{apt.profiles?.first_name} {apt.profiles?.last_name}</div>
                    <div className={styles.itemSub}>{apt.reason_for_visit || 'General Consultation'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.itemMain}>{apt.appointment_time}</div>
                    <span className={`${styles.status} ${apt.status === 'Completed' ? styles.statusCompleted : styles.statusUpcoming}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No appointments scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Emergencies List */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperAlert}>
              <AlertCircle size={24} />
            </div>
            <h2 className={styles.cardTitle}>Emergency Alerts</h2>
          </div>
          
          <div className={styles.list}>
            {emergencies && emergencies.length > 0 ? (
              emergencies.map((em: any) => (
                <div key={em.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{em.profiles?.first_name} {em.profiles?.last_name}</div>
                    <div className={styles.itemSub}>{em.department} - {em.notes}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`${styles.status} ${styles.statusCritical}`}>
                      {em.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No active emergency cases.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
