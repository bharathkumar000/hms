import { createClient } from '@/utils/supabase/server';
import { TestTube, Activity, FileText, AlertTriangle } from 'lucide-react';
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

  const { data: orders } = await supabase
    .from('lab_orders')
    .select('*, profiles(first_name, last_name)')
    .gte('created_at', `${today}T00:00:00Z`);

  const allOrders = orders || [];
  const pendingCount = allOrders.filter((o: any) => o.status === 'Pending' || o.status === 'Sample Requested').length;
  const samplesCollected = allOrders.filter((o: any) => o.status === 'Sample Collected' || o.status === 'Sample Received').length;
  const reportsReady = allOrders.filter((o: any) => o.status === 'Report Ready').length;
  const urgentCount = allOrders.filter((o: any) => o.urgent === true).length;
  
  const recentOrders = allOrders.slice(0, 5);

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
              <TestTube size={24} />
            </div>
            <h2 className={styles.cardTitle}>Pending Tests</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#a16207' }}>{pendingCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Activity size={24} />
            </div>
            <h2 className={styles.cardTitle}>Samples Collected</h2>
          </div>
          <div className={styles.statValue}>{samplesCollected}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <FileText size={24} />
            </div>
            <h2 className={styles.cardTitle}>Reports Ready</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>{reportsReady}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperDanger}>
              <AlertTriangle size={24} />
            </div>
            <h2 className={styles.cardTitle}>Urgent Cases</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#dc2626' }}>{urgentCount}</div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Recent Activity */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Recent Activity
          </h2>
          
          <div className={styles.list}>
            {recentOrders.length > 0 ? (
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
      </div>
    </div>
  );
}
