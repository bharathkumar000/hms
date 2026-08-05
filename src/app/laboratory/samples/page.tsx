'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TestTube, QrCode } from 'lucide-react';
import styles from '../orders/orders.module.css'; // Reuse orders styles

export default function LaboratorySamples() {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*, profiles(first_name, last_name, phone_number, date_of_birth), doctors(first_name, last_name)')
      .in('status', ['Sample Requested', 'Sample Collected', 'Sample Received'])
      .order('urgent', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) setSamples(data);
    setLoading(false);
  };

  const handleCollectSample = async (id: string) => {
    const sampleId = `SMP-${Math.floor(100000 + Math.random() * 900000)}`; // e.g. SMP-123456
    const { error } = await supabase
      .from('lab_orders')
      .update({ 
        status: 'Sample Collected',
        sample_id: sampleId,
        collection_time: new Date().toISOString()
      })
      .eq('id', id);
    
    if (!error) fetchSamples();
  };

  const handleReceiveSample = async (id: string) => {
    const { error } = await supabase
      .from('lab_orders')
      .update({ status: 'Sample Received' })
      .eq('id', id);
    
    if (!error) fetchSamples();
  };

  const handleSendToProcessing = async (id: string) => {
    const { error } = await supabase
      .from('lab_orders')
      .update({ status: 'Processing', processing_start_time: new Date().toISOString() })
      .eq('id', id);
    
    if (!error) fetchSamples();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Sample Tracking</h1>
          <p className={styles.details}>Collect, label, and track patient samples.</p>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading samples...</p>
        ) : samples.length > 0 ? (
          <div className={styles.list}>
            {samples.map(sample => (
              <div key={sample.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <TestTube size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                    {sample.test_category}
                    {sample.urgent && <span className={styles.badgeUrgent}>URGENT</span>}
                  </div>
                  <div className={styles.itemSub}>
                    Patient: {sample.profiles?.first_name} {sample.profiles?.last_name} | DOB: {sample.profiles?.date_of_birth}
                  </div>
                  {sample.sample_id && (
                    <div className={styles.itemSub} style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      <QrCode size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/>
                      Sample ID: {sample.sample_id}
                    </div>
                  )}
                  {sample.collection_time && (
                    <div className={styles.itemSub} style={{ fontSize: '0.8rem' }}>
                      Collected: {new Date(sample.collection_time).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${styles.statusRequested}`}>
                    {sample.status}
                  </span>
                  
                  {sample.status === 'Sample Requested' && (
                    <div className={styles.actions}>
                      <button className={styles.btnPrimary} onClick={() => handleCollectSample(sample.id)}>
                        Collect Sample & Gen ID
                      </button>
                    </div>
                  )}

                  {sample.status === 'Sample Collected' && (
                    <div className={styles.actions}>
                      <button className={styles.btnOutline} onClick={() => handleReceiveSample(sample.id)}>
                        Mark as Received in Lab
                      </button>
                    </div>
                  )}

                  {sample.status === 'Sample Received' && (
                    <div className={styles.actions}>
                      <button className={styles.btnPrimary} onClick={() => handleSendToProcessing(sample.id)}>
                        Send to Processing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No samples in queue.</p>
        )}
      </div>
    </div>
  );
}
