'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Search, User } from 'lucide-react';
import styles from './patients.module.css';

export default function DoctorPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [activePatient, setActivePatient] = useState<any>(null);
  const [medicalHistory, setMedicalHistory] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      setFilteredPatients(
        patients.filter(p => 
          p.first_name?.toLowerCase().includes(lowerQ) || 
          p.last_name?.toLowerCase().includes(lowerQ) ||
          p.phone_number?.includes(searchQuery)
        )
      );
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    // Fetch all patients for demo purposes
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('first_name', { ascending: true });

    if (data) {
      setPatients(data);
      setFilteredPatients(data);
    }
    setLoading(false);
  };

  const loadPatientDetails = async (patient: any) => {
    setActivePatient(patient);
    
    const [histReq, presReq, labReq] = await Promise.all([
      supabase.from('medical_records').select('*').eq('patient_id', patient.id).order('record_date', { ascending: false }),
      supabase.from('prescriptions').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
      supabase.from('lab_orders').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false })
    ]);

    if (histReq.data) setMedicalHistory(histReq.data);
    if (presReq.data) setPrescriptions(presReq.data);
    if (labReq.data) setLabOrders(labReq.data);
  };

  if (activePatient) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <button 
              className={styles.btnOutline} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', border: 'none', padding: '0' }}
              onClick={() => setActivePatient(null)}
            >
              <ArrowLeft size={20} /> Back to Directory
            </button>
            <h1 className={styles.title}>
              {activePatient.first_name} {activePatient.last_name}
            </h1>
            <p className={styles.details}>
              DOB: {activePatient.date_of_birth || 'N/A'} | Gender: {activePatient.gender || 'N/A'} | Blood Group: {activePatient.blood_group || 'N/A'}
            </p>
          </div>
        </header>

        <div className={styles.grid}>
          {/* Medical History */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Consultation Timeline</h2>
            <div className={styles.list}>
              {medicalHistory.length > 0 ? (
                medicalHistory.map(record => (
                  <div key={record.id} className={styles.listItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div className={styles.patientName}>{record.record_date}: {record.diagnosis}</div>
                    <div className={styles.details} style={{ whiteSpace: 'pre-wrap' }}>{record.doctor_notes}</div>
                  </div>
                ))
              ) : (
                <p className={styles.details}>No past consultations found.</p>
              )}
            </div>
          </div>

          <div>
            {/* Prescriptions */}
            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
              <h2 className={styles.sectionTitle}>Previous Prescriptions</h2>
              <div className={styles.list}>
                {prescriptions.length > 0 ? (
                  prescriptions.map(px => (
                    <div key={px.id} className={styles.listItem}>
                      <div>
                        <div className={styles.patientName}>{px.medicine_name}</div>
                        <div className={styles.details}>{px.dosage} | {px.frequency} | {px.duration}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.details}>No prescriptions found.</p>
                )}
              </div>
            </div>

            {/* Lab Orders */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Lab Reports</h2>
              <div className={styles.list}>
                {labOrders.length > 0 ? (
                  labOrders.map(lab => (
                    <div key={lab.id} className={styles.listItem}>
                      <div>
                        <div className={styles.patientName}>{lab.test_category}</div>
                        <div className={styles.details}>Status: {lab.status}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.details}>No lab reports found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Patient Directory</h1>
          <p className={styles.details} style={{ marginTop: '0.5rem' }}>Search and view patient medical records.</p>
        </div>
      </header>

      <div className={styles.card}>
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className={styles.searchBar}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        {loading ? (
          <p>Loading directory...</p>
        ) : filteredPatients.length > 0 ? (
          <div className={styles.list}>
            {filteredPatients.map(patient => (
              <div key={patient.id} className={styles.listItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'var(--color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div className={styles.patientName}>
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className={styles.details}>
                      Phone: {patient.phone_number || 'N/A'} | DOB: {patient.date_of_birth || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <button 
                  className={styles.btnOutline}
                  onClick={() => loadPatientDetails(patient)}
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No patients found matching your search.</p>
        )}
      </div>
    </div>
  );
}
