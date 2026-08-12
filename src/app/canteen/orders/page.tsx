'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';
import { Filter, Search } from 'lucide-react';
import styles from './orders.module.css';

export default function OrdersManagement() {
  const { showAlert, showConfirm } = useModal();
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('canteen_orders')
      .select('*, canteen_order_items(*, menu_items(name)), profiles!patient_id(first_name, last_name), staff:profiles!staff_id(first_name, last_name)')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase.channel('canteen_orders_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canteen_orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const updateStatus = async (id: string, status: string) => {
    if (status === 'Cancelled' && !(await showConfirm('Are you sure you want to cancel this order?'))) {
      return;
    }
    
    const { error } = await supabase.from('canteen_orders').update({ status }).eq('id', id);
    if (error) showAlert(`Error: ${error.message}`);
    else fetchOrders(); // Will also be triggered by realtime, but doing it immediately for UI feedback
  };

  const filteredOrders = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders Management</h1>
          <p className={styles.subtitle}>Track and update incoming food orders.</p>
        </div>
      </header>

      <div className={styles.card} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
          <Search size={20} color="#6b7280" />
          <input 
            placeholder="Search orders..." 
            style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={20} color="#6b7280" />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Order ID</th>
                <th style={{ padding: '1rem' }}>Customer / Location</th>
                <th style={{ padding: '1rem' }}>Items</th>
                <th style={{ padding: '1rem' }}>Total</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    #{order.id.split('-')[0]}
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>
                      {order.order_type === 'Staff' 
                        ? (order.staff?.first_name ? `Dr. ${order.staff.first_name} ${order.staff.last_name}` : 'Staff') 
                        : (order.profiles?.first_name ? `${order.profiles.first_name} ${order.profiles.last_name}` : 'Patient')}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{order.delivery_location}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.9rem' }}>
                      {order.canteen_order_items?.map((item: any) => (
                        <li key={item.id}>{item.quantity}x {item.menu_items?.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>₹{order.total_amount}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      background: order.status === 'Pending' ? '#fef3c7' : order.status === 'Preparing' ? '#ffedd5' : order.status === 'Ready' ? '#dcfce7' : order.status === 'Cancelled' ? '#fee2e2' : '#e0e7ff',
                      color: order.status === 'Pending' ? '#d97706' : order.status === 'Preparing' ? '#ea580c' : order.status === 'Ready' ? '#16a34a' : order.status === 'Cancelled' ? '#ef4444' : '#4f46e5'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {order.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => updateStatus(order.id, 'Preparing')} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Accept</button>
                        <button onClick={() => updateStatus(order.id, 'Cancelled')} style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Reject</button>
                      </div>
                    )}
                    {order.status === 'Preparing' && (
                      <button onClick={() => updateStatus(order.id, 'Ready')} style={{ padding: '0.4rem 0.8rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Mark Ready</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No orders found matching the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
