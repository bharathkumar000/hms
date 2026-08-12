'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Download, Activity, FileText, Banknote } from 'lucide-react';
import styles from './reports.module.css';

export default function ReceptionReports() {
  const { showAlert, showConfirm } = useModal();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchDailyStats();
  }, []);

  const fetchDailyStats = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [profiles, appointments, queue, bills, payments, admissions] = await Promise.all([
      supabase.from('profiles').select('id, created_at').gte('created_at', `${today}T00:00:00Z`),
      supabase.from('appointments').select('*').eq('appointment_date', today),
      supabase.from('patient_queue').select('*').gte('check_in_time', `${today}T00:00:00Z`),
      supabase.from('bills').select('*').gte('created_at', `${today}T00:00:00Z`),
      supabase.from('payments').select('*').gte('payment_date', `${today}T00:00:00Z`),
      supabase.from('admissions').select('status, admission_date, actual_discharge_date').or(`admission_date.gte.${today}T00:00:00Z,actual_discharge_date.gte.${today}T00:00:00Z`)
    ]);

    const newPatients = profiles.data?.length || 0;
    
    const totalApts = appointments.data?.length || 0;
    const completedApts = appointments.data?.filter(a => a.status === 'Completed').length || 0;
    const cancelledApts = appointments.data?.filter(a => a.status === 'Cancelled').length || 0;
    
    const totalCheckins = queue.data?.length || 0;
    const avgWaitTime = '15 mins'; // Placeholder for demo

    const billsGenerated = bills.data?.length || 0;
    const totalBilled = bills.data?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
    const totalCollected = payments.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    
    const admissionsToday = admissions.data?.filter((a: any) => a.admission_date && a.admission_date.startsWith(today)).length || 0;
    const dischargesToday = admissions.data?.filter((a: any) => a.actual_discharge_date && a.actual_discharge_date.startsWith(today)).length || 0;
    
    // Group payments by method
    const paymentMethods = payments.data?.reduce((acc: any, p) => {
      acc[p.payment_method] = (acc[p.payment_method] || 0) + Number(p.amount);
      return acc;
    }, {}) || {};

    setStats({
      newPatients,
      totalApts, completedApts, cancelledApts,
      totalCheckins, avgWaitTime,
      billsGenerated, totalBilled, totalCollected,
      paymentMethods,
      admissionsToday, dischargesToday
    });

    setLoading(false);
  };

  const handleExport = () => {
    showAlert("Export feature is not supported in the demo version.");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Reports</h1>
          <p className={styles.details}>Analytics and performance summary for today.</p>
        </div>
        <button className={styles.btnOutline} onClick={handleExport}>
          <Download size={18} /> Export PDF
        </button>
      </header>

      {loading || !stats ? (
        <p>Generating reports...</p>
      ) : (
        <div className={styles.grid}>
          {/* Clinical Activity */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <Activity size={20} color="var(--color-primary)" /> Clinical Activity
            </h2>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Total Appointments</span>
              <span className={styles.statValue}>{stats.totalApts}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Completed Consultations</span>
              <span className={styles.statValue} style={{ color: '#166534' }}>{stats.completedApts}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Cancelled</span>
              <span className={styles.statValue} style={{ color: '#dc2626' }}>{stats.cancelledApts}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Total Check-ins (Queue)</span>
              <span className={styles.statValue}>{stats.totalCheckins}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Est. Avg Wait Time</span>
              <span className={styles.statValue}>{stats.avgWaitTime}</span>
            </div>
          </div>

          {/* Registrations & Admissions */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <FileText size={20} color="var(--color-primary)" /> Registrations & Admissions
            </h2>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>New Patients Registered</span>
              <span className={styles.statValue} style={{ color: '#166534' }}>{stats.newPatients}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Admitted Today</span>
              <span className={styles.statValue} style={{ color: '#a16207' }}>{stats.admissionsToday}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Discharged Today</span>
              <span className={styles.statValue}>{stats.dischargesToday}</span>
            </div>
          </div>

          {/* Financial Summary */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <Banknote size={20} color="var(--color-primary)" /> Financial Summary
            </h2>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Bills Generated</span>
              <span className={styles.statValue}>{stats.billsGenerated}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Total Amount Billed</span>
              <span className={styles.statValue}>${stats.totalBilled.toFixed(2)}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Total Collected (Paid)</span>
              <span className={styles.statValue} style={{ color: '#166534' }}>${stats.totalCollected.toFixed(2)}</span>
            </div>
            
            {Object.keys(stats.paymentMethods).length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <div className={styles.statLabel} style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Collection by Method:</div>
                {Object.entries(stats.paymentMethods).map(([method, amount]: any) => (
                  <div key={method} className={styles.statRow} style={{ padding: '0.25rem 0', border: 'none' }}>
                    <span className={styles.statLabel} style={{ fontSize: '0.85rem' }}>{method}</span>
                    <span className={styles.statValue} style={{ fontSize: '0.95rem' }}>${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
