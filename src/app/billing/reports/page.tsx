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
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>
                <IndianRupee size={24} />
              </div>
              <div className={styles.metricInfo}>
                <h3>Daily Revenue</h3>
                <p className={styles.metricValue}>₹{metrics.daily.toFixed(2)}</p>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <TrendingUp size={24} />
              </div>
              <div className={styles.metricInfo}>
                <h3>Weekly Revenue</h3>
                <p className={styles.metricValue}>₹{metrics.weekly.toFixed(2)}</p>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: '#f3e8ff', color: '#a855f7' }}>
                <BarChart3 size={24} />
              </div>
              <div className={styles.metricInfo}>
                <h3>Monthly Revenue</h3>
                <p className={styles.metricValue}>₹{metrics.monthly.toFixed(2)}</p>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>
                <PieChart size={24} />
              </div>
              <div className={styles.metricInfo}>
                <h3>Outstanding Balance</h3>
                <p className={styles.metricValue}>₹{metrics.totalOutstanding.toFixed(2)}</p>
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
