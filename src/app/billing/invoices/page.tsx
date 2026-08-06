'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, FileText, Download, Eye } from 'lucide-react';
import styles from './invoices.module.css';

export default function InvoicesPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const supabase = createClient();

  useEffect(() => {
    fetchBills();
  }, [searchQuery, filterStatus]);

  const fetchBills = async () => {
    setLoading(true);
    let query = supabase
      .from('bills')
      .select(`
        *,
        profiles (first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (filterStatus !== 'All') {
      query = query.eq('status', filterStatus);
    }

    const { data } = await query;
    
    let filteredData = data || [];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filteredData = filteredData.filter((b: any) => 
        (b.invoice_number && b.invoice_number.toLowerCase().includes(lowerQ)) ||
        (b.profiles && `${b.profiles.first_name} ${b.profiles.last_name}`.toLowerCase().includes(lowerQ))
      );
    }

    setBills(filteredData);
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
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.details}>Manage patient bills, view pending invoices, and process payments.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className={styles.searchBar} style={{ flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
            <Search size={20} color="var(--color-text-secondary)" style={{ marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Search by Patient Name or Invoice #" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--color-text-primary)' }}
            />
          </div>
          
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)', outline: 'none' }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        {loading ? (
          <p>Loading invoices...</p>
        ) : bills.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Invoice #</th>
                  <th style={{ padding: '1rem' }}>Patient Name</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{bill.invoice_number || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{bill.profiles?.first_name} {bill.profiles?.last_name}</td>
                    <td style={{ padding: '1rem' }}>{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>₹{Number(bill.total_amount).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{getStatusBadge(bill.status)}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={styles.btnOutline} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }} title="View Invoice">
                          <Eye size={16} />
                        </button>
                        <button className={styles.btnOutline} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }} title="Download Invoice">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No invoices found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
