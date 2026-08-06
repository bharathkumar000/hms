import { useModal } from '@/components/ModalProvider';
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ListOrdered, Plus } from 'lucide-react';
import styles from './queue.module.css';

export default function ReceptionQueue() {
  const { showAlert, showConfirm } = useModal();

  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Form State
  const [selectedAptId, setSelectedAptId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('patient_queue')
      .select('*, profiles(first_name, last_name), doctors(first_name, last_name, specialization)')
      .gte('check_in_time', `${today}T00:00:00Z`)
      .order('check_in_time', { ascending: true });

    if (data) setQueue(data);
    setLoading(false);
  };

  const openCheckInModal = async () => {
    // Fetch today's upcoming appointments
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('appointments')
      .select('*, profiles(first_name, last_name), doctors(first_name, last_name)')
      .eq('appointment_date', today)
      .eq('status', 'Upcoming')
      .order('appointment_time', { ascending: true });
    
    if (data) setAppointments(data);
    setShowModal(true);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const apt = appointments.find(a => a.id === selectedAptId);
    if (!apt) return;

    // Generate Token (e.g. T-1, T-2)
    const token = `T-${queue.length + 1}`;

    const { error } = await supabase.from('patient_queue').insert({
      patient_id: apt.patient_id,
      appointment_id: apt.id,
      doctor_id: apt.doctor_id,
      token_number: token,
      status: 'Waiting'
    });

    if (error) {
      showAlert('Failed to check in: ' + error.message);
    } else {
      setShowModal(false);
      fetchQueue();
      setSelectedAptId('');
    }
    setSubmitting(false);
  };

  const updateQueueStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('patient_queue').update({ status: newStatus }).eq('id', id);
    if (!error) fetchQueue();
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'In Consultation': return styles.statusInConsultation;
      case 'Completed': return styles.statusCompleted;
      case 'Skipped': return styles.statusSkipped;
      default: return styles.statusWaiting;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Live Queue Management</h1>
          <p className={styles.details}>Manage patient check-ins and live queue.</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCheckInModal}>
          <Plus size={18} /> Check-in Patient
        </button>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading queue...</p>
        ) : queue.length > 0 ? (
          <div className={styles.list}>
            {queue.map(q => (
              <div key={q.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <ListOrdered size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                    Token: {q.token_number} - {q.profiles?.first_name} {q.profiles?.last_name}
                  </div>
                  <div className={styles.itemSub}>
                    Doctor: Dr. {q.doctors?.first_name} {q.doctors?.last_name}
                  </div>
                  <div className={styles.itemSub}>
                    Check-in Time: {new Date(q.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(q.status)}`}>
                    {q.status}
                  </span>
                  {q.status === 'Waiting' && (
                    <div className={styles.actions}>
                      <button className={styles.btnOutline} onClick={() => updateQueueStatus(q.id, 'In Consultation')}>
                        Call Patient
                      </button>
                      <button className={`${styles.btnOutline} ${styles.btnDanger}`} onClick={() => updateQueueStatus(q.id, 'Skipped')}>
                        Skip
                      </button>
                    </div>
                  )}
                  {q.status === 'In Consultation' && (
                    <div className={styles.actions}>
                      <button className={styles.btnOutline} onClick={() => updateQueueStatus(q.id, 'Completed')}>
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No patients currently in queue.</p>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Patient Check-in</h2>
            <form onSubmit={handleCheckIn}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Appointment</label>
                <select className={styles.input} required value={selectedAptId} onChange={e => setSelectedAptId(e.target.value)}>
                  <option value="">Select Appointment...</option>
                  {appointments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.appointment_time} - {a.profiles?.first_name} {a.profiles?.last_name} (Dr. {a.doctors?.last_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Checking in...' : 'Generate Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
