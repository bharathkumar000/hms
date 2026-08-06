import { redirect } from 'next/navigation';
import { Calendar, Activity, Bell, FileText, Bed, CreditCard, Stethoscope, ArrowRight, Utensils, FlaskConical } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import styles from './dashboard.module.css';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Parallel Data Fetching
  const [
    { data: profile },
    { data: appointments },
    { data: notifications },
    { data: admission },
    { data: pendingBills },
    { data: labReport }
  ] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
    supabase.from('appointments').select('*, doctors(first_name, last_name, specialization)').eq('patient_id', user.id).eq('status', 'Upcoming').order('appointment_date', { ascending: true }).limit(3),
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('admissions').select(`*, beds(bed_number, rooms(room_number, wards(name))), doctors(first_name, last_name)`).eq('patient_id', user.id).eq('status', 'Admitted').order('admission_date', { ascending: false }).limit(1).single(),
    supabase.from('bills').select('total_amount, amount_paid').eq('patient_id', user.id).eq('status', 'Pending'),
    supabase.from('lab_orders').select('test_category, status, completion_time, report_url').eq('patient_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  ]);

  const totalPending = pendingBills?.reduce((sum, bill) => sum + (Number(bill.total_amount) - Number(bill.amount_paid)), 0) || 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Welcome back, {profile?.first_name || 'Patient'}
          </h1>
          <p className={styles.subtitle}>Here is your comprehensive health overview.</p>
        </div>
      </div>

      {/* Primary Highlights: Admission & Bills */}
      <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        
        {/* Admission Card */}
        <div className={styles.card} style={admission ? { borderLeft: '4px solid var(--color-primary)' } : {}}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Bed size={24} />
            </div>
            <h2 className={styles.cardTitle}>Admission Status</h2>
          </div>
          <div className={styles.cardContent}>
            {admission ? (
              <div className={styles.list}>
                <div className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>Ward & Room</div>
                    <div className={styles.itemSub}>{admission.beds?.rooms?.wards?.name} - Room {admission.beds?.rooms?.room_number}, Bed {admission.beds?.bed_number}</div>
                  </div>
                </div>
                <div className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>Assigned Doctor</div>
                    <div className={styles.itemSub}>Dr. {admission.doctors?.first_name} {admission.doctors?.last_name}</div>
                  </div>
                </div>
                <Link href="/patient/admission" className={styles.itemSub} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1rem', color: 'var(--color-primary)' }}>
                  View Full Admission Details <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div style={{ padding: '1rem 0' }}>
                <p>You are not currently admitted to the hospital.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Summary Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ background: '#fffbeb', color: '#f59e0b' }}>
              <CreditCard size={24} />
            </div>
            <h2 className={styles.cardTitle}>Financial & Quick Actions</h2>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.list}>
              <div className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>Pending Bills</div>
                  <div className={styles.itemSub} style={{ fontSize: '1.2rem', fontWeight: 600, color: totalPending > 0 ? '#ef4444' : '#10b981', marginTop: '0.5rem' }}>
                    ₹{totalPending.toFixed(2)}
                  </div>
                </div>
                <Link href="/patient/billing" className={styles.status} style={{ background: 'var(--color-light)', color: 'var(--color-primary)', textDecoration: 'none' }}>Pay Now</Link>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Link href="/patient/canteen" style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                  <Utensils size={18} /> Order Food
                </Link>
                <Link href="/patient/appointments?action=book" style={{ flex: 1, padding: '0.75rem', background: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 500 }}>
                  <Calendar size={18} /> Book Appointment
                </Link>
              </div>
            </div>
          </div>
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

        {/* Laboratory Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ background: '#f3e8ff', color: '#a855f7' }}>
              <FlaskConical size={24} />
            </div>
            <h2 className={styles.cardTitle}>Latest Lab Report</h2>
          </div>
          <div className={styles.cardContent}>
            {labReport ? (
              <div className={styles.list}>
                <div className={styles.listItem} style={{ border: 'none' }}>
                  <div>
                    <div className={styles.itemMain}>{labReport.test_category}</div>
                    <div className={styles.itemSub}>Status: {labReport.status}</div>
                    {labReport.completion_time && (
                      <div className={styles.itemSub}>Completed: {new Date(labReport.completion_time).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p>No recent laboratory tests found.</p>
            )}
            <Link href="/patient/laboratory" className={styles.itemSub} style={{ display: 'block', marginTop: '1rem', color: 'var(--color-primary)' }}>
              View all laboratory reports &rarr;
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
