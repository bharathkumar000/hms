import { createClient } from '@/utils/supabase/server';
import styles from './records.module.css';
import { Download, Stethoscope, Activity, FileText } from 'lucide-react';
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

  // Fetch admission discharge summaries
  const { data: admissions } = await supabase
    .from('admissions')
    .select(`
      *,
      doctors(first_name, last_name, specialization)
    `)
    .eq('patient_id', user.id)
    .eq('status', 'Discharged')
    .order('actual_discharge_date', { ascending: false });

  // Combine and sort records and discharges into a single timeline
  const timelineEvents: any[] = [];
  
  if (records) {
    records.forEach(r => {
      timelineEvents.push({
        type: 'Consultation',
        id: `rec_${r.id}`,
        date: new Date(r.record_date),
        doctor: r.doctors,
        diagnosis: r.diagnosis,
        notes: r.doctor_notes,
        documents: r.documents
      });
    });
  }

  if (admissions) {
    admissions.forEach(a => {
      timelineEvents.push({
        type: 'Discharge Summary',
        id: `adm_${a.id}`,
        date: new Date(a.actual_discharge_date),
        doctor: a.doctors,
        diagnosis: a.reason_for_admission,
        notes: `Admitted on ${new Date(a.admission_date).toLocaleDateString()}. Successfully discharged.`,
        documents: []
      });
    });
  }

  // Sort descending by date
  timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Medical Records & History</h1>
          <p className={styles.subtitle}>A complete timeline of your consultations, diagnoses, and hospital stays.</p>
        </div>
      </div>

      <div className={styles.card}>
        {timelineEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FileText size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>No medical records found.</p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {timelineEvents.map((event) => (
              <div key={event.id} className={styles.timelineItem}>
                <div className={styles.timelineMarker} style={{ borderColor: event.type === 'Discharge Summary' ? '#10b981' : 'var(--color-primary)' }}></div>
                
                <div className={styles.timelineContent}>
                  <div className={styles.recordHeader}>
                    <div>
                      <div className={styles.doctorName}>
                        Dr. {event.doctor?.first_name} {event.doctor?.last_name} 
                        <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>({event.doctor?.specialization})</span>
                      </div>
                      <div className={styles.date}>{event.date.toLocaleDateString()}</div>
                    </div>
                    <span className={styles.recordType} style={{ background: event.type === 'Discharge Summary' ? '#10b981' : 'var(--color-primary)' }}>
                      {event.type}
                    </span>
                  </div>
                  
                  <div className={styles.diagnosis}>Diagnosis / Reason: {event.diagnosis || 'N/A'}</div>
                  
                  {event.notes && (
                    <div className={styles.notes}>
                      <strong>Clinical Notes:</strong><br/>
                      {event.notes}
                    </div>
                  )}

                  {event.documents && event.documents.length > 0 && (
                    <div className={styles.docList}>
                      {event.documents.map((doc: any) => (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
