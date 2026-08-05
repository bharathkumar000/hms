'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Download } from 'lucide-react';
import styles from './reports.module.css';

export default function DoctorReports() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    completed: 0,
    pending: 0,
    emergencies: 0,
    prescriptions: 0,
    labOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [appointments, emergencies, prescriptions, labOrders] = await Promise.all([
      supabase.from('appointments').select('*').eq('appointment_date', today),
      supabase.from('emergency_cases').select('*').eq('status', 'Active'),
      supabase.from('prescriptions').select('*').gte('created_at', `${today}T00:00:00Z`),
      supabase.from('lab_orders').select('*').gte('created_at', `${today}T00:00:00Z`)
    ]);

    const apts = appointments.data || [];
    
    setStats({
      totalPatients: apts.length,
      completed: apts.filter(a => a.status === 'Completed').length,
      pending: apts.filter(a => a.status === 'Upcoming').length,
      emergencies: emergencies.data?.length || 0,
      prescriptions: prescriptions.data?.length || 0,
      labOrders: labOrders.data?.length || 0
    });

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Reports & Analytics</h1>
          <p className={styles.details}>Summary of today's clinical activities.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => window.print()}>
          <Download size={18} /> Export Report
        </button>
      </header>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.statValue}>{stats.totalPatients}</div>
              <div className={styles.statLabel}>Total Patients Today</div>
            </div>
            <div className={styles.card}>
              <div className={styles.statValue} style={{ color: '#166534' }}>{stats.completed}</div>
              <div className={styles.statLabel}>Completed Consultations</div>
            </div>
            <div className={styles.card}>
              <div className={styles.statValue} style={{ color: '#a16207' }}>{stats.pending}</div>
              <div className={styles.statLabel}>Pending Consultations</div>
            </div>
            <div className={styles.card}>
              <div className={styles.statValue} style={{ color: '#dc2626' }}>{stats.emergencies}</div>
              <div className={styles.statLabel}>Active Emergencies</div>
            </div>
          </div>

          <div className={styles.reportSection}>
            <h2 className={styles.sectionTitle}>Consultation Summary</h2>
            <div className={styles.list}>
              <div className={styles.listItem}>
                <div className={styles.itemMain}>Prescriptions Issued Today</div>
                <div className={styles.statValue} style={{ fontSize: '1.5rem', marginBottom: 0 }}>{stats.prescriptions}</div>
              </div>
              <div className={styles.listItem}>
                <div className={styles.itemMain}>Lab Requests Ordered Today</div>
                <div className={styles.statValue} style={{ fontSize: '1.5rem', marginBottom: 0 }}>{stats.labOrders}</div>
              </div>
              <div className={styles.listItem}>
                <div className={styles.itemMain}>Consultation Completion Rate</div>
                <div className={styles.statValue} style={{ fontSize: '1.5rem', marginBottom: 0 }}>
                  {stats.totalPatients > 0 ? Math.round((stats.completed / stats.totalPatients) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
