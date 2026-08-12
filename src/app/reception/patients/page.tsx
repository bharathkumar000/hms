'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { User, Plus } from 'lucide-react';
import styles from './patients.module.css';

export default function ReceptionPatients() {
  const { showAlert, showConfirm } = useModal();

  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
          p.phone_number?.includes(searchQuery) ||
          p.id?.toLowerCase().includes(lowerQ)
        )
      );
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*, admissions(status, admission_date, doctors(first_name, last_name), beds(bed_number, rooms(room_number, wards(ward_name))))')
      .order('created_at', { ascending: false });

    if (data) {
      setPatients(data);
      setFilteredPatients(data);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Patient Directory</h1>
          <p className={styles.details}>Search and manage patient records.</p>
        </div>
        <Link href="/reception/registration" className={styles.btnPrimary}>
          <Plus size={18} /> Register New Patient
        </Link>
      </header>

      <div className={styles.card}>
        <input 
          type="text" 
          placeholder="Search by UHID, Name, or Phone..." 
          className={styles.searchBar}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        {loading ? (
          <p>Loading directory...</p>
        ) : filteredPatients.length > 0 ? (
          <div className={styles.list}>
            {filteredPatients.map(patient => {
              const activeAdmission = patient.admissions?.find((a: any) => a.status === 'Admitted');
              
              return (
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
                        UHID: {patient.id.substring(0,8).toUpperCase()} | Phone: {patient.phone_number || 'N/A'} | DOB: {patient.date_of_birth || 'N/A'}
                      </div>
                      {activeAdmission && (
                        <div className={styles.details} style={{ marginTop: '0.25rem', color: '#166534', fontWeight: '500' }}>
                          Admitted: {new Date(activeAdmission.admission_date).toLocaleDateString()} | Dr. {activeAdmission.doctors?.first_name} {activeAdmission.doctors?.last_name}
                          {activeAdmission.beds && ` | Ward ${activeAdmission.beds.rooms?.wards?.ward_name}, Rm ${activeAdmission.beds.rooms?.room_number}, Bed ${activeAdmission.beds.bed_number}`}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button className={styles.btnOutline} onClick={() => showAlert('Editing patient functionality to be implemented as needed.')}>
                    Edit Profile
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No patients found matching your search.</p>
        )}
      </div>
    </div>
  );
}
