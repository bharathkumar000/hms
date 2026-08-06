import { useModal } from '@/components/ModalProvider';
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search } from 'lucide-react';
import styles from '../users/users.module.css';

export default function AdminAppointments() {
  const { showAlert, showConfirm } = useModal();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const supabase = createClient();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, patient_id(*), doctor_id(*)')
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });
      
    if (data) setAppointments(data);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (error) showAlert('Error updating status: ' + error.message);
    else fetchAppointments();
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.patient_id?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.patient_id?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.doctor_id?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.doctor_id?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Upcoming': return styles.badgeSuccess; // Green
      case 'Completed': return styles.badgeSuccess;
      case 'Cancelled': return styles.badgeDanger;
      default: return styles.badgeSuccess;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Global Appointments</h1>
          <p className={styles.details}>Monitor all hospital appointments across departments.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search by patient or doctor name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className={styles.searchInput} 
            style={{ width: '200px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading appointments...
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{app.appointment_date}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{app.appointment_time}</div>
                    </td>
                    <td>{app.patient_id?.first_name} {app.patient_id?.last_name}</td>
                    <td>Dr. {app.doctor_id?.first_name} {app.doctor_id?.last_name}</td>
                    <td>{app.doctor_id?.department || 'General'}</td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                      No appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
