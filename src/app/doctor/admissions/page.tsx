'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bed, ArrowRight, CheckCircle } from 'lucide-react';
import styles from './admissions.module.css';

export default function DoctorAdmissions() {
  const { showAlert } = useModal();

  const [admissions, setAdmissions] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action Modals State
  const [transferAdmission, setTransferAdmission] = useState<any>(null);
  const [dischargeAdmission, setDischargeAdmission] = useState<any>(null);

  // Transfer Form State
  const [toWardId, setToWardId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Discharge Form State
  const [dischargeDate, setDischargeDate] = useState('');
  const [dischargeNotes, setDischargeNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch wards for transfer dropdown
    const { data: w } = await supabase.from('wards').select('*');
    if (w) setWards(w);

    // Fetch active admissions
    const { data: adm } = await supabase
      .from('admissions')
      .select('*, profiles(first_name, last_name, phone_number), beds(bed_number, rooms(room_number, wards(id, name)))')
      .eq('status', 'Admitted')
      .order('admission_date', { ascending: false });
    
    if (adm) setAdmissions(adm);
    setLoading(false);
  };

  const handleTransferRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('ward_transfer_requests')
      .insert({
        admission_id: transferAdmission.id,
        patient_id: transferAdmission.patient_id,
        doctor_id: userData?.user?.id,
        from_ward_id: transferAdmission.beds?.rooms?.wards?.id,
        to_ward_id: toWardId,
        reason: transferReason
      });

    if (error) {
      showAlert(`Failed to request transfer: ${error.message}`);
    } else {
      showAlert('Transfer request submitted successfully.');
      setTransferAdmission(null);
      setToWardId('');
      setTransferReason('');
    }
    setSubmitting(false);
  };

  const handleDischargeRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('discharge_recommendations')
      .insert({
        admission_id: dischargeAdmission.id,
        patient_id: dischargeAdmission.patient_id,
        doctor_id: userData?.user?.id,
        recommended_discharge_date: dischargeDate,
        discharge_notes: dischargeNotes
      });

    if (error) {
      showAlert(`Failed to recommend discharge: ${error.message}`);
    } else {
      showAlert('Discharge recommendation submitted successfully.');
      setDischargeAdmission(null);
      setDischargeDate('');
      setDischargeNotes('');
    }
    setSubmitting(false);
  };

  if (transferAdmission) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Request Ward Transfer</h1>
            <p className={styles.details}>Patient: {transferAdmission.profiles?.first_name} {transferAdmission.profiles?.last_name}</p>
          </div>
        </header>

        <div className={styles.card}>
          <form onSubmit={handleTransferRequest}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Current Ward</label>
                <div className={styles.input} style={{ backgroundColor: '#f9fafb' }}>
                  {transferAdmission.beds?.rooms?.wards?.name} - Room {transferAdmission.beds?.rooms?.room_number}, Bed {transferAdmission.beds?.bed_number}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Transfer To Ward</label>
                <select 
                  className={styles.input} 
                  required
                  value={toWardId}
                  onChange={e => setToWardId(e.target.value)}
                >
                  <option value="">Select destination ward...</option>
                  {wards.filter(w => w.id !== transferAdmission.beds?.rooms?.wards?.id).map(w => (
                    <option key={w.id} value={w.id}>{w.name} (Capacity: {w.capacity})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Reason for Transfer</label>
                <textarea 
                  className={styles.textarea} 
                  required
                  placeholder="e.g. Condition stabilized, transferring out of ICU."
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.btnOutline}
                onClick={() => setTransferAdmission(null)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Transfer Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (dischargeAdmission) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Recommend Discharge</h1>
            <p className={styles.details}>Patient: {dischargeAdmission.profiles?.first_name} {dischargeAdmission.profiles?.last_name}</p>
          </div>
        </header>

        <div className={styles.card}>
          <form onSubmit={handleDischargeRecommendation}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Recommended Discharge Date</label>
                <input 
                  type="date"
                  className={styles.input} 
                  required
                  value={dischargeDate}
                  onChange={e => setDischargeDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Discharge Notes / Medications</label>
                <textarea 
                  className={styles.textarea} 
                  required
                  placeholder="e.g. Cleared for discharge. Continue antibiotics for 5 days."
                  value={dischargeNotes}
                  onChange={e => setDischargeNotes(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.btnOutline}
                onClick={() => setDischargeAdmission(null)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Recommendation'}
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
          <h1 className={styles.title}>Admission Management</h1>
          <p className={styles.details} style={{ marginTop: '0.5rem' }}>View admitted patients and manage transfers/discharges.</p>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading admitted patients...</p>
        ) : admissions.length > 0 ? (
          <div className={styles.list}>
            {admissions.map(adm => (
              <div key={adm.id} className={styles.listItem}>
                <div>
                  <div className={styles.patientName}>
                    {adm.profiles?.first_name} {adm.profiles?.last_name}
                  </div>
                  <div className={styles.details}>
                    <Bed size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/>
                    {adm.beds?.rooms?.wards?.name} - Room {adm.beds?.rooms?.room_number}, Bed {adm.beds?.bed_number}
                  </div>
                  <div className={styles.details}>
                    Admission Date: {new Date(adm.admission_date).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className={styles.btnOutline}
                    onClick={() => setTransferAdmission(adm)}
                  >
                    <ArrowRight size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    Transfer
                  </button>
                  <button 
                    className={styles.btnOutline}
                    onClick={() => setDischargeAdmission(adm)}
                  >
                    <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    Discharge
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No patients currently admitted.</p>
        )}
      </div>
    </div>
  );
}
