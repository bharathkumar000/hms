'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClipboardList } from 'lucide-react';
import styles from './orders.module.css';

export default function LaboratoryOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); // Pending, Accepted, All
  
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('lab_orders')
      .select('*, profiles(first_name, last_name, phone_number), doctors(first_name, last_name, department)')
      .order('urgent', { ascending: false }) // Urgent first
      .order('created_at', { ascending: false });

    if (filter === 'Pending') {
      query = query.eq('status', 'Pending');
    } else if (filter === 'Accepted') {
      query = query.in('status', ['Sample Requested', 'Sample Collected']);
    }

    const { data, error } = await query;
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('lab_orders').update({ status: newStatus }).eq('id', id);
    if (!error) fetchOrders();
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Pending': return styles.statusPending;
      case 'Cancelled': return styles.statusCancelled;
      default: return styles.statusRequested;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Test Orders</h1>
          <p className={styles.details}>Manage incoming lab test requests from doctors.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup}>
          <select 
            className={styles.filterSelect} 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Pending">Pending Requests</option>
            <option value="Accepted">Accepted / Active</option>
            <option value="All">All Requests</option>
          </select>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length > 0 ? (
          <div className={styles.list}>
            {orders.map(order => (
              <div key={order.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                    {order.test_category}
                    {order.urgent && <span className={styles.badgeUrgent}>URGENT</span>}
                  </div>
                  <div className={styles.itemSub}>
                    Patient: {order.profiles?.first_name} {order.profiles?.last_name} | Ph: {order.profiles?.phone_number}
                  </div>
                  <div className={styles.itemSub}>
                    Doctor: Dr. {order.doctors?.first_name} {order.doctors?.last_name} ({order.doctors?.department})
                  </div>
                  {order.notes && (
                    <div className={styles.itemSub} style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>
                      " {order.notes} "
                    </div>
                  )}
                  <div className={styles.itemSub} style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    Requested: {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                  
                  {order.status === 'Pending' && (
                    <div className={styles.actions}>
                      <button className={styles.btnPrimary} onClick={() => handleUpdateStatus(order.id, 'Sample Requested')}>
                        Accept & Request Sample
                      </button>
                      <button className={`${styles.btnOutline} ${styles.btnDanger}`} onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {order.status === 'Sample Requested' && (
                    <div className={styles.actions}>
                      <button className={styles.btnOutline} onClick={() => window.location.href='/laboratory/samples'}>
                        Go to Samples
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No test orders found for this filter.</p>
        )}
      </div>
    </div>
  );
}
