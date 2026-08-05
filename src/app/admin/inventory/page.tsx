'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, AlertTriangle, Package, Stethoscope } from 'lucide-react';
import styles from '../users/users.module.css'; // Reusing user module styles

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState<'pharmacy' | 'equipment'>('pharmacy');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchInventory();
  }, [activeTab]);

  const fetchInventory = async () => {
    setLoading(true);
    if (activeTab === 'pharmacy') {
      const { data } = await supabase.from('medicines').select('*, medicine_batches(quantity)');
      if (data) {
        // Calculate total quantity for each medicine
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
          <button className={styles.btnPrimary}>
            <Plus size={20} /> Add Item
          </button>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'pharmacy' ? styles.activeTab : ''}`} onClick={() => setActiveTab('pharmacy')}>
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
              placeholder={`Search ${activeTab}...`}
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
                {activeTab === 'pharmacy' ? (
                  <tr>
                    <th>Medicine Name</th>
                    <th>Category</th>
                    <th>Total Stock</th>
                    <th>Status</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Equipment Name</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Maintenance Schedule</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === 'pharmacy' ? (
                  filteredMeds.map((med) => {
                    const isLow = med.total_stock <= med.minimum_stock_level;
                    return (
                      <tr key={med.id}>
                        <td style={{ fontWeight: 600 }}>{med.name}</td>
                        <td>{med.category}</td>
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
                      </tr>
                    );
                  })
                ) : (
                  filteredEq.map((eq) => (
                    <tr key={eq.id}>
                      <td style={{ fontWeight: 600 }}>{eq.name}</td>
                      <td>{eq.category}</td>
                      <td>{eq.department}</td>
                      <td>
                        <span className={`${styles.badge} ${
                          eq.status === 'Operational' ? styles.badgeSuccess : 
                          eq.status === 'Maintenance' ? styles.badgeDanger : '' // Assuming 'Maintenance' requires attention
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td>{eq.maintenance_schedule || 'Not scheduled'}</td>
                    </tr>
                  ))
                )}
                
                {(activeTab === 'pharmacy' && filteredMeds.length === 0) && (
                  <tr><td colSpan={4} style={{ textAlign: 'center' }}>No medicines found.</td></tr>
                )}
                {(activeTab === 'equipment' && filteredEq.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No equipment found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
