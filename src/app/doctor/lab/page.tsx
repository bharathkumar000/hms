'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { addChargeToPatient } from '@/utils/billing';
import { Microscope } from 'lucide-react';
import styles from './lab.module.css';

export default function DoctorLab() {
  const { showAlert, showConfirm } = useModal();

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [testCategory, setTestCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    // Fetch patients for dropdown
    const { data: pts } = await supabase.from('profiles').select('id, first_name, last_name').order('first_name');
    if (pts) setPatients(pts);

    // Fetch recent lab orders
    const { data: labs } = await supabase
      .from('lab_orders')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (labs) setRecentOrders(labs);
    
    setLoading(false);
  };

  const handleOrderTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return showAlert('Please select a patient.');

    setSubmitting(true);
    
    const { data: userData } = await supabase.auth.getUser();
    const doctorId = userData?.user?.id;

    const { error } = await supabase
      .from('lab_orders')
      .insert({
        patient_id: selectedPatientId,
        doctor_id: doctorId,
        test_category: testCategory,
        notes: notes,
        status: 'Pending'
      }).select('id').single();

    if (error) {
      showAlert('Failed to save lab order.');
    } else {
      // Automatic Billing: Add lab test charge
      await addChargeToPatient(
        selectedPatientId, 
        null, // No appointment link needed for direct lab order from here
        `Lab Test: ${testCategory}`, 
        'Laboratory', 
        1500 // Assuming base price 1500 INR for lab tests
      );

      setTestCategory('');
      setNotes('');
      fetchInitialData();
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Laboratory Module</h1>
          <p className={styles.details} style={{ marginTop: '0.5rem' }}>Order lab tests and view reports.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Lab Order Form */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Order Lab Test</h2>
          <form onSubmit={handleOrderTest}>
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
                <label className={styles.label}>Test Category</label>
                <select 
                  className={styles.input} 
                  required
                  value={testCategory}
                  onChange={e => setTestCategory(e.target.value)}
                >
                  <option value="">Select test category...</option>
                  <option value="Blood Test (CBC)">Blood Test (CBC)</option>
                  <option value="Urine Analysis">Urine Analysis</option>
                  <option value="Lipid Profile">Lipid Profile</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="MRI Scan">MRI Scan</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="Liver Function Test">Liver Function Test</option>
                </select>
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.label}>Clinical Notes / Instructions</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Special instructions for the laboratory..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Lab Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Lab Orders */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Recent Lab Orders</h2>
          {loading ? (
            <p>Loading...</p>
          ) : recentOrders.length > 0 ? (
            <div className={styles.list}>
              {recentOrders.map(lab => (
                <div key={lab.id} className={styles.listItem} style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Microscope size={18} color="var(--color-primary)" style={{ marginTop: '4px' }} />
                    <div>
                      <div className={styles.patientName}>{lab.test_category}</div>
                      <div className={styles.details}>
                        Patient: {lab.profiles?.first_name} {lab.profiles?.last_name}
                      </div>
                      <div className={styles.details}>
                        Notes: {lab.notes || 'None'}
                      </div>
                    </div>
                  </div>
                  <span className={`${styles.status} ${lab.status === 'Pending' ? styles.statusPending : styles.statusCompleted}`}>
                    {lab.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent lab orders.</p>
          )}
        </div>
      </div>
    </div>
  );
}
