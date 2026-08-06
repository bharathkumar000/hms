'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserPlus, Calendar, Info } from 'lucide-react';
import styles from './doctors.module.css';

export default function ReceptionDoctors() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    // Fetch doctors along with their availability and leave status
    const { data } = await supabase
      .from('doctors')
      .select('*, doctor_availability(*), leave_requests(*)')
      .order('first_name', { ascending: true });

    if (data) {
      setDoctors(data);
    }
    setLoading(false);
  };

  const isDoctorOnLeave = (leaveRequests: any[]) => {
    if (!leaveRequests || leaveRequests.length === 0) return false;
    const today = new Date().toISOString().split('T')[0];
    return leaveRequests.some(lr => 
      lr.status === 'Approved' && 
      lr.start_date <= today && 
      lr.end_date >= today
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Doctors & Departments</h1>
          <p className={styles.details}>View doctor availability and department schedules.</p>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading doctors...</p>
        ) : doctors.length > 0 ? (
          <div className={styles.list}>
            {doctors.map(doctor => {
              const onLeave = isDoctorOnLeave(doctor.leave_requests);
              
              return (
                <div key={doctor.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </div>
                    <div className={styles.itemSub} style={{ fontWeight: 500 }}>
                      Department: {doctor.specialization}
                    </div>
                    <div className={styles.itemSub} style={{ marginTop: '0.25rem' }}>
                      <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Consultation Hours: {doctor.consultation_fee ? `Fee: $${doctor.consultation_fee}` : 'Check with admin'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span className={`${styles.status} ${onLeave ? styles.statusCancelled : styles.statusCompleted}`}>
                      {onLeave ? 'On Leave' : 'Available'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No doctors found.</p>
        )}
      </div>
    </div>
  );
}
