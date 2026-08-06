'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, CreditCard, Filter } from 'lucide-react';
import styles from './payments.module.css';

export default function PaymentsHistoryPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchPayments();
  }, [searchQuery]);

  const fetchPayments = async () => {
    setLoading(true);
    let query = supabase
      .from('payments')
      .select(`
        *,
        profiles (first_name, last_name),
        bills (invoice_number)
      `)
      .order('payment_date', { ascending: false });

    const { data } = await query;
    
    let filteredData = data || [];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filteredData = filteredData.filter((p: any) => 
        (p.transaction_id && p.transaction_id.toLowerCase().includes(lowerQ)) ||
        (p.bills?.invoice_number && p.bills.invoice_number.toLowerCase().includes(lowerQ)) ||
        (p.profiles && `${p.profiles.first_name} ${p.profiles.last_name}`.toLowerCase().includes(lowerQ))
      );
    }

    setPayments(filteredData);
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payment History</h1>
          <p className={styles.details}>View all completed transactions and payment records.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className={styles.searchBar} style={{ flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
            <Search size={20} color="var(--color-text-secondary)" style={{ marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Search by Patient, Invoice #, or TXN ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading payments...</p>
        ) : payments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Transaction ID</th>
                  <th style={{ padding: '1rem' }}>Invoice #</th>
                  <th style={{ padding: '1rem' }}>Patient Name</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Method</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{payment.transaction_id}</td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{payment.bills?.invoice_number || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{payment.profiles?.first_name} {payment.profiles?.last_name}</td>
                    <td style={{ padding: '1rem' }}>{new Date(payment.payment_date).toLocaleString()}</td>
                    <td style={{ padding: '1rem' }}>{payment.payment_method}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>+₹{Number(payment.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <CreditCard size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No payment records found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
