'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FileText, TrendingUp, Download, AlertTriangle } from 'lucide-react';
import styles from '../prescriptions/prescriptions.module.css';

export default function PharmacyReports() {
  const [salesReport, setSalesReport] = useState<any[]>([]);
  const [expiringMedicines, setExpiringMedicines] = useState<any[]>([]);
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
    
    // Expiring Medicines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data: batches } = await supabase
      .from('medicine_batches')
      .select('batch_number, quantity, expiry_date, medicines(name)')
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gt('quantity', 0)
      .order('expiry_date', { ascending: true });
      
    if (batches) {
      setExpiringMedicines(batches);
    }
    
    setLoading(false);
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "Daily Sales Report\n";
    csvContent += "Date,Total Revenue\n";
    salesReport.forEach(row => {
      csvContent += `"${row.date}","${row.total}"\n`;
    });
    
    csvContent += "\nExpiring Medicines\n";
    csvContent += "Medicine,Batch,Quantity,Expiry Date\n";
    expiringMedicines.forEach(row => {
      csvContent += `"${row.medicines?.name}","${row.batch_number}","${row.quantity}","${new Date(row.expiry_date).toLocaleDateString()}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pharmacy_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pharmacy Reports</h1>
          <p className={styles.details}>Analytics, sales trends, and inventory history.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--color-primary)" /> Daily Sales Trend
            </h2>
            <button className={styles.btnOutline} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={handleExportCSV}>
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
        
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="#dc2626" /> Expiring Medicines (30d)
            </h2>
          </div>

          {loading ? <p>Loading reports...</p> : (
            <div className={styles.list}>
              {expiringMedicines.map((batch, idx) => (
                <div key={idx} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{batch.medicines?.name}</div>
                    <div className={styles.itemSub}>Batch: {batch.batch_number} | Qty: {batch.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.9rem' }}>
                    Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {expiringMedicines.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>No medicines expiring soon.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
