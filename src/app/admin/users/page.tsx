import { useModal } from '@/components/ModalProvider';
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, UserX, UserCheck, Pencil, Trash2 } from 'lucide-react';
import styles from './users.module.css';

export default function AdminUsers() {
  const { showAlert, showConfirm } = useModal();

  const [activeTab, setActiveTab] = useState<'doctors' | 'reception_staff' | 'lab_staff' | 'pharmacists' | 'profiles'>('doctors');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    phone_number: '', 
    specialization: '', 
    department: '',
    role: 'Technician' // for lab_staff
  });

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(activeTab).select('*').order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    else if (error) console.error(error);
    
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ first_name: '', last_name: '', email: '', phone_number: '', specialization: '', department: '', role: 'Technician' });
    setEditMode(false);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (user: any) => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      specialization: user.specialization || '',
      department: user.department || '',
      role: user.role || 'Technician'
    });
    setEditingId(user.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const insertData: any = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number
    };

    if (activeTab === 'doctors') {
      insertData.specialization = formData.specialization;
      insertData.department = formData.department;
    } else if (activeTab === 'lab_staff') {
      insertData.role = formData.role;
    } else if (activeTab === 'profiles') {
      delete insertData.email; 
    }

    if (editMode && editingId) {
      // Update existing
      const { error } = await supabase.from(activeTab).update(insertData).eq('id', editingId);
      if (error) showAlert('Error updating user: ' + error.message);
      else {
        setShowModal(false);
        fetchUsers();
      }
    } else {
      // Add new
      if (activeTab === 'doctors') insertData.available = true;
      const { error } = await supabase.from(activeTab).insert([insertData]);
      if (error) showAlert('Error adding user: ' + error.message);
      else {
        setShowModal(false);
        fetchUsers();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm('Are you sure you want to delete this record?')) return;
    const { error } = await supabase.from(activeTab).delete().eq('id', id);
    if (error) showAlert('Error deleting user: ' + error.message);
    else fetchUsers();
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (activeTab !== 'doctors') return; 
    await supabase.from('doctors').update({ available: !currentStatus }).eq('id', id);
    fetchUsers();
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTabLabel = (tab: string) => {
    if (tab === 'reception_staff') return 'Receptionists';
    if (tab === 'lab_staff') return 'Lab Staff';
    if (tab === 'profiles') return 'Patients';
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.details}>Manage hospital staff and patient accounts.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleOpenAdd}>
            <Plus size={20} /> Add {getTabLabel(activeTab).slice(0, -1)}
          </button>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.tabs}>
          {['doctors', 'reception_staff', 'lab_staff', 'pharmacists', 'profiles'].map(tab => (
            <button 
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`} 
              onClick={() => setActiveTab(tab as any)}
            >
              {getTabLabel(tab)}
            </button>
          ))}
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
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading users...
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  {activeTab !== 'profiles' && <th>Email</th>}
                  <th>Phone</th>
                  {activeTab === 'doctors' && <th>Specialization</th>}
                  {activeTab === 'doctors' && <th>Department</th>}
                  {activeTab === 'lab_staff' && <th>Role</th>}
                  {activeTab === 'doctors' && <th>Status</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.first_name} {user.last_name}</td>
                    {activeTab !== 'profiles' && <td>{user.email || 'N/A'}</td>}
                    <td>{user.phone_number || 'N/A'}</td>
                    {activeTab === 'doctors' && <td>{user.specialization}</td>}
                    {activeTab === 'doctors' && <td>{user.department}</td>}
                    {activeTab === 'lab_staff' && <td>{user.role}</td>}
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
                        <button 
                          className={styles.btnOutline} 
                          style={{ padding: '0.4rem', border: 'none' }}
                          onClick={() => handleOpenEdit(user)}
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          className={styles.btnOutline} 
                          style={{ padding: '0.4rem', border: 'none', color: '#dc2626' }}
                          onClick={() => handleDelete(user.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                      No {getTabLabel(activeTab).toLowerCase()} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '1.5rem', textTransform: 'capitalize' }}>
              {editMode ? 'Edit' : 'Add New'} {getTabLabel(activeTab).slice(0, -1)}
            </h2>
            <form onSubmit={handleSubmit}>
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
              
              {activeTab !== 'profiles' && (
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              )}
              
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

              {activeTab === 'lab_staff' && (
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="Technician">Technician</option>
                    <option value="Pathologist">Pathologist</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>{editMode ? 'Save Changes' : 'Save User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
