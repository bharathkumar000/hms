'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import styles from '../users/users.module.css'; // Reusing user module styles

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', head_doctor_id: '' });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch departments
    const { data: deptData } = await supabase.from('departments').select('*, head_doctor_id(*)');
    // Fetch doctors for the dropdown
    const { data: docData } = await supabase.from('doctors').select('id, first_name, last_name, specialization');
    
    if (deptData) setDepartments(deptData);
    if (docData) setDoctors(docData);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('departments').insert([{
      name: formData.name,
      description: formData.description,
      head_doctor_id: formData.head_doctor_id || null
    }]);

    if (error) {
      alert('Error saving department: ' + error.message);
    } else {
      setShowAddModal(false);
      setFormData({ name: '', description: '', head_doctor_id: '' });
      fetchData();
    }
  };

  const handleDelete = async (id: string, headId: string | null) => {
    if (headId) {
      alert('Cannot delete department while it has an assigned head or staff. Remove them first.');
      return;
    }
    
    const confirmDelete = confirm('Are you sure you want to delete this department?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) alert('Error: ' + error.message);
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
          <button className={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> Add Department
          </button>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading departments...</p>
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
                    <td>{dept.description}</td>
                    <td>
                      {dept.head_doctor_id 
                        ? `Dr. ${dept.head_doctor_id.first_name} ${dept.head_doctor_id.last_name}` 
                        : 'Unassigned'}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${dept.status === 'Active' ? styles.badgeSuccess : styles.badgeDanger}`}>
                        {dept.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none', color: '#dc2626' }} onClick={() => handleDelete(dept.id, dept.head_doctor_id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No departments configured.
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
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Department</h2>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Department Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Cardiology" />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief overview of department functions" />
              </div>
              
              <div className={styles.formGroup}>
                <label>Assign Head Doctor (Optional)</label>
                <select value={formData.head_doctor_id} onChange={e => setFormData({...formData, head_doctor_id: e.target.value})}>
                  <option value="">Select a Doctor</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.first_name} {doc.last_name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
