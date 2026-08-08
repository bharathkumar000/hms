'use client';
import { useModal } from '@/components/ModalProvider';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClipboardList, Plus, LogOut } from 'lucide-react';
import styles from './admissions.module.css';

export default function AdminAdmissions() {
  const { showAlert } = useModal();
  const supabase = createClient();

  const [admissions, setAdmissions] = useState<any[]>([]);
  const [filter, setFilter] = useState('Active');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const [wards, setWards] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  
  // Selection States
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  
  // Form State
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [bedId, setBedId] = useState('');
  const [headNurse, setHeadNurse] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmissions();
  }, [filter]);

  const fetchAdmissions = async () => {
    setLoading(true);
    let query = supabase
      .from('admissions')
      .select('*, profiles(first_name, last_name), doctors(first_name, last_name), beds(bed_number, rooms(room_number, wards(name)))')
      .order('admission_date', { ascending: false });

    if (filter === 'Active') {
      query = query.eq('status', 'Admitted');
    } else if (filter === 'Discharged') {
      query = query.eq('status', 'Discharged');
    }

    const { data } = await query;
    if (data) setAdmissions(data);
    setLoading(false);
  };

  const openAdmitModal = async () => {
    // Fetch lookup data
    const [pts, docs, wds, rms, bds] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').order('first_name'),
      supabase.from('doctors').select('id, first_name, last_name, specialization').order('first_name'),
      supabase.from('wards').select('id, name, type'),
      supabase.from('rooms').select('id, ward_id, room_number'),
      supabase.from('beds').select('id, room_id, bed_number')
    ]);
    
    if (pts.data) setPatients(pts.data);
    if (docs.data) setDoctors(docs.data);
    if (wds.data) setWards(wds.data);
    if (rms.data) setRooms(rms.data);
    if (bds.data) setBeds(bds.data);
    
    setSelectedWard('');
    setSelectedRoom('');
    setBedId('');
    setShowModal(true);
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('admissions').insert({
      patient_id: patientId,
      assigned_doctor_id: doctorId,
      bed_id: bedId,
      head_nurse_name: headNurse,
      reason_for_admission: reason,
      status: 'Admitted'
    });

    if (error) {
      showAlert('Failed to admit patient: ' + error.message);
    } else {
      showAlert('Patient admitted successfully.');
      setShowModal(false);
      fetchAdmissions();
      // Reset Form
      setPatientId('');
      setDoctorId('');
      setBedId('');
      setHeadNurse('');
      setReason('');
    }
    setSubmitting(false);
  };

  const handleDischarge = async (id: string) => {
    const { error } = await supabase.from('admissions').update({ 
      status: 'Discharged', 
      actual_discharge_date: new Date().toISOString() 
    }).eq('id', id);
    
    if (error) {
      showAlert('Error discharging patient: ' + error.message);
    } else {
      showAlert('Patient discharged.');
      fetchAdmissions();
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Discharged': return styles.statusCompleted;
      case 'Transferred': return styles.statusCancelled;
      default: return styles.statusUpcoming;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admissions Management</h1>
          <p className={styles.details}>Admit patients and allocate beds.</p>
        </div>
        <button className={styles.btnPrimary} onClick={openAdmitModal}>
          <Plus size={18} /> Admit Patient
        </button>
      </header>

      <div className={styles.filterGroup}>
        <select className={styles.filterSelect} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="Active">Currently Admitted</option>
          <option value="Discharged">Discharged</option>
          <option value="All">All Admissions</option>
        </select>
      </div>

      <div className={styles.card}>
        {loading ? (
          <p>Loading admissions...</p>
        ) : admissions.length > 0 ? (
          <div className={styles.list}>
            {admissions.map(adm => (
              <div key={adm.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    {adm.profiles?.first_name} {adm.profiles?.last_name}
                  </div>
                  <div className={styles.itemSub}>
                    Doctor: Dr. {adm.doctors?.first_name} {adm.doctors?.last_name}
                  </div>
                  <div className={styles.itemSub}>
                    Location: Ward {adm.beds?.rooms?.wards?.name}, Room {adm.beds?.rooms?.room_number}, Bed {adm.beds?.bed_number}
                  </div>
                  <div className={styles.dateTime} style={{ marginTop: '0.25rem' }}>
                    <ClipboardList size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/>
                    Admitted: {new Date(adm.admission_date).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(adm.status)}`}>
                    {adm.status}
                  </span>
                  {adm.status === 'Admitted' && (
                    <div className={styles.actions}>
                      <button className={`${styles.btnOutline} ${styles.btnDanger}`} onClick={() => handleDischarge(adm.id)}>
                        <LogOut size={14} style={{ display: 'inline', marginRight: '4px' }} /> Discharge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No admissions found.</p>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Admit New Patient</h2>
            <form onSubmit={handleAdmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Patient</label>
                <select className={styles.input} required value={patientId} onChange={e => setPatientId(e.target.value)}>
                  <option value="">Select Patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Assign Doctor</label>
                <select className={styles.input} required value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                  <option value="">Select Doctor...</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} ({d.specialization})</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Select Ward & Floor</label>
                <select className={styles.input} required value={selectedWard} onChange={e => { setSelectedWard(e.target.value); setSelectedRoom(''); setBedId(''); }}>
                  <option value="">Select Ward...</option>
                  {wards.length === 0 && <option value="" disabled>No wards available</option>}
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Select Room</label>
                <select className={styles.input} required disabled={!selectedWard} value={selectedRoom} onChange={e => { setSelectedRoom(e.target.value); setBedId(''); }}>
                  <option value="">Select Room...</option>
                  {rooms.filter(r => r.ward_id === selectedWard).map(r => (
                    <option key={r.id} value={r.id}>Room {r.room_number}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Assign Bed</label>
                <select className={styles.input} required disabled={!selectedRoom} value={bedId} onChange={e => setBedId(e.target.value)}>
                  <option value="">Select Bed...</option>
                  {beds.filter(b => b.room_id === selectedRoom).map(b => (
                    <option key={b.id} value={b.id}>Bed {b.bed_number}</option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Head Nurse</label>
                <input type="text" className={styles.input} required value={headNurse} onChange={e => setHeadNurse(e.target.value)} placeholder="e.g. Nurse Sarah" />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Reason for Admission</label>
                <input type="text" className={styles.input} required value={reason} onChange={e => setReason(e.target.value)} />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Admitting...' : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
