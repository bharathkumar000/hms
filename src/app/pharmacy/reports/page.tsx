'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FileText, TrendingUp, Download } from 'lucide-react';
import styles from '../prescriptions/prescriptions.module.css';

export default function PharmacyReports() {
  const [salesReport, setSalesReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    
    // Group bills by date for a simple sales report
    const { data: bills } = await supabase
      .from('bills')
      .select('amount, created_at')
      .eq('bill_type', 'Pharmacy')
      .order('created_at', { ascending: false });

    if (bills) {
      const grouped: { [key: string]: number } = {};
      bills.forEach(b => {
        const date = new Date(b.created_at).toLocaleDateString();
        grouped[date] = (grouped[date] || 0) + Number(b.amount);
      });
      
      const reportData = Object.keys(grouped).map(date => ({
        date,
        total: grouped[date]
      })).slice(0, 14); // Last 14 days with data
      
      setSalesReport(reportData);
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pharmacy Reports</h1>
          <p className={styles.details}>Analytics, sales trends, and inventory history.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--color-primary)" /> Daily Sales Trend
          </h2>
          <button className={styles.btnOutline} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Download size={14} style={{ display: 'inline', marginRight: '4px' }} /> Export CSV
          </button>
        </div>

        {loading ? <p>Loading reports...</p> : (
          <div className={styles.list}>
            {salesReport.map((rep, idx) => (
              <div key={idx} className={styles.listItem}>
                <div className={styles.itemMain}>
                  <FileText size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-text-secondary)' }}/>
                  {rep.date}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                  ₹{rep.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
            {salesReport.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>No sales data available.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
