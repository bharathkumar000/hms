'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle } from 'lucide-react';
import styles from './emergencies.module.css';

export default function DoctorEmergencies() {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('emergency_cases')
      .select('*, profiles(first_name, last_name, phone_number)')
      .order('arrival_time', { ascending: false });

    if (data) setEmergencies(data);
    setLoading(false);
  };

  const markResolved = async (id: string) => {
    const { error } = await supabase
      .from('emergency_cases')
      .update({ status: 'Resolved' })
      .eq('id', id);

    if (!error) fetchEmergencies();
  };

  const getPriorityClass = (priority: string, status: string) => {
    if (status === 'Resolved') return styles.statusResolved;
    switch (priority) {
      case 'Critical': return styles.statusCritical;
      case 'High': return styles.statusHigh;
      default: return styles.statusMedium;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Emergency Alerts</h1>
          <p className={styles.details} style={{ marginTop: '0.5rem' }}>Active and recent emergency cases.</p>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading emergencies...</p>
        ) : emergencies.length > 0 ? (
          <div className={styles.list}>
            {emergencies.map((em) => (
              <div key={em.id} className={styles.listItem}>
                <div>
                  <div className={styles.patientName}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: em.status === 'Resolved' ? '#166534' : '#dc2626' }}/>
                    {em.profiles?.first_name} {em.profiles?.last_name}
                  </div>
                  <div className={styles.details}>
                    Arrival: {new Date(em.arrival_time).toLocaleString()} | Dept: {em.department}
                  </div>
                  <div className={styles.details}>
                    <strong>Notes:</strong> {em.notes}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getPriorityClass(em.priority, em.status)}`}>
                    {em.status === 'Resolved' ? 'Resolved' : em.priority}
                  </span>
                  
                  {em.status === 'Active' && (
                    <button 
                      className={styles.btnOutline}
                      onClick={() => markResolved(em.id)}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No emergency cases at the moment.</p>
        )}
      </div>
    </div>
  );
}
