import { createClient } from '@/utils/supabase/server';
import { ClipboardList, AlertTriangle, Pill, IndianRupee, Package, Clock, Activity, FileText } from 'lucide-react';
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
    } else if (user?.email?.includes('pharm')) {
      pharmacistName = 'Demo Pharmacist';
    }
  }

  // Today's date info
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(todayDate.getDate() + 30);

  // 1. Pending Prescriptions (also Pending Dispensing)
  const { count: pendingCount } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true })
    .in('dispense_status', ['Pending', 'Partially Dispensed']);

  // 2. Prescriptions Dispensed Today
  const { count: dispensedToday } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true })
    .eq('dispense_status', 'Completed')
    .gte('dispense_date', `${today}T00:00:00Z`);

  // 3. Inventory Stats (Total Stock, Low Stock, Expiring)
  const { data: medicines } = await supabase.from('medicines').select('id, minimum_stock_level');
  const { data: batches } = await supabase.from('medicine_batches').select('medicine_id, quantity, expiry_date');
  
  let totalStockCount = 0;
  let lowStockCount = 0;
  let expiringCount = 0;
  
  if (medicines && batches) {
    const stockMap = new Map();
    batches.forEach(b => {
      stockMap.set(b.medicine_id, (stockMap.get(b.medicine_id) || 0) + b.quantity);
      totalStockCount += b.quantity;
      
      const expiry = new Date(b.expiry_date);
      if (expiry <= thirtyDaysFromNow && b.quantity > 0) {
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

  // 4. Sales & Payments
  const { data: todayBills } = await supabase
    .from('bills')
    .select('amount, status')
    .eq('bill_type', 'Pharmacy')
    .gte('created_at', `${today}T00:00:00Z`);

  const todaysRevenue = todayBills?.reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;
  const pendingPayments = todayBills?.filter(b => b.status === 'Pending').length || 0;

  // 5. Recent Orders (Purchase Orders)
  const { data: recentOrders } = await supabase
    .from('purchase_orders')
    .select('*, suppliers(name)')
    .order('created_at', { ascending: false })
    .limit(3);

  // 6. Recent Prescriptions
  const { data: recentPrescriptions } = await supabase
    .from('prescriptions')
    .select('*, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {pharmacistName}</h1>
          <p className={styles.subtitle}>Here is your pharmacy overview for today.</p>
        </div>
      </header>

      {/* Main Stats Row 1 */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
              <Package size={24} />
            </div>
            <h2 className={styles.cardTitle}>Total Stock Items</h2>
          </div>
          <div className={styles.statValue}>{totalStockCount.toLocaleString()}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <ClipboardList size={24} />
            </div>
            <h2 className={styles.cardTitle}>Pending Prescriptions</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#d97706' }}>{pendingCount || 0}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <Activity size={24} />
            </div>
            <h2 className={styles.cardTitle}>Dispensed Today</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#16a34a' }}>{dispensedToday || 0}</div>
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

      {/* Secondary Stats Row 2 */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperWarning}>
              <AlertTriangle size={24} />
            </div>
            <h2 className={styles.cardTitle}>Low Stock Medicines</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#a16207' }}>{lowStockCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperDanger}>
              <Clock size={24} />
            </div>
            <h2 className={styles.cardTitle}>Expiring (30 Days)</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#dc2626' }}>{expiringCount}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
              <FileText size={24} />
            </div>
            <h2 className={styles.cardTitle}>Pending Payments</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#b91c1c' }}>{pendingPayments}</div>
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
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/pharmacy/prescriptions" style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>View All Prescriptions →</a>
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Recent Purchase Orders
          </h2>
          
          <div className={styles.list}>
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((o: any) => (
                <div key={o.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{o.suppliers?.name}</div>
                    <div className={styles.itemSub}>₹{o.total_amount} | Date: {new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className={`${styles.status} ${o.status === 'Received' ? styles.statusCompleted : styles.statusPending}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.itemSub}>No recent purchase orders.</p>
            )}
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/pharmacy/purchases" style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>Manage Purchases →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
