import { useModal } from '@/components/ModalProvider';
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import styles from '../users/users.module.css'; 

export default function AdminDepartments() {
  const { showAlert, showConfirm } = useModal();

  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', description: '', head_doctor_id: '', status: 'Active' });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch departments
    const { data: deptData } = await supabase.from('departments').select('*, head_doctor_id(id, first_name, last_name)').order('created_at', { ascending: false });
    // Fetch doctors for the dropdown
    const { data: docData } = await supabase.from('doctors').select('id, first_name, last_name, specialization');
    
    if (deptData) setDepartments(deptData);
    if (docData) setDoctors(docData);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', description: '', head_doctor_id: '', status: 'Active' });
    setEditMode(false);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (dept: any) => {
    setFormData({
      name: dept.name || '',
      description: dept.description || '',
      head_doctor_id: dept.head_doctor_id ? dept.head_doctor_id.id : '',
      status: dept.status || 'Active'
    });
    setEditingId(dept.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const saveData = {
      name: formData.name,
      description: formData.description,
      head_doctor_id: formData.head_doctor_id || null,
      status: formData.status
    };

    if (editMode && editingId) {
      const { error } = await supabase.from('departments').update(saveData).eq('id', editingId);
      if (error) showAlert('Error updating department: ' + error.message);
      else {
        setShowModal(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('departments').insert([saveData]);
      if (error) showAlert('Error adding department: ' + error.message);
      else {
        setShowModal(false);
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = await showConfirm('Are you sure you want to delete this department?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) showAlert('Error deleting department: ' + error.message);
    else fetchData();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Departments</h1>
          <p className={styles.details}>Manage hospital departments and their heads.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleOpenAdd}>
            <Plus size={20} /> Add Department
          </button>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading departments...
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Department Head</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                    <td>{dept.description || '-'}</td>
                    <td>
                      {dept.head_doctor_id 
                        ? `Dr. ${dept.head_doctor_id.first_name} ${dept.head_doctor_id.last_name}` 
                        : <span style={{ color: 'var(--color-text-secondary)' }}>Unassigned</span>}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${dept.status === 'Active' ? styles.badgeSuccess : styles.badgeDanger}`}>
                        {dept.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className={styles.btnOutline} 
                          style={{ padding: '0.4rem', border: 'none' }} 
                          onClick={() => handleOpenEdit(dept)}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className={styles.btnOutline} 
                          style={{ padding: '0.4rem', border: 'none', color: '#dc2626' }} 
                          onClick={() => handleDelete(dept.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                      No departments configured.
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
            <h2 style={{ marginBottom: '1.5rem' }}>{editMode ? 'Edit' : 'Add New'} Department</h2>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Department Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Cardiology" />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief overview of department functions" />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Assign Head Doctor (Optional)</label>
                  <select value={formData.head_doctor_id} onChange={e => setFormData({...formData, head_doctor_id: e.target.value})}>
                    <option value="">None</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.first_name} {doc.last_name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>{editMode ? 'Save Changes' : 'Save Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
