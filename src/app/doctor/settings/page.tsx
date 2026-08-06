import { useModal } from '@/components/ModalProvider';
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './settings.module.css';

export default function DoctorSettings() {
  const { showAlert, showConfirm } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile
  const [profile, setProfile] = useState({ first_name: '', last_name: '', phone_number: '', specialization: '' });
  
  // Leave
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const supabase = createClient();
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (uid) setDoctorId(uid);

    // Fetch Profile
    if (uid) {
      const { data: prof } = await supabase.from('doctors').select('*').eq('user_id', uid).single();
      if (prof) setProfile({ first_name: prof.first_name, last_name: prof.last_name, phone_number: prof.phone_number || '', specialization: prof.specialization || '' });

      // Fetch Leave Requests
      const { data: leaves } = await supabase.from('leave_requests').select('*').eq('doctor_id', uid).order('created_at', { ascending: false });
      if (leaves) setLeaveRequests(leaves);
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    setSaving(true);
    await supabase.from('doctors').update(profile).eq('user_id', doctorId);
    setSaving(false);
    showAlert('Profile updated successfully');
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    setSaving(true);
    
    await supabase.from('leave_requests').insert({
      doctor_id: doctorId,
      start_date: leaveStartDate,
      end_date: leaveEndDate,
      reason: leaveReason,
      status: 'Pending'
    });

    setLeaveStartDate('');
    setLeaveEndDate('');
    setLeaveReason('');
    fetchData();
    setSaving(false);
    showAlert('Leave request submitted');
  };

  if (loading) return <div className={styles.container}><p>Loading settings...</p></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
        </div>
      </header>

      {/* Profile Settings */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Profile Information</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name</label>
              <input 
                type="text" 
                className={styles.input} 
                value={profile.first_name}
                onChange={e => setProfile({...profile, first_name: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name</label>
              <input 
                type="text" 
                className={styles.input} 
                value={profile.last_name}
                onChange={e => setProfile({...profile, last_name: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Specialization</label>
              <input 
                type="text" 
                className={styles.input} 
                value={profile.specialization}
                onChange={e => setProfile({...profile, specialization: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input 
                type="text" 
                className={styles.input} 
                value={profile.phone_number}
                onChange={e => setProfile({...profile, phone_number: e.target.value})}
              />
            </div>
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>Save Profile</button>
        </form>
      </div>

      {/* Leave Management */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Apply for Leave</h2>
        <form onSubmit={handleApplyLeave}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Start Date</label>
              <input 
                type="date" 
                className={styles.input} 
                required
                value={leaveStartDate}
                onChange={e => setLeaveStartDate(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>End Date</label>
              <input 
                type="date" 
                className={styles.input} 
                required
                value={leaveEndDate}
                onChange={e => setLeaveEndDate(e.target.value)}
              />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Reason</label>
              <input 
                type="text" 
                className={styles.input} 
                required
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>Submit Request</button>
        </form>

        {leaveRequests.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 className={styles.label} style={{ marginBottom: '1rem' }}>Recent Leave Requests</h3>
            <div className={styles.list}>
              {leaveRequests.map(req => (
                <div key={req.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{req.start_date} to {req.end_date}</div>
                    <div className={styles.itemSub}>{req.reason}</div>
                  </div>
                  <span className={`${styles.status} ${req.status === 'Approved' ? styles.statusApproved : req.status === 'Rejected' ? styles.statusRejected : styles.statusPending}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
