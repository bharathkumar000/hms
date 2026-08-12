'use client';

import { useState } from 'react';
import { Search, FlaskConical, Wrench, AlertTriangle, Box, Settings2, ShieldAlert } from 'lucide-react';
import styles from './equipment.module.css';

export default function EquipmentClient({ initialEquipment, initialReagents, initialMaintenance }: { initialEquipment: any[], initialReagents: any[], initialMaintenance: any[] }) {
  const [activeTab, setActiveTab] = useState<'reagents' | 'equipment' | 'maintenance'>('reagents');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReagents = initialReagents.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEquipment = initialEquipment.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = initialReagents.filter(r => r.stock_level <= r.minimum_stock).length;
  const expiredCount = initialReagents.filter(r => new Date(r.expiry_date) < new Date()).length;
  const maintDueCount = initialEquipment.filter(e => e.status === 'Maintenance' || new Date(e.maintenance_schedule) < new Date()).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Equipment & Inventory</h1>
          <p className={styles.subtitle}>Manage laboratory equipment, maintenance, and reagent stock.</p>
        </div>
      </header>

      {/* Alerts Section */}
      {(lowStockCount > 0 || expiredCount > 0 || maintDueCount > 0) && (
        <div className={styles.alertsContainer}>
          {lowStockCount > 0 && (
            <div className={styles.alertCard}>
              <AlertTriangle size={20} color="#a16207" />
              <span><strong>{lowStockCount}</strong> reagents are low on stock.</span>
            </div>
          )}
          {expiredCount > 0 && (
            <div className={styles.alertCardDanger}>
              <ShieldAlert size={20} color="#dc2626" />
              <span><strong>{expiredCount}</strong> reagents have expired.</span>
            </div>
          )}
          {maintDueCount > 0 && (
            <div className={styles.alertCardWarning}>
              <Wrench size={20} color="#c2410c" />
              <span><strong>{maintDueCount}</strong> equipment items need maintenance.</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'reagents' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('reagents')}
        >
          <Box size={16} /> Reagents & Consumables
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'equipment' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          <FlaskConical size={16} /> Laboratory Equipment
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'maintenance' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Settings2 size={16} /> Maintenance Logs
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'reagents' && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reagent Name</th>
                  <th>Manufacturer</th>
                  <th>Stock Level</th>
                  <th>Status</th>
                  <th>Expiry Date</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredReagents.map(reagent => {
                  const isLowStock = reagent.stock_level <= reagent.minimum_stock;
                  const isExpired = new Date(reagent.expiry_date) < new Date();
                  return (
                    <tr key={reagent.id}>
                      <td><strong>{reagent.name}</strong></td>
                      <td>{reagent.manufacturer}</td>
                      <td>
                        <span className={isLowStock ? styles.textDanger : ''}>
                          {reagent.stock_level} {reagent.unit}
                        </span>
                        <span className={styles.textSecondary}> (Min: {reagent.minimum_stock})</span>
                      </td>
                      <td>
                        {isExpired ? (
                          <span className={styles.badgeDanger}>Expired</span>
                        ) : isLowStock ? (
                          <span className={styles.badgeWarning}>Low Stock</span>
                        ) : (
                          <span className={styles.badgeSuccess}>Optimal</span>
                        )}
                      </td>
                      <td className={isExpired ? styles.textDanger : ''}>
                        {new Date(reagent.expiry_date).toLocaleDateString()}
                      </td>
                      <td>{reagent.location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredReagents.length === 0 && <p className={styles.emptyText}>No reagents found.</p>}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className={styles.grid}>
            {filteredEquipment.map(eq => (
              <div key={eq.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.itemName}>{eq.name}</h3>
                  <span className={`${styles.statusBadge} ${eq.status === 'Operational' ? styles.statusOperational : eq.status === 'Maintenance' ? styles.statusMaintenance : styles.statusFaulty}`}>
                    {eq.status}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <p><strong>Category:</strong> {eq.category}</p>
                  <p><strong>Location:</strong> {eq.location}</p>
                  <p><strong>Next Maintenance:</strong> {new Date(eq.maintenance_schedule).toLocaleDateString()}</p>
                </div>
                <div className={styles.cardFooter}>
                  <button className={styles.btnSecondary}>Report Fault</button>
                  <button className={styles.btnPrimary}>Schedule Maintenance</button>
                </div>
              </div>
            ))}
            {filteredEquipment.length === 0 && <p className={styles.emptyText}>No equipment found.</p>}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {initialMaintenance.map(log => (
                  <tr key={log.id}>
                    <td><strong>{log.equipment?.name}</strong></td>
                    <td>{log.maintenance_type}</td>
                    <td>{new Date(log.scheduled_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${log.status === 'Completed' ? styles.statusOperational : styles.statusMaintenance}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>{log.performed_by || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {initialMaintenance.length === 0 && <p className={styles.emptyText}>No maintenance logs found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
