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
  Undo2,
  PieChart
} from 'lucide-react';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function BillingDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    totalTransactions: 0,
    totalRefunds: 0
  });
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [revenueByService, setRevenueByService] = useState<{type: string, amount: number}[]>([]);
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

      // 5. Fetch Total Refunds Amount (this month)
      const { data: monthRefunds } = await supabase
        .from('refunds')
        .select('amount')
        .eq('status', 'Approved')
        .gte('created_at', firstDayOfMonth.toISOString());
        
      const totalRefundsAmount = monthRefunds?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      setMetrics({
        todayRevenue: todayRev,
        monthlyRevenue: monthRev,
        pendingPayments: pendingCount || 0,
        totalTransactions: totalTrans || 0,
        totalRefunds: totalRefundsAmount
      });

      // Fetch Revenue by Service Type
      const { data: paidBills } = await supabase
        .from('bills')
        .select('id')
        .eq('status', 'Paid')
        .gte('created_at', firstDayOfMonth.toISOString());

      if (paidBills && paidBills.length > 0) {
        const paidBillIds = paidBills.map(b => b.id);
        const { data: items } = await supabase
          .from('bill_items')
          .select('item_type, amount')
          .in('bill_id', paidBillIds);

        if (items) {
          const grouped = items.reduce((acc: any, item: any) => {
            acc[item.item_type] = (acc[item.item_type] || 0) + Number(item.amount);
            return acc;
          }, {});
          
          const formatted = Object.keys(grouped).map(key => ({
            type: key,
            amount: grouped[key]
          })).sort((a, b) => b.amount - a.amount);
          
          setRevenueByService(formatted);
        }
      }

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
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperSuccess}>
              <IndianRupee size={24} />
            </div>
            <h2 className={styles.cardTitle}>Today's Revenue</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#166534' }}>
            ₹{metrics.todayRevenue.toFixed(2)}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <TrendingUp size={24} />
            </div>
            <h2 className={styles.cardTitle}>Monthly Revenue</h2>
          </div>
          <div className={styles.statValue}>
            ₹{metrics.monthlyRevenue.toFixed(2)}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperWarning}>
              <Clock size={24} />
            </div>
            <h2 className={styles.cardTitle}>Pending Bills</h2>
          </div>
          <div className={styles.statValue}>{metrics.pendingPayments}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#f3e8ff', color: '#a855f7' }}>
              <Activity size={24} />
            </div>
            <h2 className={styles.cardTitle}>Total Transactions</h2>
          </div>
          <div className={styles.statValue}>{metrics.totalTransactions}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
              <Undo2 size={24} />
            </div>
            <h2 className={styles.cardTitle}>Monthly Refunds</h2>
          </div>
          <div className={styles.statValue} style={{ color: '#b91c1c' }}>
            ₹{metrics.totalRefunds.toFixed(2)}
          </div>
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Revenue By Service */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>
              <PieChart size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
              Revenue by Service
            </h2>
          </div>
          
          {loading ? (
            <p>Loading revenue data...</p>
          ) : revenueByService.length > 0 ? (
            <div className={styles.list}>
              {revenueByService.map((service, index) => (
                <div key={index} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{service.type}</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>₹{service.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              No service revenue recorded this month.
            </div>
          )}
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
