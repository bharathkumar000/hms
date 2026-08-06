'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, CheckCircle, Package } from 'lucide-react';
import styles from '../inventory/inventory.module.css';

export default function PharmacyOrders() {
  const { showAlert, showConfirm } = useModal();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name), purchase_order_items(quantity, unit_price, medicines(name))')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleReceiveOrder = async (orderId: string, items: any[], supplierId: string) => {
    if (!await showConfirm('Mark this order as received? This will add stock to inventory.')) return;
    
    // 1. Update order status
    await supabase.from('purchase_orders').update({ status: 'Received', delivery_date: new Date().toISOString() }).eq('id', orderId);
    
    // 2. Add batches and stock transactions for each item
    for (const item of items) {
      // Create a batch
      const batchNum = `BAT-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: newBatch } = await supabase.from('medicine_batches').insert({
        medicine_id: item.medicines?.id || item.medicine_id,
        supplier_id: supplierId,
        batch_number: batchNum,
        quantity: item.quantity,
        expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString() // Dummy 2 years expiry
      }).select().single();

      if (newBatch) {
        // Record transaction
        await supabase.from('stock_transactions').insert({
          medicine_id: item.medicines?.id || item.medicine_id,
          batch_id: newBatch.id,
          transaction_type: 'IN',
          quantity: item.quantity,
          reference_type: 'Purchase Order',
          reference_id: orderId
        });
      }
    }
    
    fetchOrders();
    showAlert('Stock received and inventory updated successfully!');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Received') return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Received</span>;
    if (status === 'Cancelled') return <span className={`${styles.badge} ${styles.badgeDanger}`}>Cancelled</span>;
    return <span className={`${styles.badge} ${styles.badgeWarning}`}>Pending</span>;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Purchase Orders</h1>
          <p className={styles.details}>Manage orders to suppliers and receive stock.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => showAlert('Creating POs feature coming soon! (Demo mode)')}>
            <Plus size={20} /> New Order
          </button>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading purchase orders...</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order Date</th>
                  <th>Supplier</th>
                  <th>Total Amount</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{order.suppliers?.name}</td>
                    <td>₹{order.total_amount}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {order.purchase_order_items?.map((item: any, idx: number) => (
                          <div key={idx}>{item.quantity}x {item.medicines?.name}</div>
                        ))}
                      </div>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      {order.status === 'Pending' && (
                        <button 
                          className={styles.btnPrimary} 
                          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                          onClick={() => handleReceiveOrder(order.id, order.purchase_order_items, order.supplier_id)}
                        >
                          <Package size={16} /> Receive Stock
                        </button>
                      )}
                      {order.status === 'Received' && (
                        <span style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          <CheckCircle size={16} /> Added to Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No purchase orders found.
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
