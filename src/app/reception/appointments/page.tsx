'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { addChargeToPatient } from '@/utils/billing';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import styles from './appointments.module.css';

export default function ReceptionAppointments() {
  const { showAlert, showConfirm } = useModal();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState('Today');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Form State
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    let query = supabase
      .from('appointments')
      .select('*, profiles(first_name, last_name), doctors(first_name, last_name, specialization)')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    const today = new Date().toISOString().split('T')[0];

    if (filter === 'Today') {
      query = query.eq('appointment_date', today);
    } else if (filter === 'Upcoming') {
      query = query.gte('appointment_date', today).eq('status', 'Upcoming');
    } else if (filter === 'Completed') {
      query = query.eq('status', 'Completed');
    }

    const { data } = await query;
    if (data) setAppointments(data);
    setLoading(false);
  };

  const openBookModal = async () => {
    // Fetch lookup data
    const [pts, docs] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').order('first_name'),
      supabase.from('doctors').select('id, first_name, last_name, specialization').order('first_name')
    ]);
    
    if (pts.data) setPatients(pts.data);
    if (docs.data) setDoctors(docs.data);
    
    setShowModal(true);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: date,
      appointment_time: time,
      reason_for_visit: reason,
      status: 'Upcoming'
    }).select('id').single();

    if (error) {
      showAlert('Failed to book appointment: ' + error.message);
    } else {
      // Automatic Billing: Add consultation charge
      await addChargeToPatient(
        patientId, 
        data?.id, 
        'General Consultation', 
        'Consultation', 
        500 // Assuming 500 INR consultation fee
      );

      setShowModal(false);
      fetchAppointments();
      setPatientId('');
      setDoctorId('');
      setDate('');
      setTime('');
      setReason('');
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (!error) fetchAppointments();
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Completed': return styles.statusCompleted;
      case 'Cancelled': return styles.statusCancelled;
      default: return styles.statusUpcoming;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.details}>Manage and book patient appointments.</p>
        </div>
        <button className={styles.btnPrimary} onClick={openBookModal}>
          <Plus size={18} /> Book Appointment
        </button>
      </header>

      <div className={styles.filterGroup}>
        <select className={styles.filterSelect} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="Today">Today</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="All">All Appointments</option>
        </select>
      </div>

      <div className={styles.card}>
        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length > 0 ? (
          <div className={styles.list}>
            {appointments.map(apt => (
              <div key={apt.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    {apt.profiles?.first_name} {apt.profiles?.last_name}
                  </div>
                  <div className={styles.itemSub}>
                    Doctor: Dr. {apt.doctors?.first_name} {apt.doctors?.last_name} ({apt.doctors?.specialization})
                  </div>
                  <div className={styles.itemSub}>
                    Reason: {apt.reason_for_visit}
                  </div>
                  <div className={styles.dateTime} style={{ marginTop: '0.25rem' }}>
                    <CalendarIcon size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/>
                    {apt.appointment_date} at {apt.appointment_time}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(apt.status)}`}>
                    {apt.status}
                  </span>
                  {apt.status === 'Upcoming' && (
                    <div className={styles.actions}>
                      <button className={styles.btnOutline} onClick={() => showAlert('Reschedule not yet implemented.')}>
                        Reschedule
                      </button>
                      <button className={`${styles.btnOutline} ${styles.btnDanger}`} onClick={() => updateStatus(apt.id, 'Cancelled')}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No appointments found for this filter.</p>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Book Appointment</h2>
            <form onSubmit={handleBookAppointment}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Patient</label>
                <select className={styles.input} required value={patientId} onChange={e => setPatientId(e.target.value)}>
                  <option value="">Select Patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Doctor</label>
                <select className={styles.input} required value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                  <option value="">Select Doctor...</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} ({d.specialization})</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Date</label>
                <input type="date" className={styles.input} required value={date} onChange={e => setDate(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Time</label>
                <input type="time" className={styles.input} required value={time} onChange={e => setTime(e.target.value)} />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Reason</label>
                <input type="text" className={styles.input} required value={reason} onChange={e => setReason(e.target.value)} />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
