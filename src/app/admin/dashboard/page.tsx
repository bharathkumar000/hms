import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { 
  Users, 
  Stethoscope, 
  IndianRupee, 
  Activity,
  UserPlus,
  Building2,
  Calendar
} from 'lucide-react';
import styles from './dashboard.module.css';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let adminName = 'Administrator';
  if (user) {
    const { data: profile } = await supabase
      .from('admins')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();
    
    if (profile) {
      adminName = `${profile.first_name} ${profile.last_name}`;
    } else if (user.email?.includes('admin')) {
      adminName = 'Demo Admin';
    }
  }

  // --- Analytics Data Fetching ---
  
  // Total Patients
  const { count: patientsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Total Doctors
  const { count: doctorsCount } = await supabase
    .from('doctors')
    .select('*', { count: 'exact', head: true });

  // Today's Appointments (Admissions/Visits)
  const today = new Date().toISOString().split('T')[0];
  const { count: todayAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('appointment_date', today);

  // Today's Revenue
  const { data: todayBills } = await supabase
    .from('bills')
    .select('amount')
    .gte('created_at', `${today}T00:00:00Z`);

  const todaysRevenue = todayBills?.reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;

  // Active Queue Status
  const { count: waitingCount } = await supabase
    .from('patient_queue')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Waiting', 'In Consultation']);

  // Recent Audit Logs
  const { data: recentLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {adminName}</h1>
          <p className={styles.subtitle}>System Overview & Live Hospital Analytics</p>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Users size={24} />
            </div>
            <h2 className={styles.cardTitle}>Total Patients</h2>
          </div>
          <div className={styles.statValue}>{patientsCount || 0}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Stethoscope size={24} />
            </div>
            <h2 className={styles.cardTitle}>Total Doctors</h2>
          </div>
          <div className={styles.statValue}>{doctorsCount || 0}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperWarning}>
              <Activity size={24} />
            </div>
            <h2 className={styles.cardTitle}>Live Queue</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#a16207' }}>{waitingCount || 0} waiting</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <IndianRupee size={24} />
            </div>
            <h2 className={styles.cardTitle}>Today's Revenue</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>
            ₹{todaysRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Quick Actions */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.quickActions}>
            <Link href="/admin/users?tab=doctors" className={styles.actionBtn}>
              <UserPlus size={18} /> Add Doctor
            </Link>
            <Link href="/admin/departments" className={styles.actionBtn}>
              <Building2 size={18} /> Manage Departments
            </Link>
            <Link href="/admin/appointments" className={styles.actionBtn}>
              <Calendar size={18} /> View Schedule
            </Link>
          </div>
        </div>

        {/* Recent System Activity */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <div className={styles.list}>
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{log.action}</div>
                    <div className={styles.itemSub}>{log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''} - {log.details}</div>
                  </div>
                  <div className={styles.itemSub} style={{ fontSize: '0.75rem' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No recent activity logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
