'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Pill, Search } from 'lucide-react';
import styles from './prescriptions.module.css';

export default function DoctorPrescriptions() {
  const { showAlert, showConfirm } = useModal();

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
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
    if (!selectedPatientId) return showAlert('Please select a patient.');

    setSubmitting(true);
    
    const { data: userData } = await supabase.auth.getUser();
    const doctorId = userData?.user?.id;

    let query;
    if (editingId) {
      query = supabase
        .from('prescriptions')
        .update({
          patient_id: selectedPatientId,
          medicine_name: medicineName,
          dosage: dosage,
          frequency: frequency,
          duration: duration
        })
        .eq('id', editingId);
    } else {
      query = supabase
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
    }

    const { error } = await query;

    if (error) {
      showAlert(`Failed to save prescription: ${error.message}`);
    } else {
      setMedicineName('');
      setDosage('');
      setFrequency('');
      setDuration('');
      setEditingId(null);
      fetchInitialData();
    }
    setSubmitting(false);
  };

  const handleEdit = (px: any) => {
    setEditingId(px.id);
    setSelectedPatientId(px.patient_id);
    setMedicineName(px.medicine_name);
    setDosage(px.dosage);
    setFrequency(px.frequency);
    setDuration(px.duration);
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm('Are you sure you want to delete this prescription?')) {
      const { error } = await supabase.from('prescriptions').delete().eq('id', id);
      if (error) showAlert(`Error deleting: ${error.message}`);
      else fetchInitialData();
    }
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
              {editingId && (
                <button 
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => {
                    setEditingId(null);
                    setMedicineName('');
                    setDosage('');
                    setFrequency('');
                    setDuration('');
                  }}
                >
                  Cancel Edit
                </button>
              )}
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingId ? 'Update Prescription' : 'Issue Prescription'}
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
                  <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                    <Pill size={18} color="var(--color-primary)" style={{ marginTop: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <div className={styles.patientName}>{px.medicine_name}</div>
                      <div className={styles.details}>
                        Patient: {px.profiles?.first_name} {px.profiles?.last_name}
                      </div>
                      <div className={styles.details}>
                        {px.dosage} | {px.frequency} | {px.duration}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={() => handleEdit(px)} className={styles.btnOutline} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Edit</button>
                    <button onClick={() => handleDelete(px.id)} className={styles.btnOutline} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#dc2626' }}>Delete</button>
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
