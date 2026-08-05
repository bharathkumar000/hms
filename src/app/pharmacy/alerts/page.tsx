'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertTriangle, Pill } from 'lucide-react';
import styles from '../inventory/inventory.module.css';

export default function PharmacyAlerts() {
  const [lowStockMeds, setLowStockMeds] = useState<any[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    
    const { data: meds } = await supabase
      .from('medicines')
      .select('*, medicine_batches(quantity)');
      
    if (meds) {
      let lowMeds: any[] = [];
      meds.forEach(m => {
        const totalStock = m.medicine_batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
        if (totalStock <= m.minimum_stock_level) {
          lowMeds.push({ ...m, totalStock });
        }
      });
      setLowStockMeds(lowMeds);
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data: batches } = await supabase
      .from('medicine_batches')
      .select('*, medicines(name)')
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gt('quantity', 0);

    if (batches) setExpiringBatches(batches);
    
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={28} /> Stock & Expiry Alerts
          </h1>
          <p className={styles.details}>Monitor items that need immediate attention or restocking.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Low Stock Panel */}
        <div className={styles.card} style={{ border: '1px solid #fca5a5' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#991b1b', fontSize: '1.25rem' }}>
            <AlertTriangle size={20} /> Low Stock Medicines
          </h2>
          {loading ? <p>Loading...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lowStockMeds.map(med => (
                <div key={med.id} style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#991b1b' }}>{med.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#b91c1c' }}>Min Level: {med.minimum_stock_level}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`${styles.badge} ${styles.badgeDanger}`} style={{ fontSize: '1rem', padding: '0.25rem 0.75rem' }}>
                      {med.totalStock} left
                    </span>
                  </div>
                </div>
              ))}
              {lowStockMeds.length === 0 && <p style={{ color: '#059669', fontWeight: 600 }}>All stock levels are healthy.</p>}
            </div>
          )}
        </div>

        {/* Expiring Batches Panel */}
        <div className={styles.card} style={{ border: '1px solid #fcd34d' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#b45309', fontSize: '1.25rem' }}>
            <Pill size={20} /> Expiring Soon (30 Days)
          </h2>
          {loading ? <p>Loading...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {expiringBatches.map(batch => (
                <div key={batch.id} style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#b45309' }}>{batch.medicines?.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#d97706' }}>Batch: {batch.batch_number} | Qty: {batch.quantity}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`${styles.badge} ${styles.badgeWarning}`}>
                      Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {expiringBatches.length === 0 && <p style={{ color: '#059669', fontWeight: 600 }}>No batches expiring soon.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
