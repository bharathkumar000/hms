'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Receipt, 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  Activity,
  Calculator,
  BarChart3,
  Undo2
} from 'lucide-react';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function BillingDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    totalTransactions: 0
  });
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // 1. Fetch Today's Revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', today.toISOString());
      
      const todayRev = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // 2. Fetch Monthly Revenue
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', firstDayOfMonth.toISOString());
      
      const monthRev = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // 3. Fetch Pending Payments (Count of pending bills)
      const { count: pendingCount } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      // 4. Fetch Total Transactions
      const { count: totalTrans } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true });

      setMetrics({
        todayRevenue: todayRev,
        monthlyRevenue: monthRev,
        pendingPayments: pendingCount || 0,
        totalTransactions: totalTrans || 0
      });

      // Fetch Recent Bills
      const { data: bills } = await supabase
        .from('bills')
        .select(`
          id,
          total_amount,
          status,
          bill_type,
          created_at,
          profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (bills) setRecentBills(bills);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid': return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Paid</span>;
      case 'Pending': return <span className={`${styles.badge} ${styles.badgeWarning}`}>Pending</span>;
      case 'Partially Paid': return <span className={`${styles.badge} ${styles.badgePrimary}`}>Partially Paid</span>;
      default: return <span className={styles.badge}>{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Finance Dashboard</h1>
          <p className={styles.details}>Welcome to the Billing & Finance Portal.</p>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>
            <IndianRupee size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Today's Revenue</h3>
            <p className={styles.metricValue}>₹{metrics.todayRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Monthly Revenue</h3>
            <p className={styles.metricValue}>₹{metrics.monthlyRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Pending Bills</h3>
            <p className={styles.metricValue}>{metrics.pendingPayments}</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#f3e8ff', color: '#a855f7' }}>
            <Activity size={24} />
          </div>
          <div className={styles.metricInfo}>
            <h3>Total Transactions</h3>
            <p className={styles.metricValue}>{metrics.totalTransactions}</p>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Quick Actions */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Quick Actions</h2>
          <div className={styles.actionGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <Link href="/billing/generate" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: 'var(--color-background)' }} className={styles.quickActionHover}>
                <Calculator size={32} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ color: 'var(--color-text-primary)' }}>Create Bill</h4>
              </div>
            </Link>
            
            <Link href="/billing/reports" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: 'var(--color-background)' }} className={styles.quickActionHover}>
                <BarChart3 size={32} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ color: 'var(--color-text-primary)' }}>View Reports</h4>
              </div>
            </Link>
            
            <Link href="/billing/refunds" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: 'var(--color-background)' }} className={styles.quickActionHover}>
                <Undo2 size={32} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ color: 'var(--color-text-primary)' }}>Process Refunds</h4>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Bills */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>Recent Bills</h2>
            <Link href="/billing/invoices" style={{ color: 'var(--color-primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>
              View All
            </Link>
          </div>
          
          {loading ? (
            <p>Loading recent bills...</p>
          ) : recentBills.length > 0 ? (
            <div className={styles.list}>
              {recentBills.map((bill) => (
                <div key={bill.id} className={styles.listItem}>
                  <div className={styles.itemIcon} style={{ background: '#f8fafc', color: '#64748b' }}>
                    <Receipt size={20} />
                  </div>
                  <div className={styles.itemContent}>
                    <h4>{bill.profiles?.first_name} {bill.profiles?.last_name}</h4>
                    <p>{bill.bill_type} - {new Date(bill.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                      ₹{Number(bill.total_amount).toFixed(2)}
                    </div>
                    {getStatusBadge(bill.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              No recent bills found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
