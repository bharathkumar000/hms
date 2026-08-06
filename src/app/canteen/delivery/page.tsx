'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Truck, CheckCircle, MapPin } from 'lucide-react';
import styles from './delivery.module.css';

export default function DeliveryManagement() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('canteen_orders')
      .select('*, profiles!patient_id(first_name, last_name), staff:profiles!staff_id(first_name, last_name)')
      .in('status', ['Ready', 'Out for Delivery', 'Delivered'])
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase.channel('delivery_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canteen_orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('canteen_orders').update({ status }).eq('id', id);
    if (!error) fetchOrders();
  };

  if (loading) return <div>Loading delivery queue...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Delivery Queue</h1>
          <p className={styles.subtitle}>Manage orders ready for delivery.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Order ID</th>
                <th style={{ padding: '1rem' }}>Recipient</th>
                <th style={{ padding: '1rem' }}>Delivery Location</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    #{order.id.split('-')[0]}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    {order.order_type === 'Staff' 
                      ? (order.staff?.first_name ? `Dr. ${order.staff.first_name} ${order.staff.last_name}` : 'Staff') 
                      : (order.profiles?.first_name ? `${order.profiles.first_name} ${order.profiles.last_name}` : 'Patient')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}>
                      <MapPin size={16} /> {order.delivery_location}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      background: order.status === 'Ready' ? '#dcfce7' : order.status === 'Out for Delivery' ? '#e0e7ff' : '#f3f4f6',
                      color: order.status === 'Ready' ? '#16a34a' : order.status === 'Out for Delivery' ? '#4f46e5' : '#6b7280'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {order.status === 'Ready' && (
                      <button onClick={() => updateStatus(order.id, 'Out for Delivery')} style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                        <Truck size={16} /> Start Delivery
                      </button>
                    )}
                    {order.status === 'Out for Delivery' && (
                      <button onClick={() => updateStatus(order.id, 'Delivered')} style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                        <CheckCircle size={16} /> Mark Delivered
                      </button>
                    )}
                    {order.status === 'Delivered' && (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Delivered</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No orders in the delivery queue.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
