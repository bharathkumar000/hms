import { createClient } from '@/utils/supabase/server';
import { TestTube, Activity, FileText, AlertTriangle, ArrowRight, ClipboardList, Archive } from 'lucide-react';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default async function LaboratoryDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch basic profile info
  let staffName = 'Laboratory Staff';
  if (user) {
    const { data: profile } = await supabase
      .from('lab_staff')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();
    
    if (profile) {
      staffName = `${profile.first_name} ${profile.last_name}`;
    } else if (user.role === 'laboratory' || user.email?.includes('lab')) {
      staffName = 'Demo Lab Tech';
    }
  }

  // Fetch today's data
  const today = new Date().toISOString().split('T')[0];

  const [ordersRes, samplesRes, processingRes, reportsRes, urgentRes] = await Promise.all([
    supabase.from('lab_orders').select('id', { count: 'exact' }).eq('status', 'Pending'),
    supabase.from('lab_samples').select('id', { count: 'exact' }).eq('status', 'Collected').gte('created_at', `${today}T00:00:00Z`),
    supabase.from('lab_samples').select('id', { count: 'exact' }).eq('status', 'Processing'),
    supabase.from('lab_reports').select('id', { count: 'exact' }).eq('status', 'Approved'), // Reports ready to be released
    supabase.from('lab_orders').select('id', { count: 'exact' }).eq('urgent', true).in('status', ['Pending', 'Sample Requested', 'Sample Collected', 'Processing'])
  ]);

  const { data: recentOrders } = await supabase
    .from('lab_orders')
    .select('*, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {staffName}</h1>
          <p className={styles.subtitle}>Here is your laboratory overview for today.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperWarning}>
              <ClipboardList size={24} />
            </div>
            <h2 className={styles.cardTitle}>Pending Requests</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#a16207' }}>{ordersRes.count || 0}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <TestTube size={24} />
            </div>
            <h2 className={styles.cardTitle}>Samples Collected Today</h2>
          </div>
          <div className={styles.statValue}>{samplesRes.count || 0}</div>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
              <Activity size={24} />
            </div>
            <h2 className={styles.cardTitle}>Tests In Progress</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#4f46e5' }}>{processingRes.count || 0}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <FileText size={24} />
            </div>
            <h2 className={styles.cardTitle}>Reports Ready</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>{reportsRes.count || 0}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperDanger}>
              <AlertTriangle size={24} />
            </div>
            <h2 className={styles.cardTitle}>Urgent Tests</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#dc2626' }}>{urgentRes.count || 0}</div>
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Recent Activity */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Recent Test Requests
          </h2>
          
          <div className={styles.list}>
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((o: any) => (
                <div key={o.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{o.profiles?.first_name} {o.profiles?.last_name}</div>
                    <div className={styles.itemSub}>{o.test_category} | {new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    {o.urgent && <div style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.2rem' }}>URGENT</div>}
                  </div>
                  <div>
                    <span className={`${styles.status} ${o.status === 'Completed' || o.status === 'Released' ? styles.statusCompleted : o.status === 'Processing' ? styles.statusProcessing : styles.statusPending}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No recent lab activity.</p>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Quick Actions
          </h2>
          <div className={styles.list}>
            <Link href="/laboratory/requests" className={styles.listItem} style={{ cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                <ClipboardList size={18} /> View Pending Requests
              </div>
              <ArrowRight size={16} color="var(--color-text-secondary)" />
            </Link>
            <Link href="/laboratory/samples" className={styles.listItem} style={{ cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                <TestTube size={18} /> Manage Samples
              </div>
              <ArrowRight size={16} color="var(--color-text-secondary)" />
            </Link>
            <Link href="/laboratory/processing" className={styles.listItem} style={{ cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                <Activity size={18} /> Process Tests
              </div>
              <ArrowRight size={16} color="var(--color-text-secondary)" />
            </Link>
            <Link href="/laboratory/reports" className={styles.listItem} style={{ cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                <FileText size={18} /> Review Reports
              </div>
              <ArrowRight size={16} color="var(--color-text-secondary)" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
