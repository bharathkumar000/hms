import { createClient } from '@/utils/supabase/server';
import styles from './records.module.css';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function RecordsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Fetch medical records and attached documents
  const { data: records } = await supabase
    .from('medical_records')
    .select(`
      *,
      doctors(first_name, last_name, specialization),
      documents(*)
    `)
    .eq('patient_id', user.id)
    .order('record_date', { ascending: false });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Medical Records</h1>
      </div>

      <div className={styles.card}>
        {(!records || records.length === 0) ? (
          <p>No medical records found.</p>
        ) : (
          <div className={styles.recordList}>
            {records.map((record) => (
              <div key={record.id} className={styles.recordItem}>
                <div className={styles.recordHeader}>
                  <span className={styles.date}>{new Date(record.record_date).toLocaleDateString()}</span>
                  <span className={styles.doctorName}>
                    Dr. {record.doctors?.first_name} {record.doctors?.last_name} ({record.doctors?.specialization})
                  </span>
                </div>
                
                <div className={styles.diagnosis}>Diagnosis: {record.diagnosis || 'N/A'}</div>
                
                {record.doctor_notes && (
                  <div className={styles.notes}>
                    <strong>Notes:</strong><br/>
                    {record.doctor_notes}
                  </div>
                )}

                {record.documents && record.documents.length > 0 && (
                  <div className={styles.docList}>
                    {record.documents.map((doc: any) => (
                      <Link 
                        key={doc.id} 
                        href={doc.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.docLink}
                        download
                      >
                        <Download size={16} />
                        {doc.title || doc.document_type}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
