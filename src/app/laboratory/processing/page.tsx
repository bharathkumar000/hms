'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Activity, QrCode } from 'lucide-react';
import styles from '../orders/orders.module.css'; // Reuse orders styles

export default function LaboratoryProcessing() {
  const [processing, setProcessing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    fetchProcessing();
  }, []);

  const fetchProcessing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*, profiles(first_name, last_name)')
      .eq('status', 'Processing')
      .order('urgent', { ascending: false })
      .order('processing_start_time', { ascending: true }); // Oldest first

    if (data) setProcessing(data);
    setLoading(false);
  };

  const handleCompleteTest = async (id: string) => {
    const { error } = await supabase
      .from('lab_orders')
      .update({ 
        status: 'Completed', 
        completion_time: new Date().toISOString()
      })
      .eq('id', id);
    
    if (!error) fetchProcessing();
  };

  const calculateDuration = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - start) / 60000);
    return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Processing Queue</h1>
          <p className={styles.details}>Monitor and complete active test processing.</p>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading processing queue...</p>
        ) : processing.length > 0 ? (
          <div className={styles.list}>
            {processing.map(proc => (
              <div key={proc.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <Activity size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                    {proc.test_category}
                    {proc.urgent && <span className={styles.badgeUrgent}>URGENT</span>}
                  </div>
                  <div className={styles.itemSub}>
                    Patient: {proc.profiles?.first_name} {proc.profiles?.last_name}
                  </div>
                  <div className={styles.itemSub} style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    <QrCode size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/>
                    Sample ID: {proc.sample_id}
                  </div>
                  <div className={styles.itemSub} style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#a16207' }}>
                    Started: {new Date(proc.processing_start_time).toLocaleTimeString()} (Duration: {calculateDuration(proc.processing_start_time)})
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status}`} style={{ backgroundColor: 'var(--color-light)', color: 'var(--color-primary)' }}>
                    Processing
                  </span>
                  
                  <div className={styles.actions}>
                    <button className={styles.btnPrimary} onClick={() => handleCompleteTest(proc.id)}>
                      Complete Test
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No tests currently processing.</p>
        )}
      </div>
    </div>
  );
}
