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

  const activePrescriptions = prescriptions?.filter(p => p.status === 'Active' && p.dispense_status !== 'Completed') || [];
  const previousPrescriptions = prescriptions?.filter(p => p.status === 'Completed' || p.dispense_status === 'Completed') || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Prescriptions</h1>
      </div>

      <div className={styles.card}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1.5rem' }}>Active Prescriptions</h2>
        {activePrescriptions.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>No active prescriptions.</p>
        ) : (
          <div className={styles.grid} style={{ marginBottom: '2rem' }}>
            {activePrescriptions.map((script) => (
              <div key={script.id} className={styles.pillCard} style={{ borderLeft: '4px solid var(--color-primary)' }}>
                <div className={styles.medicineName}>
                  {script.medicine_name}
                  <span className={`${styles.status} ${styles.statusActive}`} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                    {script.dispense_status === 'Pending' ? 'Needs Dispensing' : script.dispense_status}
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
              </div>
            ))}
          </div>
        )}

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>Previous Prescriptions</h2>
        {previousPrescriptions.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No previous prescriptions.</p>
        ) : (
          <div className={styles.grid}>
            {previousPrescriptions.map((script) => (
              <div key={script.id} className={styles.pillCard} style={{ borderLeft: '4px solid #94a3b8', opacity: 0.8 }}>
                <div className={styles.medicineName}>
                  {script.medicine_name}
                  <span className={styles.status} style={{ background: '#f1f5f9', color: '#64748b' }}>
                    {script.status}
                  </span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Dosage:</span>
                  <span className={styles.detailValue}>{script.dosage}</span>
                </div>
                
                <div className={styles.detailRow} style={{ marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                  <span className={styles.detailLabel}>Prescribed on:</span>
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
