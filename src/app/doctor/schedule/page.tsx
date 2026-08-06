import { useModal } from '@/components/ModalProvider';
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Calendar, Filter } from 'lucide-react';
import styles from './schedule.module.css';

export default function DoctorSchedule() {
  const { showAlert, showConfirm } = useModal();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Today'); // Today, Upcoming, All
  const supabase = createClient();

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    let query = supabase
      .from('appointments')
      .select('*, profiles(first_name, last_name, phone_number)')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    const today = new Date().toISOString().split('T')[0];

    if (filter === 'Today') {
      query = query.eq('appointment_date', today);
    } else if (filter === 'Upcoming') {
      query = query.gte('appointment_date', today).eq('status', 'Upcoming');
    }

    const { data } = await query;
    if (data) setAppointments(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) {
      fetchAppointments();
    } else {
      showAlert('Failed to update status');
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Completed': return styles.statusCompleted;
      case 'Cancelled': return styles.statusCancelled;
      default: return styles.statusUpcoming;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Schedule & Appointments</h1>
      </header>

      <div className={styles.filterGroup}>
        <select 
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="Today">Today's Schedule</option>
          <option value="Upcoming">Upcoming Appointments</option>
          <option value="All">All Appointments</option>
        </select>
      </div>

      <div className={styles.card}>
        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length > 0 ? (
          <div className={styles.appointmentList}>
            {appointments.map((apt) => (
              <div key={apt.id} className={styles.appointmentItem}>
                <div className={styles.details}>
                  <div className={styles.patientName}>
                    {apt.profiles?.first_name} {apt.profiles?.last_name}
                  </div>
                  <div className={styles.reason}>{apt.reason_for_visit || 'Consultation'}</div>
                  <div className={styles.dateTime}>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/>
                    {apt.appointment_date} at {apt.appointment_time}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(apt.status)}`}>
                    {apt.status}
                  </span>
                  {apt.status === 'Upcoming' && (
                    <div className={styles.actions}>
                      <button 
                        className={styles.btnOutline}
                        onClick={() => updateStatus(apt.id, 'Completed')}
                      >
                        Mark Complete
                      </button>
                      <button 
                        className={`${styles.btnOutline} ${styles.btnDanger}`}
                        onClick={() => updateStatus(apt.id, 'Cancelled')}
                      >
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
    </div>
  );
}
