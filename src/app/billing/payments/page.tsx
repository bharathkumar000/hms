'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, CreditCard, Undo2, CheckCircle2 } from 'lucide-react';
import { useModal } from '@/components/ModalProvider';
import styles from './payments.module.css';

export default function PaymentsHistoryPage() {
  const { showAlert } = useModal();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  
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

  const openRefundModal = (payment: any) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.amount);
    setRefundReason('');
    setRefundModalOpen(true);
  };

  const submitRefundRequest = async () => {
    if (!selectedPayment) return;
    if (Number(refundAmount) <= 0 || Number(refundAmount) > selectedPayment.amount) {
      showAlert('Invalid refund amount.');
      return;
    }

    const { error } = await supabase
      .from('refunds')
      .insert([{
        payment_id: selectedPayment.id,
        amount: Number(refundAmount),
        reason: refundReason,
        status: 'Pending'
      }]);

    if (error) {
      showAlert('Error requesting refund: ' + error.message);
    } else {
      showAlert('Refund request submitted successfully.');
      setRefundModalOpen(false);
      setSelectedPayment(null);
    }
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
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
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
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => openRefundModal(payment)}
                        className={styles.btnOutline} 
                        style={{ padding: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                      >
                        <Undo2 size={14} /> Request Refund
                      </button>
                    </td>
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

      {refundModalOpen && selectedPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-background)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Request Refund</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Transaction: {selectedPayment.transaction_id}<br/>
              Max Refundable: ₹{Number(selectedPayment.amount).toFixed(2)}
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Refund Amount (₹)</label>
              <input 
                type="number" 
                max={selectedPayment.amount}
                min="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text-primary)' }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Reason for Refund</label>
              <textarea 
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                placeholder="Enter reason..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setRefundModalOpen(false)}
                style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={submitRefundRequest}
                className={styles.btnPrimary}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <CheckCircle2 size={16} /> Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
