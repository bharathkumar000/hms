'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertTriangle, Clock } from 'lucide-react';
import styles from '../orders/orders.module.css'; // Reuse orders styles

export default function LaboratoryUrgent() {
  const [urgentCases, setUrgentCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    fetchUrgentCases();
  }, []);

  const fetchUrgentCases = async () => {
    setLoading(true);
    // Fetch all urgent lab orders that are NOT yet released
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*, profiles(first_name, last_name, phone_number), doctors(first_name, last_name)')
      .eq('urgent', true)
      .neq('status', 'Released')
      .order('created_at', { ascending: false });

    if (data) setUrgentCases(data);
    setLoading(false);
  };

  const calculateWaitTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - start) / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Pending': return styles.statusPending;
      case 'Processing': return styles.statusRequested;
      case 'Completed': return styles.statusRequested;
      case 'Report Ready': return styles.statusRequested;
      default: return styles.statusRequested;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
            <AlertTriangle size={28} /> Urgent Cases (STAT)
          </h1>
          <p className={styles.details}>High priority tests that require immediate attention.</p>
        </div>
      </header>

      <div className={styles.card} style={{ border: '1px solid #fca5a5' }}>
        {loading ? (
          <p>Loading urgent cases...</p>
        ) : urgentCases.length > 0 ? (
          <div className={styles.list}>
            {urgentCases.map(uc => (
              <div key={uc.id} className={styles.listItem} style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <div className={styles.itemMain} style={{ color: '#991b1b' }}>
                    <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>
                    {uc.test_category}
                  </div>
                  <div className={styles.itemSub} style={{ color: '#b91c1c' }}>
                    Patient: {uc.profiles?.first_name} {uc.profiles?.last_name} | Ph: {uc.profiles?.phone_number}
                  </div>
                  <div className={styles.itemSub} style={{ color: '#b91c1c' }}>
                    Doctor: Dr. {uc.doctors?.first_name} {uc.doctors?.last_name}
                  </div>
                  <div className={styles.itemSub} style={{ marginTop: '0.5rem', fontWeight: 600, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Time since request: {calculateWaitTime(uc.created_at)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(uc.status)}`} style={{ backgroundColor: '#dc2626', color: 'white' }}>
                    {uc.status}
                  </span>
                  <div className={styles.itemSub} style={{ fontSize: '0.8rem', color: '#dc2626' }}>
                    Follow workflow via appropriate module
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <AlertTriangle size={48} color="#fca5a5" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>No urgent cases pending at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
