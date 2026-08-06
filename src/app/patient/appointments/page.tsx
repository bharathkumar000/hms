'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { addChargeToPatient } from '@/utils/billing';
import styles from './appointments.module.css';

export default function AppointmentsPage() {
  const { showAlert, showConfirm } = useModal();

  const supabase = createClient();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New appointment form state
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  const fetchAppointments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('appointments')
        .select('*, doctors(first_name, last_name, specialization)')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false });
      
      if (data) setAppointments(data);
    }
  };

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*');
    if (data) setDoctors(data);
  };

  useEffect(() => {
    Promise.all([fetchAppointments(), fetchDoctors()]).then(() => setLoading(false));
  }, [supabase]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && doctorId && date && time) {
      // First ensure the user has a profile, as appointments table references it
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!profile) {
        showAlert('Please complete and save your Profile first before booking an appointment.');
        return;
      }

      const { error } = await supabase.from('appointments').insert({
        patient_id: user.id,
        doctor_id: doctorId,
        appointment_date: date,
        appointment_time: time,
        reason_for_visit: reason,
        status: 'Upcoming'
      }).select('id').single();
      
      if (error) {
        console.error('Error booking appointment:', error);
        showAlert(`Error booking appointment: ${error.message}`);
        return;
        return;
      }
      
      // Automatic Billing: Add consultation charge
      await addChargeToPatient(
        user.id, 
        error ? null : (await supabase.from('appointments').select('id').eq('patient_id', user.id).order('created_at', { ascending: false }).limit(1).single()).data?.id, // Note: the insert .select() above is better but since we didn't destructure data, let's just fetch it or we can change destructuring.
        'General Consultation', 
        'Consultation', 
        500 // Assuming 500 INR consultation fee
      );

      setIsModalOpen(false);
      setDoctorId('');
      setDate('');
      setTime('');
      setReason('');
      fetchAppointments();
    }
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
        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
          Book Appointment
        </button>
      </div>

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
                    <button 
                      className={`${styles.btnOutline} ${styles.btnDanger}`}
                      onClick={() => handleCancel(apt.id)}
                    >
                      Cancel
                    </button>
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
            <h2 className={styles.modalTitle}>Book Appointment</h2>
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
                <button type="button" className={styles.btnOutline} onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Book Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
