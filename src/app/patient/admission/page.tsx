import { redirect } from 'next/navigation';
import { Bed, Activity, UserRound, Clock, MapPin } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import styles from './admission.module.css';

export default async function AdmissionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Fetch admission status and details
  const { data: admission } = await supabase
    .from('admissions')
    .select(`
      *,
      doctors(first_name, last_name, specialization),
      beds(bed_number, rooms(room_number, wards(name, type))),
      bed_transfers(
        transfer_date, reason,
        previous_bed_id,
        new_bed_id
      )
    `)
    .eq('patient_id', user.id)
    .order('admission_date', { ascending: false })
    .limit(1)
    .single();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admission Management</h1>
          <p className={styles.subtitle}>Track your admission status and hospital stay details.</p>
        </div>
      </div>

      {admission ? (
        <div className={styles.grid}>
          {/* Main Status Card */}
          <div className={styles.card} style={{ gridColumn: '1 / -1', borderLeft: admission.status === 'Admitted' ? '4px solid var(--color-primary)' : '4px solid #10b981' }}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <Activity size={24} />
              </div>
              <h2 className={styles.cardTitle}>Current Status: {admission.status}</h2>
            </div>
            <div className={styles.cardContent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              
              <div>
                <span className={styles.itemMain}>Admission Date</span>
                <p className={styles.itemValue}>{new Date(admission.admission_date).toLocaleString()}</p>
              </div>

              {admission.status === 'Discharged' ? (
                <div>
                  <span className={styles.itemMain}>Discharge Date</span>
                  <p className={styles.itemValue}>{new Date(admission.actual_discharge_date).toLocaleString()}</p>
                </div>
              ) : (
                <div>
                  <span className={styles.itemMain}>Expected Discharge</span>
                  <p className={styles.itemValue}>{admission.expected_discharge_date ? new Date(admission.expected_discharge_date).toLocaleDateString() : 'To be determined'}</p>
                </div>
              )}

              <div>
                <span className={styles.itemMain}>Reason for Admission</span>
                <p className={styles.itemValue}>{admission.reason_for_admission || 'Not specified'}</p>
              </div>

            </div>
          </div>

          {/* Location & Care Team */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: '#ecfdf5', color: '#10b981' }}>
                <MapPin size={24} />
              </div>
              <h2 className={styles.cardTitle}>Hospital Location</h2>
            </div>
            <div className={styles.list}>
              <div className={styles.listItem}>
                <span className={styles.itemMain}>Ward</span>
                <span className={styles.itemSub}>{admission.beds?.rooms?.wards?.name} ({admission.beds?.rooms?.wards?.type})</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.itemMain}>Room Number</span>
                <span className={styles.itemSub}>{admission.beds?.rooms?.room_number}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.itemMain}>Bed Number</span>
                <span className={styles.itemSub}>{admission.beds?.bed_number}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <UserRound size={24} />
              </div>
              <h2 className={styles.cardTitle}>Care Team</h2>
            </div>
            <div className={styles.list}>
              <div className={styles.listItem}>
                <span className={styles.itemMain}>Assigned Doctor</span>
                <span className={styles.itemSub}>Dr. {admission.doctors?.first_name} {admission.doctors?.last_name}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.itemMain}>Doctor Specialty</span>
                <span className={styles.itemSub}>{admission.doctors?.specialization}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.itemMain}>Head Nurse</span>
                <span className={styles.itemSub}>{admission.head_nurse_name || 'Not assigned yet'}</span>
              </div>
            </div>
          </div>

          {/* Transfer History */}
          {admission.bed_transfers && admission.bed_transfers.length > 0 && (
            <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper} style={{ background: '#fef9c3', color: '#ca8a04' }}>
                  <Clock size={24} />
                </div>
                <h2 className={styles.cardTitle}>Bed Transfer History</h2>
              </div>
              <div className={styles.timeline}>
                {admission.bed_transfers.map((transfer: any, idx: number) => (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineMarker}></div>
                    <div className={styles.timelineContent}>
                      <span className={styles.itemMain}>Transferred on {new Date(transfer.transfer_date).toLocaleString()}</span>
                      <p className={styles.itemSub}>Reason: {transfer.reason || 'Routine Transfer'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1.5rem', background: '#f1f5f9', borderRadius: '50%', marginBottom: '1rem' }}>
            <Bed size={64} color="#94a3b8" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>No Active Admission</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>You are not currently admitted to the hospital, and have no recent admission history.</p>
        </div>
      )}
    </div>
  );
}
