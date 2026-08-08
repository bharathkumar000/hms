'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit2, Trash2, BedDouble, AlertCircle } from 'lucide-react';
import styles from '../users/users.module.css';

export default function AdminBeds() {
  const { showAlert, showConfirm } = useModal();
  const supabase = createClient();

  const [beds, setBeds] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    bed_number: '',
    room_id: '',
    type: 'General',
    status: 'Available',
    maintenance_info: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Rooms for dropdown
    const { data: roomData } = await supabase.from('rooms').select('id, room_number, wards(name)').order('room_number');
    if (roomData) setRooms(roomData);

    // Fetch Beds with active admission (patient info)
    const { data: bedsData } = await supabase
      .from('beds')
      .select(`
        *,
        rooms (room_number, wards (name)),
        admissions (id, status, profiles(first_name, last_name))
      `)
      .order('bed_number');
      
    if (bedsData) {
      // Map active admission manually if multiple returned (Supabase joins return arrays for 1-to-many)
      const mapped = bedsData.map(bed => {
        const activeAdmission = bed.admissions?.find((a: any) => a.status === 'Admitted');
        return {
          ...bed,
          current_patient: activeAdmission ? `${activeAdmission.profiles?.first_name} ${activeAdmission.profiles?.last_name}` : null
        };
      });
      setBeds(mapped);
    }
    
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setFormData({ bed_number: '', room_id: '', type: 'General', status: 'Available', maintenance_info: '' });
    setEditMode(false);
    setEditId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (bed: any) => {
    setFormData({
      bed_number: bed.bed_number || '',
      room_id: bed.room_id || '',
      type: bed.type || 'General',
      status: bed.status || 'Available',
      maintenance_info: bed.maintenance_info || ''
    });
    setEditId(bed.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.room_id) {
      showAlert('Please select a room.');
      return;
    }
    
    const saveData = {
      bed_number: formData.bed_number,
      room_id: formData.room_id,
      type: formData.type,
      status: formData.status,
      maintenance_info: formData.status === 'Maintenance' ? formData.maintenance_info : null,
      is_occupied: formData.status === 'Occupied' // For backward compatibility with older schema
    };

    if (editMode && editId) {
      const { error } = await supabase.from('beds').update(saveData).eq('id', editId);
      if (error) showAlert('Error updating bed: ' + error.message);
      else { setShowModal(false); fetchData(); }
    } else {
      const { error } = await supabase.from('beds').insert([saveData]);
      if (error) showAlert('Error adding bed: ' + error.message);
      else { setShowModal(false); fetchData(); }
    }
  };

  const handleDelete = async (id: string, isOccupied: boolean) => {
    if (isOccupied) {
      showAlert('Cannot delete an occupied bed. Discharge the patient first.');
      return;
    }
    const confirm = await showConfirm('Delete this bed?');
    if (!confirm) return;
    const { error } = await supabase.from('beds').delete().eq('id', id);
    if (error) showAlert('Error: ' + error.message);
    else fetchData();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return styles.badgeSuccess;
      case 'Occupied': return styles.badgeDanger;
      case 'Maintenance': return styles.badgeWarning;
      case 'Reserved': return styles.badgeWarning;
      case 'Cleaning': return styles.badgeWarning;
      case 'Inactive': return styles.badgeSecondary;
      default: return styles.badgeSecondary;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Bed Management</h1>
          <p className={styles.details}>Centrally manage hospital beds and view occupancies.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleOpenAdd}>
            <Plus size={20} /> Add Bed
          </button>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading beds...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bed No.</th>
                  <th>Ward & Room</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Current Patient</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {beds.map((bed) => (
                  <tr key={bed.id}>
                    <td style={{ fontWeight: 600 }}>{bed.bed_number}</td>
                    <td>{bed.rooms?.wards?.name} - Rm {bed.rooms?.room_number}</td>
                    <td>{bed.type || 'General'}</td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadge(bed.status || (bed.is_occupied ? 'Occupied' : 'Available'))}`}>
                        {bed.status || (bed.is_occupied ? 'Occupied' : 'Available')}
                      </span>
                      {bed.status === 'Maintenance' && bed.maintenance_info && (
                        <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#b45309' }}>
                          <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {bed.maintenance_info}
                        </div>
                      )}
                    </td>
                    <td>
                      {bed.current_patient ? (
                        <span style={{ fontWeight: 500, color: '#0369a1' }}>{bed.current_patient}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none' }} onClick={() => handleOpenEdit(bed)} title="Edit"><Edit2 size={18} /></button>
                        <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none', color: '#dc2626' }} onClick={() => handleDelete(bed.id, bed.status === 'Occupied' || bed.is_occupied)} title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {beds.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No beds configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editMode ? 'Edit' : 'Add'} Bed</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Bed Number</label>
                  <input required type="text" value={formData.bed_number} onChange={e => setFormData({...formData, bed_number: e.target.value})} placeholder="e.g., B-01" />
                </div>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label>Room</label>
                  <select required value={formData.room_id} onChange={e => setFormData({...formData, room_id: e.target.value})}>
                    <option value="">-- Select Room --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.wards?.name} - Rm {r.room_number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Bed Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="General">General</option>
                    <option value="Motorized">Motorized</option>
                    <option value="ICU">ICU Specialized</option>
                    <option value="Pediatric">Pediatric</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Available">Available</option>
                    <option value="Occupied" disabled={!editMode}>Occupied</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {formData.status === 'Maintenance' && (
                <div className={styles.formGroup}>
                  <label>Maintenance Details</label>
                  <input type="text" value={formData.maintenance_info} onChange={e => setFormData({...formData, maintenance_info: e.target.value})} placeholder="e.g., Broken side rail, scheduled fix on Monday" />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
