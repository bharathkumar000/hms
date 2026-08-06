import { redirect } from 'next/navigation';
import { FlaskConical, Download, Clock, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import styles from './laboratory.module.css';

export default async function LaboratoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Fetch all lab orders for the patient
  const { data: labOrders } = await supabase
    .from('lab_orders')
    .select(`
      *,
      doctors(first_name, last_name)
    `)
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed':
      case 'Released':
        return styles.statusCompleted;
      case 'Processing':
        return styles.statusProcessing;
      default:
        return styles.statusPending;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Laboratory Reports</h1>
          <p className={styles.subtitle}>View and download your medical test results.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {labOrders && labOrders.length > 0 ? (
          labOrders.map((order) => (
            <div key={order.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  <FlaskConical size={24} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>{order.test_category} Test</h3>
                  <p className={styles.itemSub}>Ordered by Dr. {order.doctors?.first_name} {order.doctors?.last_name}</p>
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.listItem}>
                  <span className={styles.itemMain}>Status</span>
                  <span className={`${styles.statusBadge} ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className={styles.listItem}>
                  <span className={styles.itemMain}>Ordered On</span>
                  <span className={styles.itemSub}>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>

                {order.completion_time && (
                  <div className={styles.listItem}>
                    <span className={styles.itemMain}>Completed On</span>
                    <span className={styles.itemSub}>{new Date(order.completion_time).toLocaleDateString()}</span>
                  </div>
                )}

                {order.notes && (
                  <div className={styles.listItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span className={styles.itemMain}>Notes</span>
                    <p className={styles.itemSub}>{order.notes}</p>
                  </div>
                )}

                <div style={{ marginTop: '1.5rem' }}>
                  {order.report_url && (order.status === 'Completed' || order.status === 'Released') ? (
                    <a href={order.report_url} target="_blank" rel="noreferrer" className={styles.btnPrimary}>
                      <Download size={18} /> Download Report
                    </a>
                  ) : (
                    <button className={styles.btnDisabled} disabled>
                      <Clock size={18} /> Report Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.card} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
              <FlaskConical size={48} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>No Laboratory Reports Found</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>You don't have any laboratory tests ordered or completed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
