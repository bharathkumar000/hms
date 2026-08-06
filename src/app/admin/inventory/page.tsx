'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import styles from '../users/users.module.css'; 

export default function AdminInventory() {
  const { showAlert, showConfirm } = useModal();

  const [activeTab, setActiveTab] = useState<'medicines' | 'equipment'>('medicines');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const supabase = createClient();

  useEffect(() => {
    fetchInventory();
  }, [activeTab]);

  const fetchInventory = async () => {
    setLoading(true);
    if (activeTab === 'medicines') {
      const { data } = await supabase.from('medicines').select('*, medicine_batches(quantity)');
      if (data) {
        const meds = data.map(m => ({
          ...m,
          total_stock: m.medicine_batches ? m.medicine_batches.reduce((sum: number, b: any) => sum + b.quantity, 0) : 0
        }));
        setMedicines(meds);
      }
    } else {
      const { data } = await supabase.from('equipment').select('*');
      if (data) setEquipment(data);
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    if (activeTab === 'medicines') {
      setFormData({ name: '', category: '', manufacturer: '', minimum_stock_level: 10 });
    } else {
      setFormData({ name: '', category: '', department: '', status: 'Operational', maintenance_schedule: '' });
    }
    setEditMode(false);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ ...item });
    setEditingId(item.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const savePayload = { ...formData };
    delete savePayload.total_stock;
    delete savePayload.medicine_batches;

    if (editMode && editingId) {
      const { error } = await supabase.from(activeTab).update(savePayload).eq('id', editingId);
      if (error) showAlert('Error updating item: ' + error.message);
      else { setShowModal(false); fetchInventory(); }
    } else {
      const { error } = await supabase.from(activeTab).insert([savePayload]);
      if (error) showAlert('Error adding item: ' + error.message);
      else { setShowModal(false); fetchInventory(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm('Are you sure you want to delete this record?')) return;
    const { error } = await supabase.from(activeTab).delete().eq('id', id);
    if (error) showAlert('Error deleting item: ' + error.message);
    else fetchInventory();
  };

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEq = equipment.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory Overview</h1>
          <p className={styles.details}>Monitor hospital equipment and pharmacy stock levels.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleOpenAdd}>
            <Plus size={20} /> Add Item
          </button>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'medicines' ? styles.activeTab : ''}`} onClick={() => setActiveTab('medicines')}>
             Pharmacy Stock
          </button>
          <button className={`${styles.tab} ${activeTab === 'equipment' ? styles.activeTab : ''}`} onClick={() => setActiveTab('equipment')}>
             Hospital Equipment
          </button>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder={`Search ${activeTab === 'medicines' ? 'Pharmacy' : 'Equipment'}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading inventory...
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                {activeTab === 'medicines' ? (
                  <tr>
                    <th>Medicine Name</th>
                    <th>Category</th>
                    <th>Manufacturer</th>
                    <th>Total Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Equipment Name</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === 'medicines' ? (
                  filteredMeds.map((med) => {
                    const isLow = med.total_stock <= med.minimum_stock_level;
                    return (
                      <tr key={med.id}>
                        <td style={{ fontWeight: 600 }}>{med.name}</td>
                        <td>{med.category || '-'}</td>
                        <td>{med.manufacturer || '-'}</td>
                        <td style={{ color: isLow ? '#dc2626' : 'inherit', fontWeight: isLow ? 600 : 400 }}>
                          {med.total_stock}
                        </td>
                        <td>
                          {isLow ? (
                             <span className={`${styles.badge} ${styles.badgeDanger}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                               <AlertTriangle size={12} /> Low Stock
                             </span>
                          ) : (
                             <span className={`${styles.badge} ${styles.badgeSuccess}`}>Adequate</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none' }} onClick={() => handleOpenEdit(med)}>
                              <Edit2 size={18} />
                            </button>
                            <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none', color: '#dc2626' }} onClick={() => handleDelete(med.id)}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  filteredEq.map((eq) => (
                    <tr key={eq.id}>
                      <td style={{ fontWeight: 600 }}>{eq.name}</td>
                      <td>{eq.category || '-'}</td>
                      <td>{eq.department || '-'}</td>
                      <td>
                        <span className={`${styles.badge} ${
                          eq.status === 'Operational' ? styles.badgeSuccess : 
                          eq.status === 'Faulty' ? styles.badgeDanger : '' 
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none' }} onClick={() => handleOpenEdit(eq)}>
                            <Edit2 size={18} />
                          </button>
                          <button className={styles.btnOutline} style={{ padding: '0.4rem', border: 'none', color: '#dc2626' }} onClick={() => handleDelete(eq.id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                
                {(activeTab === 'medicines' && filteredMeds.length === 0) && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No medicines found.</td></tr>
                )}
                {(activeTab === 'equipment' && filteredEq.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No equipment found.</td></tr>
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
              {editMode ? 'Edit' : 'Add New'} {activeTab === 'medicines' ? 'Medicine' : 'Equipment'}
            </h2>
            <form onSubmit={handleSave}>
              {activeTab === 'medicines' ? (
                <>
                  <div className={styles.formGroup}>
                    <label>Medicine Name</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>Category</label>
                      <input type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>Manufacturer</label>
                      <input type="text" value={formData.manufacturer || ''} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Minimum Stock Level</label>
                    <input required type="number" min={0} value={formData.minimum_stock_level || ''} onChange={e => setFormData({...formData, minimum_stock_level: parseInt(e.target.value)})} />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label>Equipment Name</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>Category</label>
                      <input type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>Department</label>
                      <input type="text" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select value={formData.status || 'Operational'} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Operational">Operational</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Faulty">Faulty</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>{editMode ? 'Save Changes' : 'Save Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
