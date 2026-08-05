'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Pill, Search } from 'lucide-react';
import styles from './prescriptions.module.css';

export default function DoctorPrescriptions() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    // Fetch patients for dropdown
    const { data: pts } = await supabase.from('profiles').select('id, first_name, last_name').order('first_name');
    if (pts) setPatients(pts);

    // Fetch recent prescriptions
    const { data: pres } = await supabase
      .from('prescriptions')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (pres) setRecentPrescriptions(pres);
    
    setLoading(false);
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return alert('Please select a patient.');

    setSubmitting(true);
    
    const { data: userData } = await supabase.auth.getUser();
    const doctorId = userData?.user?.id;

    const { error } = await supabase
      .from('prescriptions')
      .insert({
        patient_id: selectedPatientId,
        doctor_id: doctorId,
        medicine_name: medicineName,
        dosage: dosage,
        frequency: frequency,
        duration: duration,
        status: 'Active'
      });

    if (error) {
      alert('Failed to save prescription.');
    } else {
      setMedicineName('');
      setDosage('');
      setFrequency('');
      setDuration('');
      fetchInitialData();
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>E-Prescription Builder</h1>
          <p className={styles.details} style={{ marginTop: '0.5rem' }}>Create and manage patient prescriptions.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Prescription Form */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Draft New Prescription</h2>
          <form onSubmit={handleCreatePrescription}>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Patient</label>
                <select 
                  className={styles.input} 
                  required
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                >
                  <option value="">Select a patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.label}>Medicine Name / Drug Search</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  value={medicineName}
                  onChange={e => setMedicineName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Dosage Instructions</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required
                  placeholder="e.g. 1 Tablet"
                  value={dosage}
                  onChange={e => setDosage(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Frequency</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required
                  placeholder="e.g. Twice a day (BID)"
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Duration</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required
                  placeholder="e.g. 7 days"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
              </div>

            </div>

            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Issue Prescription'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Prescriptions */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Recent Prescriptions</h2>
          {loading ? (
            <p>Loading...</p>
          ) : recentPrescriptions.length > 0 ? (
            <div className={styles.list}>
              {recentPrescriptions.map(px => (
                <div key={px.id} className={styles.listItem} style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Pill size={18} color="var(--color-primary)" style={{ marginTop: '4px' }} />
                    <div>
                      <div className={styles.patientName}>{px.medicine_name}</div>
                      <div className={styles.details}>
                        Patient: {px.profiles?.first_name} {px.profiles?.last_name}
                      </div>
                      <div className={styles.details}>
                        {px.dosage} | {px.frequency} | {px.duration}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent prescriptions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
