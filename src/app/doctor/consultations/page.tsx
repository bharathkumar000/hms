'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import styles from './consultations.module.css';

export default function DoctorConsultations() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  
  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchPendingConsultations();
  }, []);

  const fetchPendingConsultations = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('appointments')
      .select('*, profiles(first_name, last_name, gender, date_of_birth, blood_group)')
      .eq('appointment_date', today)
      .eq('status', 'Upcoming')
      .order('appointment_time', { ascending: true });

    if (data) setAppointments(data);
    setLoading(false);
  };

  const handleStartConsultation = (apt: any) => {
    setActiveConsultation(apt);
    setDiagnosis('');
    setSymptoms('');
    setTreatment('');
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { data: userData } = await supabase.auth.getUser();
    const doctorId = userData?.user?.id; // Could be demo-user-id

    // Combine notes
    const combinedNotes = `Symptoms: ${symptoms}\n\nTreatment Plan: ${treatment}`;

    // 1. Insert into medical_records
    const { error: recordError } = await supabase
      .from('medical_records')
      .insert({
        patient_id: activeConsultation.patient_id,
        doctor_id: doctorId, // Use logged in doctor ID
        appointment_id: activeConsultation.id,
        diagnosis: diagnosis,
        doctor_notes: combinedNotes,
        record_date: new Date().toISOString().split('T')[0]
      });

    if (recordError) {
      alert('Failed to save medical record.');
      setSubmitting(false);
      return;
    }

    // 2. Update appointment status
    await supabase
      .from('appointments')
      .update({ status: 'Completed' })
      .eq('id', activeConsultation.id);

    setSubmitting(false);
    setActiveConsultation(null);
    fetchPendingConsultations();
  };

  if (activeConsultation) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <button 
              className={styles.btnOutline} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', border: 'none', padding: '0' }}
              onClick={() => setActiveConsultation(null)}
            >
              <ArrowLeft size={20} /> Back to Queue
            </button>
            <h1 className={styles.title}>
              Consultation: {activeConsultation.profiles?.first_name} {activeConsultation.profiles?.last_name}
            </h1>
            <p className={styles.reason}>Reason for visit: {activeConsultation.reason_for_visit}</p>
          </div>
        </header>

        <div className={styles.card}>
          <form onSubmit={handleCompleteConsultation}>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Symptoms & Clinical Observations</label>
                <textarea 
                  className={styles.textarea} 
                  required
                  placeholder="Describe patient symptoms..."
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                />
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.label}>Diagnosis</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required
                  placeholder="Primary diagnosis..."
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                />
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.label}>Treatment Plan & Follow-up</label>
                <textarea 
                  className={styles.textarea} 
                  required
                  placeholder="Prescribed treatments, lifestyle changes, follow-up..."
                  value={treatment}
                  onChange={e => setTreatment(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.btnOutline}
                onClick={() => setActiveConsultation(null)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Complete Consultation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pending Consultations</h1>
          <p className={styles.reason}>Patients waiting in queue today.</p>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading queue...</p>
        ) : appointments.length > 0 ? (
          <div className={styles.list}>
            {appointments.map(apt => (
              <div key={apt.id} className={styles.listItem}>
                <div>
                  <div className={styles.patientName}>
                    {apt.profiles?.first_name} {apt.profiles?.last_name}
                  </div>
                  <div className={styles.reason}>Time: {apt.appointment_time} | {apt.reason_for_visit}</div>
                </div>
                <button 
                  className={styles.btnPrimary}
                  onClick={() => handleStartConsultation(apt)}
                >
                  <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>
                  Start Consultation
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No pending consultations. Great job!</p>
        )}
      </div>
    </div>
  );
}
