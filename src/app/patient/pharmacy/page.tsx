import { createClient } from '@/utils/supabase/server';
import styles from './pharmacy.module.css';
import { redirect } from 'next/navigation';

export default async function PharmacyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Fetch prescriptions
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select(`
      *,
      doctors(first_name, last_name)
    `)
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Prescriptions</h1>
      </div>

      <div className={styles.card}>
        {(!prescriptions || prescriptions.length === 0) ? (
          <p>No prescriptions found.</p>
        ) : (
          <div className={styles.grid}>
            {prescriptions.map((script) => (
              <div key={script.id} className={styles.pillCard}>
                <div className={styles.medicineName}>
                  {script.medicine_name}
                  <span className={`${styles.status} ${script.status === 'Active' ? '' : styles.statusInactive}`}>
                    {script.status}
                  </span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Dosage:</span>
                  <span className={styles.detailValue}>{script.dosage}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Frequency:</span>
                  <span className={styles.detailValue}>{script.frequency}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Duration:</span>
                  <span className={styles.detailValue}>{script.duration}</span>
                </div>
                
                <div className={styles.detailRow} style={{ marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                  <span className={styles.detailLabel}>Prescribed by:</span>
                  <span className={styles.detailValue}>Dr. {script.doctors?.first_name} {script.doctors?.last_name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date:</span>
                  <span className={styles.detailValue}>{new Date(script.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
