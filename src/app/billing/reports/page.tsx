'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BarChart3, TrendingUp, IndianRupee, PieChart } from 'lucide-react';
import styles from './reports.module.css';

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    totalOutstanding: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [revenueByDept, setRevenueByDept] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStartStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const yearStartStr = new Date(now.getFullYear(), 0, 1).toISOString();

      // Fetch all payments for this year to calculate aggregations
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', yearStartStr);

      let daily = 0, weekly = 0, monthly = 0, yearly = 0;

      if (payments) {
        payments.forEach(p => {
          const amount = Number(p.amount);
          const pDate = new Date(p.payment_date).getTime();
          yearly += amount;
          if (pDate >= new Date(monthStartStr).getTime()) monthly += amount;
          if (pDate >= new Date(weekAgoStr).getTime()) weekly += amount;
          if (pDate >= new Date(todayStr).getTime()) daily += amount;
        });
      }

      // Fetch Outstanding Payments (Pending bills)
      const { data: pendingBills } = await supabase
        .from('bills')
        .select('total_amount, amount_paid')
        .eq('status', 'Pending');

      const outstanding = pendingBills?.reduce((sum, b) => sum + (Number(b.total_amount) - Number(b.amount_paid)), 0) || 0;

      // Fetch Revenue by Department/Service
      const { data: items } = await supabase
        .from('bill_items')
        .select(`
          item_type,
          amount,
          bills!inner(status)
        `)
        .eq('bills.status', 'Paid');

      if (items) {
        const grouped = items.reduce((acc: any, item: any) => {
          acc[item.item_type] = (acc[item.item_type] || 0) + Number(item.amount);
          return acc;
        }, {});
        
        const formatted = Object.keys(grouped).map(key => ({
          type: key,
          amount: grouped[key]
        })).sort((a, b) => b.amount - a.amount);
        
        setRevenueByDept(formatted);
      }

      setMetrics({
        daily,
        weekly,
        monthly,
        yearly,
        totalOutstanding: outstanding
      });

      // Get some recent transaction trends
      const { data: recent } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_method, bills(invoice_number)')
        .order('payment_date', { ascending: false })
        .limit(10);
      
      if (recent) setRecentPayments(recent);

    } catch (error) {
      console.error('Error fetching report data:', error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Financial Reports</h1>
          <p className={styles.details}>Analytics, revenue summaries, and outstanding balances.</p>
        </div>
      </header>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Revenue Summary Card */}
            <div className={styles.card} style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className={styles.cardTitle} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <TrendingUp size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px', color: 'var(--color-primary)' }} />
                Revenue Breakdown
              </h2>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-background)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>Daily Revenue (Today)</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{metrics.daily.toFixed(2)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-background)', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>Weekly Revenue</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{metrics.weekly.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-background)', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>Monthly Revenue</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{metrics.monthly.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-background)', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>Year-to-Date (YTD)</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{metrics.yearly.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Outstanding & Receivables Card */}
            <div className={styles.card} style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className={styles.cardTitle} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <PieChart size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px', color: '#ef4444' }} />
                Outstanding & Receivables
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, background: '#fef2f2', borderRadius: '12px', padding: '2rem' }}>
                <IndianRupee size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#ef4444', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Total Outstanding Balance</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#991b1b' }}>
                  ₹{metrics.totalOutstanding.toFixed(2)}
                </div>
                <p style={{ color: '#b91c1c', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  This amount represents all pending bills that have not yet been fully paid by patients.
                </p>
              </div>
            </div>

            {/* Revenue by Department */}
            <div className={styles.card} style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className={styles.cardTitle} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <PieChart size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px', color: 'var(--color-primary)' }} />
                Revenue by Department
              </h2>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {revenueByDept.length > 0 ? (
                  revenueByDept.map((dept, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>{dept.type}</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>₹{dept.amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem 0' }}>No department revenue data available.</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Recent Transaction Trends</h2>
              <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th style={{ padding: '1rem' }}>Invoice #</th>
                      <th style={{ padding: '1rem' }}>Method</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem' }}>{new Date(p.payment_date).toLocaleString()}</td>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{p.bills?.invoice_number || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>{p.payment_method}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                          +₹{Number(p.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {recentPayments.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No transactions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
