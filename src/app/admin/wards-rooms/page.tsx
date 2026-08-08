'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit2, Trash2, Building } from 'lucide-react';
import styles from '../users/users.module.css';

export default function AdminWardsRooms() {
  const { showAlert, showConfirm } = useModal();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'wards' | 'rooms'>('wards');
  const [loading, setLoading] = useState(true);

  // Data State
  const [wards, setWards] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);

  // Modal State for Ward
  const [showWardModal, setShowWardModal] = useState(false);
  const [editWardMode, setEditWardMode] = useState(false);
  const [editWardId, setEditWardId] = useState<string | null>(null);
  const [wardForm, setWardForm] = useState({
    name: '',
    ward_code: '',
    type: 'General',
    capacity: 0,
    department_id: '',
    head_nurse_id: '',
    status: 'Active'
  });

  // Modal State for Room
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editRoomMode, setEditRoomMode] = useState(false);
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    ward_id: '',
    type: 'General',
    capacity: 1,
    status: 'Active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Departments for dropdown
    const { data: deptData } = await supabase.from('departments').select('id, name').order('name');
    if (deptData) setDepartments(deptData);
    
    // Fetch Nurses for dropdown (fallback to null if table not ready)
    const { data: nurseData, error: nurseErr } = await supabase.from('nurses').select('id, first_name, last_name');
    if (nurseData && !nurseErr) setNurses(nurseData);

    // Fetch Wards
    const { data: wardsData, error: wardErr } = await supabase
      .from('wards')
      .select('*, departments(name)')
      .order('name');
    
    // Fetch Rooms
    const { data: roomsData, error: roomErr } = await supabase
      .from('rooms')
      .select('*, wards(name, type)')
      .order('room_number');

    if (wardsData) setWards(wardsData);
    if (roomsData) setRooms(roomsData);
    
    setLoading(false);
  };

  // --- WARD HANDLERS ---
  const handleOpenAddWard = () => {
    setWardForm({ name: '', ward_code: '', type: 'General', capacity: 0, department_id: '', head_nurse_id: '', status: 'Active' });
    setEditWardMode(false);
    setEditWardId(null);
    setShowWardModal(true);
  };

  const handleOpenEditWard = (ward: any) => {
    setWardForm({
      name: ward.name || '',
      ward_code: ward.ward_code || '',
      type: ward.type || 'General',
      capacity: ward.capacity || 0,
      department_id: ward.department_id || '',
      head_nurse_id: ward.head_nurse_id || '',
      status: ward.status || 'Active'
    });
    setEditWardId(ward.id);
    setEditWardMode(true);
    setShowWardModal(true);
  };

  const handleSaveWard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const saveData = {
      name: wardForm.name,
      ward_code: wardForm.ward_code || null,
      type: wardForm.type,
      capacity: Number(wardForm.capacity),
      department_id: wardForm.department_id || null,
      head_nurse_id: wardForm.head_nurse_id || null,
      status: wardForm.status
    };

    if (editWardMode && editWardId) {
      const { error } = await supabase.from('wards').update(saveData).eq('id', editWardId);
      if (error) showAlert('Error updating ward: ' + error.message);
      else { setShowWardModal(false); fetchData(); }
    } else {
      const { error } = await supabase.from('wards').insert([saveData]);
      if (error) showAlert('Error adding ward: ' + error.message);
      else { setShowWardModal(false); fetchData(); }
    }
    setSubmitting(false);
  };

  const handleDeleteWard = async (id: string) => {
    const confirm = await showConfirm('Delete this ward? This will cascade delete rooms in it.');
    if (!confirm) return;
    const { error } = await supabase.from('wards').delete().eq('id', id);
    if (error) showAlert('Error: ' + error.message);
    else fetchData();
  };

  // --- ROOM HANDLERS ---
  const handleOpenAddRoom = () => {
    setRoomForm({ room_number: '', ward_id: '', type: 'General', capacity: 1, status: 'Active' });
    setEditRoomMode(false);
    setEditRoomId(null);
    setShowRoomModal(true);
  };

  const handleOpenEditRoom = (room: any) => {
    setRoomForm({
      room_number: room.room_number || '',
      ward_id: room.ward_id || '',
      type: room.type || 'General',
      capacity: room.capacity || 1,
      status: room.status || 'Active'
    });
    setEditRoomId(room.id);
    setEditRoomMode(true);
    setShowRoomModal(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.ward_id) {
      showAlert('Please select a ward.');
      return;
    }
    setSubmitting(true);
    const saveData = {
      room_number: roomForm.room_number,
      ward_id: roomForm.ward_id,
      type: roomForm.type,
      capacity: Number(roomForm.capacity),
      status: roomForm.status
    };

    if (editRoomMode && editRoomId) {
      const { error } = await supabase.from('rooms').update(saveData).eq('id', editRoomId);
      if (error) showAlert('Error updating room: ' + error.message);
      else { setShowRoomModal(false); fetchData(); }
    } else {
      const { error } = await supabase.from('rooms').insert([saveData]);
      if (error) showAlert('Error adding room: ' + error.message);
      else { setShowRoomModal(false); fetchData(); }
    }
    setSubmitting(false);
  };

  const handleDeleteRoom = async (id: string) => {
    const confirm = await showConfirm('Delete this room? Beds linked to it will also be deleted.');
    if (!confirm) return;
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) showAlert('Error: ' + error.message);
    else fetchData();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Wards & Rooms</h1>
          <p className={styles.details}>Manage hospital wards, rooms, and allocations.</p>
        </div>
        <div className={styles.actions}>
          <button 
            className={activeTab === 'wards' ? styles.btnPrimary : styles.btnOutline} 
            onClick={() => setActiveTab('wards')}
          >
            <Building size={20} /> Wards
          </button>
          <button 
            className={activeTab === 'rooms' ? styles.btnPrimary : styles.btnOutline} 
            onClick={() => setActiveTab('rooms')}
          >
            <Building size={20} /> Rooms
          </button>
        </div>
      </header>

      {/* WARDS TAB */}
      {activeTab === 'wards' && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Hospital Wards</h2>
            <button className={styles.btnPrimary} onClick={handleOpenAddWard}>
              <Plus size={18} /> Add Ward
            </button>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ward Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wards.map((ward) => (
                    <tr key={ward.id}>
                      <td style={{ fontWeight: 600 }}>{ward.name}</td>
                      <td>{ward.ward_code || '-'}</td>
                      <td>{ward.type}</td>
                      <td>{ward.departments?.name || '-'}</td>
                      <td>{ward.capacity}</td>
                      <td>
                        <span className={`${styles.badge} ${ward.status === 'Active' ? styles.badgeSuccess : styles.badgeDanger}`}>
                          {ward.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none' }} onClick={() => handleOpenEditWard(ward)} title="Edit"><Edit2 size={18} /></button>
                          <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none', color: '#dc2626' }} onClick={() => handleDeleteWard(ward.id)} title="Delete"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {wards.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No wards configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ROOMS TAB */}
      {activeTab === 'rooms' && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Hospital Rooms</h2>
            <button className={styles.btnPrimary} onClick={handleOpenAddRoom}>
              <Plus size={18} /> Add Room
            </button>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Room Number</th>
                    <th>Ward</th>
                    <th>Room Type</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td style={{ fontWeight: 600 }}>{room.room_number}</td>
                      <td>{room.wards?.name || '-'}</td>
                      <td>{room.type || '-'}</td>
                      <td>{room.capacity || 1}</td>
                      <td>
                        <span className={`${styles.badge} ${room.status === 'Active' ? styles.badgeSuccess : styles.badgeDanger}`}>
                          {room.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none' }} onClick={() => handleOpenEditRoom(room)} title="Edit"><Edit2 size={18} /></button>
                          <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none', color: '#dc2626' }} onClick={() => handleDeleteRoom(room.id)} title="Delete"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rooms.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No rooms configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* WARD MODAL */}
      {showWardModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editWardMode ? 'Edit' : 'Add'} Ward</h2>
            <form onSubmit={handleSaveWard}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label>Ward Name</label>
                  <input required type="text" value={wardForm.name} onChange={e => setWardForm({...wardForm, name: e.target.value})} placeholder="e.g., General Ward A" />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Ward Code</label>
                  <input type="text" value={wardForm.ward_code} onChange={e => setWardForm({...wardForm, ward_code: e.target.value})} placeholder="e.g., GW-A" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Ward Type</label>
                  <select value={wardForm.type} onChange={e => setWardForm({...wardForm, type: e.target.value})}>
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Private">Private</option>
                    <option value="Semi-Private">Semi-Private</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Capacity</label>
                  <input required type="number" min="0" value={wardForm.capacity} onChange={e => setWardForm({...wardForm, capacity: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Department</label>
                  <select value={wardForm.department_id} onChange={e => setWardForm({...wardForm, department_id: e.target.value})}>
                    <option value="">None</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Head Nurse</label>
                  <select value={wardForm.head_nurse_id} onChange={e => setWardForm({...wardForm, head_nurse_id: e.target.value})}>
                    <option value="">None</option>
                    {nurses.map(n => (
                      <option key={n.id} value={n.id}>{n.first_name} {n.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Status</label>
                <select value={wardForm.status} onChange={e => setWardForm({...wardForm, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowWardModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROOM MODAL */}
      {showRoomModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editRoomMode ? 'Edit' : 'Add'} Room</h2>
            <form onSubmit={handleSaveRoom}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Room Number</label>
                  <input required type="text" value={roomForm.room_number} onChange={e => setRoomForm({...roomForm, room_number: e.target.value})} placeholder="e.g., 101" />
                </div>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label>Ward</label>
                  <select required value={roomForm.ward_id} onChange={e => setRoomForm({...roomForm, ward_id: e.target.value})}>
                    <option value="">-- Select Ward --</option>
                    {wards.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Room Type</label>
                  <select value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})}>
                    <option value="General">General</option>
                    <option value="Private">Private</option>
                    <option value="Semi-Private">Semi-Private</option>
                    <option value="ICU">ICU</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Capacity (Beds)</label>
                  <input required type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: parseInt(e.target.value) || 1})} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Status</label>
                <select value={roomForm.status} onChange={e => setRoomForm({...roomForm, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowRoomModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
