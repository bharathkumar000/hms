'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { addChargeToPatient } from '@/utils/billing';
import styles from './appointments.module.css';

export default function AppointmentsPage() {
  const { showAlert, showConfirm } = useModal();
  const searchParams = useSearchParams();
  
  const supabase = createClient();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [liveQueue, setLiveQueue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  
  // New appointment form state
  const [isRescheduling, setIsRescheduling] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  const fetchAppointments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || (await supabase.auth.getUser()).data.user;
    
    if (user) {
      setActiveUserId(user.id);
      const { data } = await supabase
        .from('appointments')
        .select('*, doctors(first_name, last_name, specialization)')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false });
      
      let finalAppointments = data || [];
      
      // If demo mode, merge in simulated appointments from local storage
      if (user.id === 'demo-user-id') {
        const demoApts = JSON.parse(localStorage.getItem('demo_appointments') || '[]');
        finalAppointments = [...demoApts, ...finalAppointments].sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
      }
      
      if (finalAppointments.length >= 0) setAppointments(finalAppointments);
    }
  };

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*');
    if (data) setDoctors(data);
  };

  const fetchLiveQueue = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || (await supabase.auth.getUser()).data.user;
    
    if (user) {
      // Get today's date in string format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('patient_queue')
        .select('*, doctors(first_name, last_name)')
        .eq('patient_id', user.id)
        .gte('created_at', today) // Simplistic check for today's queue
        .in('status', ['Waiting', 'In Progress'])
        .limit(1)
        .single();
      
      if (data) setLiveQueue(data);
      else setLiveQueue(null);
    }
  };

  useEffect(() => {
    Promise.all([fetchAppointments(), fetchDoctors(), fetchLiveQueue()]).then(() => {
      setLoading(false);
      if (searchParams.get('action') === 'book') {
        setIsModalOpen(true);
      }
    });
  }, [supabase, searchParams]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let uid = activeUserId;
      if (!uid) {
        const { data: { session } } = await supabase.auth.getSession();
        uid = session?.user?.id || (await supabase.auth.getUser()).data.user?.id;
      }
      
      if (!uid) {
        showAlert('User not authenticated. Please refresh the page.');
        setIsSubmitting(false);
        return;
      }
      
      if (doctorId && date && time) {
        // First ensure the user has a profile, as appointments table references it
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', uid).single();
        if (!profile) {
          showAlert('Please complete and save your Profile first before booking an appointment.');
          setIsSubmitting(false);
          return;
        }

        if (uid === 'demo-user-id') {
          // Simulate Demo Booking in Local Storage to avoid PostgreSQL UUID & RLS errors
          const selectedDoc = doctors.find(d => d.id === doctorId);
          const newApt = {
            id: 'demo-apt-' + Date.now(),
            patient_id: uid,
            doctor_id: doctorId,
            appointment_date: date,
            appointment_time: time,
            reason_for_visit: reason,
            status: 'Upcoming',
            doctors: selectedDoc
          };
          
          const existing = JSON.parse(localStorage.getItem('demo_appointments') || '[]');
          localStorage.setItem('demo_appointments', JSON.stringify([newApt, ...existing]));
          
          setIsModalOpen(false);
          setIsRescheduling(null);
          setDoctorId('');
          setDate('');
          setTime('');
          setReason('');
          await fetchAppointments();
          setIsSubmitting(false);
          return;
        }

        if (isRescheduling) {
          // Reschedule existing
          const { error } = await supabase.from('appointments').update({
            doctor_id: doctorId,
            appointment_date: date,
            appointment_time: time,
            reason_for_visit: reason,
          }).eq('id', isRescheduling);
          
          if (error) {
            showAlert(`Error rescheduling: ${error.message}`);
            setIsSubmitting(false);
            return;
          }
        } else {
          // Book new
          const { error } = await supabase.from('appointments').insert({
            patient_id: uid,
            doctor_id: doctorId,
            appointment_date: date,
            appointment_time: time,
            reason_for_visit: reason,
            status: 'Upcoming'
          });
          
          if (error) {
            showAlert(`Error booking appointment: ${error.message}`);
            setIsSubmitting(false);
            return;
          }
          
          // Automatic Billing
          await addChargeToPatient(
            uid, 
            null, 
            'General Consultation', 
            'Consultation', 
            500
          );
        }

        setIsModalOpen(false);
        setIsRescheduling(null);
        setDoctorId('');
        setDate('');
        setTime('');
        setReason('');
        await fetchAppointments();
      } else {
        showAlert('Please fill in all required fields.');
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      showAlert(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReschedule = (apt: any) => {
    setIsRescheduling(apt.id);
    setDoctorId(apt.doctor_id);
    setDate(apt.appointment_date);
    setTime(apt.appointment_time);
    setReason(apt.reason_for_visit || '');
    setIsModalOpen(true);
  };

  const handleCancel = async (id: string) => {
    if (await showConfirm('Are you sure you want to cancel this appointment?')) {
      await supabase
        .from('appointments')
        .update({ status: 'Cancelled' })
        .eq('id', id);
      fetchAppointments();
    }
  };

  if (loading) return <div>Loading appointments...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Appointments</h1>
        <button className={styles.btnPrimary} onClick={() => { setIsRescheduling(null); setIsModalOpen(true); }}>
          Book Appointment
        </button>
      </div>

      {liveQueue && (
        <div className={styles.card} style={{ marginBottom: '2rem', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#b45309', marginBottom: '0.5rem' }}>Live Queue Status (Today)</h2>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#92400e', fontSize: '0.9rem' }}>Doctor</p>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Dr. {liveQueue.doctors?.first_name} {liveQueue.doctors?.last_name}</p>
            </div>
            <div>
              <p style={{ color: '#92400e', fontSize: '0.9rem' }}>Token Number</p>
              <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#b45309' }}>{liveQueue.queue_number}</p>
            </div>
            <div>
              <p style={{ color: '#92400e', fontSize: '0.9rem' }}>Status</p>
              <span className={styles.status} style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>{liveQueue.status}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <div className={styles.appointmentList}>
            {appointments.map((apt) => (
              <div key={apt.id} className={styles.appointmentItem}>
                <div className={styles.details}>
                  <span className={styles.doctorName}>Dr. {apt.doctors?.first_name} {apt.doctors?.last_name}</span>
                  <span className={styles.specialty}>{apt.doctors?.specialization}</span>
                  <span className={styles.dateTime}>
                    {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Status: <strong>{apt.status}</strong>
                  </span>
                </div>
                
                <div className={styles.actions}>
                  {apt.status === 'Upcoming' && (
                    <>
                      <button 
                        className={styles.btnOutline}
                        onClick={() => handleOpenReschedule(apt)}
                      >
                        Reschedule
                      </button>
                      <button 
                        className={`${styles.btnOutline} ${styles.btnDanger}`}
                        onClick={() => handleCancel(apt.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>{isRescheduling ? 'Reschedule Appointment' : 'Book Appointment'}</h2>
            <form onSubmit={handleBook}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Doctor</label>
                <select 
                  className={styles.input}
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Doctor --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.first_name} {doc.last_name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Date</label>
                <input 
                  type="date" 
                  className={styles.input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Time</label>
                <input 
                  type="time" 
                  className={styles.input}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Reason for Visit (Optional)</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnOutline} onClick={() => { setIsModalOpen(false); setIsRescheduling(null); }}>
                  Close
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? 'Booking...' : (isRescheduling ? 'Save Changes' : 'Book Now')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
