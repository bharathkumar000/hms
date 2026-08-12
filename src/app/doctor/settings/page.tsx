'use client';
import { useModal } from '@/components/ModalProvider';

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

  // Availability
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState('');
  const [availabilityId, setAvailabilityId] = useState<string | null>(null);

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

      // Fetch Availability
      const { data: avail } = await supabase.from('doctor_availability').select('*').eq('doctor_id', prof.id).single();
      if (avail) {
        setAvailabilityId(avail.id);
        setWorkingDays(avail.working_days || []);
        setWorkingHours(avail.working_hours || '');
      }
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

  const handleUpdateAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    setSaving(true);
    
    // get doctor table id
    const { data: prof } = await supabase.from('doctors').select('id').eq('user_id', doctorId).single();
    if (!prof) return;

    const payload = {
      doctor_id: prof.id,
      working_days: workingDays,
      working_hours: workingHours
    };

    if (availabilityId) {
      await supabase.from('doctor_availability').update(payload).eq('id', availabilityId);
    } else {
      const { data } = await supabase.from('doctor_availability').insert(payload).select().single();
      if (data) setAvailabilityId(data.id);
    }

    setSaving(false);
    showAlert('Working hours updated successfully');
  };

  const toggleDay = (day: string) => {
    setWorkingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
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

      {/* Working Hours */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Working Hours</h2>
        <form onSubmit={handleUpdateAvailability}>
          <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Working Days</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={workingDays.includes(day) ? styles.btnPrimary : styles.btnOutline}
                    style={{ padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem' }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Working Hours</label>
              <input 
                type="text" 
                className={styles.input} 
                required
                placeholder="e.g. 09:00 AM - 05:00 PM"
                value={workingHours}
                onChange={e => setWorkingHours(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={saving} style={{ marginTop: '1.5rem' }}>Save Schedule</button>
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
