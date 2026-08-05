'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, UserX, UserCheck } from 'lucide-react';
import styles from './users.module.css';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'receptionists' | 'lab_staff' | 'pharmacists' | 'patients'>('doctors');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone_number: '', specialization: '', department: '' });

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    let tableName = activeTab;
    if (activeTab === 'patients') tableName = 'profiles';
    
    const { data } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    let tableName = activeTab;
    
    // In a real app, you would use supabase.auth.admin.createUser to create the auth record first, 
    // then insert into the role table. Since client-side doesn't have service_role key, 
    // we'll just simulate adding to the table (leaving user_id null for demo).
    
    const insertData: any = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number
    };

    if (activeTab === 'doctors') {
      insertData.specialization = formData.specialization;
      insertData.department = formData.department;
      insertData.available = true;
    }

    if (activeTab === 'patients') {
      // Patients use 'profiles' table
      tableName = 'profiles';
      // profiles doesn't have email in the table (it's in auth.users)
      delete insertData.email; 
      // Need ID which comes from auth.users normally. Let's just block patient creation here for demo.
      alert('Patient creation should be done via Patient Registration portal.');
      return;
    }

    const { error } = await supabase.from(tableName).insert([insertData]);

    if (error) {
      alert('Error adding user: ' + error.message);
    } else {
      setShowAddModal(false);
      setFormData({ first_name: '', last_name: '', email: '', phone_number: '', specialization: '', department: '' });
      fetchUsers();
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (activeTab !== 'doctors') return; // Only doctors have 'available' field right now
    await supabase.from('doctors').update({ available: !currentStatus }).eq('id', id);
    fetchUsers();
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.details}>Manage hospital staff and patient accounts.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => setShowAddModal(true)} disabled={activeTab === 'patients'}>
            <Plus size={20} /> Add {activeTab.slice(0, -1).replace('_', ' ')}
          </button>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'doctors' ? styles.activeTab : ''}`} onClick={() => setActiveTab('doctors')}>Doctors</button>
          <button className={`${styles.tab} ${activeTab === 'receptionists' ? styles.activeTab : ''}`} onClick={() => setActiveTab('receptionists')}>Receptionists</button>
          <button className={`${styles.tab} ${activeTab === 'lab_staff' ? styles.activeTab : ''}`} onClick={() => setActiveTab('lab_staff')}>Lab Staff</button>
          <button className={`${styles.tab} ${activeTab === 'pharmacists' ? styles.activeTab : ''}`} onClick={() => setActiveTab('pharmacists')}>Pharmacists</button>
          <button className={`${styles.tab} ${activeTab === 'patients' ? styles.activeTab : ''}`} onClick={() => setActiveTab('patients')}>Patients</button>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  {activeTab !== 'patients' && <th>Email</th>}
                  <th>Phone</th>
                  {activeTab === 'doctors' && <th>Specialization</th>}
                  {activeTab === 'doctors' && <th>Department</th>}
                  {activeTab === 'doctors' && <th>Status</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.first_name} {user.last_name}</td>
                    {activeTab !== 'patients' && <td>{user.email || 'N/A'}</td>}
                    <td>{user.phone_number || 'N/A'}</td>
                    {activeTab === 'doctors' && <td>{user.specialization}</td>}
                    {activeTab === 'doctors' && <td>{user.department}</td>}
                    {activeTab === 'doctors' && (
                      <td>
                        {user.available ? (
                           <span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span>
                        ) : (
                           <span className={`${styles.badge} ${styles.badgeDanger}`}>Inactive</span>
                        )}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {activeTab === 'doctors' && (
                          <button 
                            className={styles.btnOutline} 
                            style={{ padding: '0.4rem', border: 'none', color: user.available ? '#dc2626' : '#166534' }}
                            onClick={() => toggleStatus(user.id, user.available)}
                            title={user.available ? "Deactivate" : "Activate"}
                          >
                            {user.available ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '1.5rem', textTransform: 'capitalize' }}>Add New {activeTab.slice(0, -1).replace('_', ' ')}</h2>
            <form onSubmit={handleAddUser}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>First Name</label>
                  <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Last Name</label>
                  <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              </div>

              {activeTab === 'doctors' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Specialization</label>
                    <input required type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Department</label>
                    <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
