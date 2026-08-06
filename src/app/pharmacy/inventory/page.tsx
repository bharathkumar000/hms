'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Search, Edit2 } from 'lucide-react';
import styles from './inventory.module.css';

export default function PharmacyInventory() {
  const { showAlert, showConfirm } = useModal();

  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tablet',
    manufacturer: '',
    price_per_unit: 0,
    minimum_stock_level: 10
  });

  const supabase = createClient();

  useEffect(() => {
    fetchInventory();
  }, [searchQuery]);

  const fetchInventory = async () => {
    setLoading(true);
    
    // We want to fetch medicines and their total stock from batches
    const { data: meds } = await supabase
      .from('medicines')
      .select('*, medicine_batches(quantity)');
    
    if (meds) {
      // Calculate total stock for each medicine
      let formattedMeds = meds.map(m => {
        const totalStock = m.medicine_batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
        return { ...m, totalStock };
      });

      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        formattedMeds = formattedMeds.filter(m => m.name.toLowerCase().includes(lowerQ));
      }

      setMedicines(formattedMeds);
    }
    setLoading(false);
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('medicines')
      .insert([formData]);
    
    if (!error) {
      setShowModal(false);
      setFormData({ name: '', category: 'Tablet', manufacturer: '', price_per_unit: 0, minimum_stock_level: 10 });
      fetchInventory();
    } else {
      showAlert('Error adding medicine: ' + error.message);
    }
  };

  const getStockBadge = (stock: number, minStock: number) => {
    if (stock === 0) return <span className={`${styles.badge} ${styles.badgeDanger}`}>Out of Stock</span>;
    if (stock <= minStock) return <span className={`${styles.badge} ${styles.badgeWarning}`}>Low Stock</span>;
    return <span className={`${styles.badge} ${styles.badgeSuccess}`}>In Stock</span>;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory Management</h1>
          <p className={styles.details}>Manage medicine catalog and stock levels.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <Plus size={20} /> Add Medicine
          </button>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search medicines by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading inventory...</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                  <th>Price/Unit (₹)</th>
                  <th>Total Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => (
                  <tr key={med.id}>
                    <td style={{ fontWeight: 600 }}>{med.name}</td>
                    <td>{med.category}</td>
                    <td>{med.manufacturer}</td>
                    <td>₹{med.price_per_unit}</td>
                    <td style={{ fontWeight: 700 }}>{med.totalStock}</td>
                    <td>{getStockBadge(med.totalStock, med.minimum_stock_level)}</td>
                    <td>
                      <button className={styles.btnOutline} style={{ padding: '0.5rem', display: 'flex' }} title="Edit Medicine">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {medicines.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No medicines found.
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
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Medicine</h2>
            <form onSubmit={handleAddMedicine}>
              <div className={styles.formGroup}>
                <label>Medicine Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className={styles.formGroup}>
                <label>Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drops">Drops</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Manufacturer</label>
                <input required type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Price Per Unit (₹)</label>
                  <input required type="number" step="0.01" min="0" value={formData.price_per_unit} onChange={e => setFormData({...formData, price_per_unit: parseFloat(e.target.value)})} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Min Stock Alert Level</label>
                  <input required type="number" min="0" value={formData.minimum_stock_level} onChange={e => setFormData({...formData, minimum_stock_level: parseInt(e.target.value)})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
