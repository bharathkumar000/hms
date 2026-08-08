'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { addChargeToPatient } from '@/utils/billing';
import { ClipboardList, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './prescriptions.module.css';

export default function PharmacyPrescriptions() {
  const { showAlert, showConfirm } = useModal();

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); // Pending, Completed, All
  
  const supabase = createClient();

  useEffect(() => {
    fetchPrescriptions();
  }, [filter]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    let query = supabase
      .from('prescriptions')
      .select('*, profiles(first_name, last_name, phone_number), doctors(first_name, last_name)')
      .order('created_at', { ascending: false });

    if (filter === 'Pending') {
      query = query.in('dispense_status', ['Pending', 'Partially Dispensed']);
    } else if (filter === 'Completed') {
      query = query.eq('dispense_status', 'Completed');
    }

    const { data } = await query;
    if (data) setPrescriptions(data);
    setLoading(false);
  };

  const getStatusClass = (status: string) => {
    if (status === 'Completed') return styles.statusCompleted;
    if (status === 'Partially Dispensed') return styles.statusPartial;
    return styles.statusPending;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Prescription Management</h1>
          <p className={styles.details}>Review e-prescriptions sent by doctors across the hospital.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup}>
          <select 
            className={styles.filterSelect} 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Pending">Pending / Active</option>
            <option value="Completed">Completed</option>
            <option value="All">All Prescriptions</option>
          </select>
        </div>

        {loading ? (
          <p>Loading prescriptions...</p>
        ) : prescriptions.length > 0 ? (
          <div className={styles.list}>
            {prescriptions.map(p => (
              <div key={p.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <ClipboardList size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                    {p.medicine_name}
                  </div>
                  <div className={styles.itemSub} style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Rx: {p.dosage} | {p.frequency} | {p.duration}
                  </div>
                  <div className={styles.itemSub}>
                    Patient: {p.profiles?.first_name} {p.profiles?.last_name} | Ph: {p.profiles?.phone_number}
                  </div>
                  <div className={styles.itemSub}>
                    Doctor: Dr. {p.doctors?.first_name} {p.doctors?.last_name}
                  </div>
                  <div className={styles.itemSub} style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Prescribed: {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(p.dispense_status || 'Pending')}`}>
                    {p.dispense_status || 'Pending'}
                  </span>
                  
                  {p.dispensed_quantity > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                      Dispensed: {p.dispensed_quantity}
                    </div>
                  )}
                  
                  {(p.dispense_status === 'Pending' || p.dispense_status === 'Partially Dispensed' || !p.dispense_status) && (
                    <div className={styles.actions}>
                      <a href="/pharmacy/dispensing" className={styles.btnPrimary} style={{ textDecoration: 'none' }}>
                        Go to Dispensing
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No prescriptions found for this filter.</p>
        )}
      </div>
    </div>
  );
}
