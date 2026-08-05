import { createClient } from '@/utils/supabase/server';
import { ClipboardList, AlertTriangle, Pill, IndianRupee } from 'lucide-react';
import styles from './dashboard.module.css';

export default async function PharmacyDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let pharmacistName = 'Pharmacist';
  if (user) {
    const { data: profile } = await supabase
      .from('pharmacists')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();
    
    if (profile) {
      pharmacistName = `${profile.first_name} ${profile.last_name}`;
    } else if (user.email?.includes('pharm')) {
      pharmacistName = 'Demo Pharmacist';
    }
  }

  // Pending Prescriptions
  const { count: pendingCount } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true })
    .eq('dispense_status', 'Pending');

  // Low Stock
  // Join medicines and medicine_batches to find low stock. 
  // Simplified query for dashboard:
  const { data: medicines } = await supabase.from('medicines').select('id, name, minimum_stock_level');
  const { data: batches } = await supabase.from('medicine_batches').select('medicine_id, quantity, expiry_date');
  
  let lowStockCount = 0;
  let expiringCount = 0;
  
  if (medicines && batches) {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const stockMap = new Map();
    batches.forEach(b => {
      stockMap.set(b.medicine_id, (stockMap.get(b.medicine_id) || 0) + b.quantity);
      
      const expiry = new Date(b.expiry_date);
      if (expiry <= thirtyDaysFromNow) {
        expiringCount++;
      }
    });

    medicines.forEach(m => {
      const currentStock = stockMap.get(m.id) || 0;
      if (currentStock <= m.minimum_stock_level) {
        lowStockCount++;
      }
    });
  }

  // Today's Sales
  const today = new Date().toISOString().split('T')[0];
  const { data: todayBills } = await supabase
    .from('bills')
    .select('amount')
    .eq('bill_type', 'Pharmacy')
    .gte('created_at', `${today}T00:00:00Z`);

  const todaysRevenue = todayBills?.reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;

  // Recent Prescriptions
  const { data: recentPrescriptions } = await supabase
    .from('prescriptions')
    .select('*, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {pharmacistName}</h1>
          <p className={styles.subtitle}>Here is your pharmacy overview for today.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <ClipboardList size={24} />
            </div>
            <h2 className={styles.cardTitle}>Pending Prescriptions</h2>
          </div>
          <div className={styles.statValue}>{pendingCount || 0}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperWarning}>
              <AlertTriangle size={24} />
            </div>
            <h2 className={styles.cardTitle}>Low Stock Items</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#a16207' }}>{lowStockCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperDanger}>
              <Pill size={24} />
            </div>
            <h2 className={styles.cardTitle}>Expiring Batches (30d)</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#dc2626' }}>{expiringCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <IndianRupee size={24} />
            </div>
            <h2 className={styles.cardTitle}>Today's Sales</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>
            ₹{todaysRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Recent Prescriptions */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Recent Prescriptions
          </h2>
          
          <div className={styles.list}>
            {recentPrescriptions && recentPrescriptions.length > 0 ? (
              recentPrescriptions.map((p: any) => (
                <div key={p.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{p.profiles?.first_name} {p.profiles?.last_name}</div>
                    <div className={styles.itemSub}>{p.medicine_name} - {p.dosage}</div>
                    <div className={styles.itemSub} style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>
                      {new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <div>
                    <span className={`${styles.status} ${p.dispense_status === 'Completed' ? styles.statusCompleted : styles.statusPending}`}>
                      {p.dispense_status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No recent prescriptions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
