'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { IndianRupee, Receipt, AlertCircle } from 'lucide-react';
import styles from '../users/users.module.css'; // Reusing user module styles

export default function AdminBilling() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');

  const supabase = createClient();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bills')
      .select('*, patient_id(first_name, last_name)')
      .order('created_at', { ascending: false });
      
    if (data) setBills(data);
    setLoading(false);
  };

  const filteredBills = bills.filter(b => filterType === 'All' || b.bill_type === filterType);
  
  const pendingCount = bills.filter(b => b.status === 'Pending').length;
  const totalPendingAmount = bills
    .filter(b => b.status === 'Pending')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Billing & Revenue Overview</h1>
          <p className={styles.details}>Monitor hospital-wide billing and pending payments.</p>
        </div>
      </header>

      {/* Quick Stats for Pending */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
         <div className={styles.card} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: '#fef9c3', color: '#a16207', padding: '1rem', borderRadius: '12px' }}>
              <AlertCircle size={28} />
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Pending Invoices</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{pendingCount}</div>
            </div>
         </div>
         <div className={styles.card} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: '#fef9c3', color: '#a16207', padding: '1rem', borderRadius: '12px' }}>
              <IndianRupee size={28} />
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Outstanding</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                ₹{totalPendingAmount.toLocaleString()}
              </div>
            </div>
         </div>
      </div>

      <div className={styles.card}>
        <div className={styles.filterGroup}>
          <select 
            className={styles.searchInput} 
            style={{ width: '200px' }}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="General">General / Consultation</option>
            <option value="Pharmacy">Pharmacy</option>
          </select>
        </div>

        {loading ? (
          <p>Loading bills...</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient Name</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td>{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{bill.patient_id?.first_name} {bill.patient_id?.last_name}</td>
                    <td>{bill.bill_type}</td>
                    <td>{bill.description || 'N/A'}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(bill.amount).toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${bill.status === 'Paid' ? styles.badgeSuccess : styles.badgeDanger}`} style={{ backgroundColor: bill.status === 'Pending' ? '#fef9c3' : '', color: bill.status === 'Pending' ? '#a16207' : '' }}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No bills found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
