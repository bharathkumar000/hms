import { createClient } from '@/utils/supabase/server';
import { IndianRupee, Users, Stethoscope, FlaskConical, Pill, BarChart3 } from 'lucide-react';
import styles from './analytics.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminAnalytics() {
  const supabase = await createClient();

  // Fetch real data
  const { data: bills } = await supabase.from('bills').select('amount, created_at, status');
  const { data: appointments } = await supabase.from('appointments').select('status, created_at');
  
  const { count: totalPatients } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: totalPrescriptions } = await supabase.from('prescriptions').select('*', { count: 'exact', head: true });
  const { count: totalLabOrders } = await supabase.from('lab_orders').select('*', { count: 'exact', head: true });
  const { count: pendingLabOrders } = await supabase.from('lab_orders').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'Processing']);

  // Calculate actual revenue
  const totalRevenue = bills?.filter(b => b.status === 'Paid').reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;
  const pendingRevenue = bills?.filter(b => b.status === 'Pending').reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;

  // Calculate appointment stats
  const totalAppointments = appointments?.length || 0;
  const completedAppointments = appointments?.filter(a => a.status === 'Completed').length || 0;
  const cancelledAppointments = appointments?.filter(a => a.status === 'Cancelled').length || 0;
  const upcomingAppointments = appointments?.filter(a => a.status === 'Upcoming').length || 0;
  const completionRate = totalAppointments ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

  // Daily Revenue (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const revenueByDay: Record<string, number> = {};
  last7Days.forEach(day => revenueByDay[day] = 0);

  bills?.filter(b => b.status === 'Paid').forEach(bill => {
    const day = bill.created_at.split('T')[0];
    if (revenueByDay[day] !== undefined) {
      revenueByDay[day] += Number(bill.amount);
    }
  });

  const maxDailyRevenue = Math.max(...Object.values(revenueByDay), 1); // Avoid division by zero

  const hasAnalyticsData = totalAppointments > 0 || totalRevenue > 0 || totalPatients! > 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Hospital Analytics</h1>
          <p className={styles.details}>Comprehensive reports and analytics across all departments.</p>
        </div>
      </header>

      {!hasAnalyticsData ? (
        <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--color-card-bg)', borderRadius: '16px', border: '1px solid var(--color-border)', marginTop: '2rem' }}>
          <BarChart3 size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No analytics available yet.</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Data will appear here once the hospital begins recording patients, appointments, and bills.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {/* Revenue Reports */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IndianRupee size={20} /> Revenue Overview
              </h2>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Total Realized Revenue</span>
                <span className={styles.statValue} style={{ color: '#166534' }}>₹{totalRevenue.toLocaleString()}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Pending Revenue</span>
                <span className={styles.statValue} style={{ color: '#a16207' }}>₹{pendingRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Doctor Performance */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} /> Consultation Metrics
              </h2>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Total Appointments</span>
                <span className={styles.statValue}>{totalAppointments}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Completed Consultations</span>
                <span className={styles.statValue}>{completedAppointments}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Completion Rate</span>
                <span className={styles.statValue}>{completionRate}%</span>
              </div>
            </div>

            {/* Pharmacy & Lab */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FlaskConical size={20} /> <Pill size={20} /> Pharmacy & Lab
              </h2>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Prescriptions Issued</span>
                <span className={styles.statValue}>{totalPrescriptions || 0}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Total Lab Tests</span>
                <span className={styles.statValue}>{totalLabOrders || 0}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Pending Lab Tests</span>
                <span className={styles.statValue} style={{ color: '#a16207' }}>{pendingLabOrders || 0}</span>
              </div>
            </div>
          </div>

          <div className={styles.grid} style={{ marginTop: '2rem' }}>
            {/* Real 7-Day Revenue Chart (CSS only) */}
            <div className={styles.card} style={{ gridColumn: 'span 2' }}>
              <h2 className={styles.cardTitle}>7-Day Revenue Trend</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '1rem', marginTop: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                {last7Days.map(day => {
                  const val = revenueByDay[day];
                  const heightPercentage = Math.max((val / maxDailyRevenue) * 100, 5);
                  const displayDate = day.split('-').slice(1).join('/'); // MM/DD
                  return (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        ₹{val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}
                      </div>
                      <div style={{ width: '100%', maxWidth: '40px', backgroundColor: 'var(--color-primary)', height: `${heightPercentage}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>{displayDate}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Appointment Status Distribution (CSS only) */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Appointment Distribution</h2>
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Completed</span>
                  <span style={{ fontWeight: 'bold' }}>{completedAppointments}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', marginBottom: '1.5rem' }}>
                  <div style={{ width: `${totalAppointments ? (completedAppointments/totalAppointments)*100 : 0}%`, height: '100%', backgroundColor: '#166534', borderRadius: '4px' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Upcoming</span>
                  <span style={{ fontWeight: 'bold' }}>{upcomingAppointments}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', marginBottom: '1.5rem' }}>
                  <div style={{ width: `${totalAppointments ? (upcomingAppointments/totalAppointments)*100 : 0}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Cancelled</span>
                  <span style={{ fontWeight: 'bold' }}>{cancelledAppointments}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', marginBottom: '1.5rem' }}>
                  <div style={{ width: `${totalAppointments ? (cancelledAppointments/totalAppointments)*100 : 0}%`, height: '100%', backgroundColor: '#dc2626', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
