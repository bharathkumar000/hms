'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';
import { Search, Undo2, CheckCircle2, XCircle } from 'lucide-react';
import styles from './refunds.module.css';

export default function RefundsPage() {
  const { showAlert, showConfirm } = useModal();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchRefunds();
  }, [searchQuery]);

  const fetchRefunds = async () => {
    setLoading(true);
    let query = supabase
      .from('refunds')
      .select(`
        *,
        payments (
          transaction_id,
          bills (invoice_number),
          profiles (first_name, last_name)
        )
      `)
      .order('created_at', { ascending: false });

    const { data } = await query;
    
    let filteredData = data || [];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filteredData = filteredData.filter((r: any) => 
        (r.payments?.transaction_id && r.payments.transaction_id.toLowerCase().includes(lowerQ)) ||
        (r.payments?.bills?.invoice_number && r.payments.bills.invoice_number.toLowerCase().includes(lowerQ)) ||
        (r.payments?.profiles && `${r.payments.profiles.first_name} ${r.payments.profiles.last_name}`.toLowerCase().includes(lowerQ))
      );
    }

    setRefunds(filteredData);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (await showConfirm(`Are you sure you want to ${newStatus.toLowerCase()} this refund?`)) {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('refunds')
        .update({ 
          status: newStatus,
          processed_by: userData.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        showAlert('Error processing refund: ' + error.message);
      } else {
        showAlert(`Refund ${newStatus.toLowerCase()} successfully.`);
        fetchRefunds();
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Approved</span>;
      case 'Pending': return <span className={`${styles.badge} ${styles.badgeWarning}`}>Pending</span>;
      case 'Rejected': return <span className={`${styles.badge} ${styles.badgeDanger}`}>Rejected</span>;
      default: return <span className={styles.badge}>{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Refund Management</h1>
          <p className={styles.details}>Process patient refund requests and view history.</p>
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
          <p>Loading refunds...</p>
        ) : refunds.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Patient Name</th>
                  <th style={{ padding: '1rem' }}>Invoice & TXN</th>
                  <th style={{ padding: '1rem' }}>Reason</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem' }}>{new Date(refund.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{refund.payments?.profiles?.first_name} {refund.payments?.profiles?.last_name}</td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      <div>{refund.payments?.bills?.invoice_number}</div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>{refund.payments?.transaction_id}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {refund.reason || 'No reason provided'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>₹{Number(refund.amount).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{getStatusBadge(refund.status)}</td>
                    <td style={{ padding: '1rem' }}>
                      {refund.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className={styles.btnOutline} 
                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', borderColor: '#10b981', color: '#10b981' }} 
                            title="Approve"
                            onClick={() => handleUpdateStatus(refund.id, 'Approved')}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            className={styles.btnOutline} 
                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', borderColor: '#ef4444', color: '#ef4444' }} 
                            title="Reject"
                            onClick={() => handleUpdateStatus(refund.id, 'Rejected')}
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <Undo2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No refund requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
