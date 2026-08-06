'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';
import { CreditCard, Receipt, FileText } from 'lucide-react';
import styles from './payments.module.css';

export default function PaymentsManagement() {
  const { showAlert, showConfirm } = useModal();
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    // Fetch all orders that haven't been cancelled to manage payments
    const { data } = await supabase
      .from('canteen_orders')
      .select('*, profiles!patient_id(first_name, last_name), staff:profiles!staff_id(first_name, last_name)')
      .neq('status', 'Cancelled')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [supabase]);

  const handleOpenPayment = (order: any) => {
    setSelectedOrder(order);
    setPaymentMethod('Cash');
    setTransactionId('');
    setIsModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Record Payment
      const { error: paymentError } = await supabase.from('canteen_payments').insert({
        order_id: selectedOrder.id,
        amount: selectedOrder.total_amount,
        payment_method: paymentMethod,
        transaction_id: transactionId || null,
        payment_status: 'Completed'
      });
      
      if (paymentError) throw paymentError;

      // 2. Update Order Status
      const { error: orderError } = await supabase.from('canteen_orders')
        .update({ payment_status: 'Paid' })
        .eq('id', selectedOrder.id);
        
      if (orderError) throw orderError;
      
      showAlert('Payment processed successfully and receipt generated.');
      setIsModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      showAlert(`Error processing payment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateReceipt = (order: any) => {
    // In a real app, this would generate a PDF or trigger a print dialog
    // For now, we simulate success
    showAlert(`Receipt generated for Order #${order.id.split('-')[0]}`);
  };

  if (loading) return <div>Loading payments...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payments & Billing</h1>
          <p className={styles.subtitle}>Process order payments and generate receipts.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Order ID</th>
                <th style={{ padding: '1rem' }}>Customer</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Order Status</th>
                <th style={{ padding: '1rem' }}>Payment Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    #{order.id.split('-')[0]}
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>
                      {order.order_type === 'Staff' 
                        ? (order.staff?.first_name ? `Dr. ${order.staff.first_name} ${order.staff.last_name}` : 'Staff') 
                        : (order.profiles?.first_name ? `${order.profiles.first_name} ${order.profiles.last_name}` : 'Patient')}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>₹{order.total_amount}</td>
                  <td style={{ padding: '1rem' }}>{order.status}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      background: order.payment_status === 'Paid' ? '#dcfce7' : '#fee2e2',
                      color: order.payment_status === 'Paid' ? '#16a34a' : '#ef4444'
                    }}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {order.payment_status === 'Pending' ? (
                        <button onClick={() => handleOpenPayment(order)} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CreditCard size={14} /> Pay
                        </button>
                      ) : (
                        <button onClick={() => generateReceipt(order)} style={{ padding: '0.4rem 0.8rem', background: '#f3f4f6', color: '#374151', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileText size={14} /> Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No orders available for billing.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={24} /> Process Payment
            </h2>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280' }}>Order ID:</span>
                <span style={{ fontWeight: 500 }}>#{selectedOrder.id.split('-')[0]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Total Amount:</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>₹{selectedOrder.total_amount}</span>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  {selectedOrder.order_type === 'Patient' && (
                    <option value="Added to Bill">Add to Patient Hospital Bill</option>
                  )}
                </select>
              </div>
              
              {(paymentMethod === 'UPI' || paymentMethod === 'Card') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Transaction ID (Optional)</label>
                  <input value={transactionId} onChange={e => setTransactionId(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} />
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
