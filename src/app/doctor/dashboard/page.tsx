import { createClient } from '@/utils/supabase/server';
import { Calendar, AlertCircle, Users, Activity, Bed, Bell, FilePlus, Microscope, Coffee } from 'lucide-react';
import Link from 'next/link';
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

  // Fetch admitted patients assigned to this doctor
  const { data: admissions } = await supabase
    .from('admissions')
    .select('*, profiles(first_name, last_name), beds(bed_number, rooms(room_number, wards(name)))')
    .eq('status', 'Admitted')
    // In a real app we'd filter by doctor.eq('assigned_doctor_id', profile.id)
    .limit(3);

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(3);

  // Stats
  const appointmentsCount = appointments?.length || 0;
  const emergenciesCount = emergencies?.length || 0;
  const admissionsCount = admissions?.length || 0;
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

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <Bed size={24} />
            </div>
            <h2 className={styles.cardTitle}>Admitted Patients</h2>
          </div>
          <p className={styles.cardContent}>{admissionsCount} patients currently admitted.</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '1rem', marginBottom: '-1rem' }}>Quick Actions</h2>
      <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Link href="/doctor/prescriptions" className={styles.quickActionCard}>
          <FilePlus size={24} />
          <span>New Prescription</span>
        </Link>
        <Link href="/doctor/lab" className={styles.quickActionCard}>
          <Microscope size={24} />
          <span>Order Lab Test</span>
        </Link>
        <Link href="/doctor/admissions" className={styles.quickActionCard}>
          <Bed size={24} />
          <span>Manage Admissions</span>
        </Link>
        <Link href="/doctor/canteen" className={styles.quickActionCard}>
          <Coffee size={24} />
          <span>Order Food</span>
        </Link>
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

        {/* Notifications */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ background: '#fef3c7', color: '#d97706' }}>
              <Bell size={24} />
            </div>
            <h2 className={styles.cardTitle}>Notifications</h2>
          </div>
          
          <div className={styles.list}>
            {notifications && notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div key={notif.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{notif.title}</div>
                    <div className={styles.itemSub}>{notif.message}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.status} style={{ background: '#f3f4f6', color: '#4b5563' }}>New</span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No new notifications.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
