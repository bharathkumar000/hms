'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Clock, ChefHat, CheckCircle } from 'lucide-react';
import styles from './kitchen.module.css';

export default function KitchenDisplay() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    // Kitchen only cares about orders being prepared or pending
    const { data } = await supabase
      .from('canteen_orders')
      .select('*, canteen_order_items(*, menu_items(name))')
      .in('status', ['Pending', 'Preparing', 'Ready'])
      .order('created_at', { ascending: true }); // Oldest first
    
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase.channel('kitchen_updates')
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

  if (loading) return <div>Loading kitchen display...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Kitchen Display System</h1>
          <p className={styles.subtitle}>Real-time incoming orders and preparation queue.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {orders.map(order => (
          <div key={order.id} style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            borderTop: `4px solid ${order.status === 'Pending' ? '#d97706' : order.status === 'Preparing' ? '#ea580c' : '#16a34a'}`
          }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
              <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>#{order.id.split('-')[0]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#6b7280' }}>
                <Clock size={14} />
                {new Date(order.created_at).toLocaleTimeString()}
              </div>
            </div>
            
            <div style={{ padding: '1rem' }}>
              {order.kitchen_notes && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 500 }}>
                  Note: {order.kitchen_notes}
                </div>
              )}
              
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '1.1rem', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {order.canteen_order_items?.map((item: any) => (
                  <li key={item.id}>{item.quantity}x {item.menu_items?.name}</li>
                ))}
              </ul>
            </div>

            <div style={{ padding: '1rem', background: '#f9fafb', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
              {order.status === 'Pending' && (
                <button onClick={() => updateStatus(order.id, 'Preparing')} style={{ flex: 1, padding: '0.75rem', background: '#ea580c', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <ChefHat size={18} /> Start Preparing
                </button>
              )}
              {order.status === 'Preparing' && (
                <button onClick={() => updateStatus(order.id, 'Ready')} style={{ flex: 1, padding: '0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} /> Mark Ready
                </button>
              )}
              {order.status === 'Ready' && (
                <div style={{ flex: 1, padding: '0.75rem', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                  Waiting for Delivery
                </div>
              )}
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: '#6b7280', background: 'white', borderRadius: '1rem' }}>
            <ChefHat size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <h2>No Active Orders</h2>
            <p>The kitchen queue is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
