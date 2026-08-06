'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react';
import styles from '../inventory/inventory.module.css'; // Reusing inventory CSS

export default function PharmacySuppliers() {
  const { showAlert, showConfirm } = useModal();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  const supabase = createClient();

  useEffect(() => {
    fetchSuppliers();
  }, [searchQuery]);

  const fetchSuppliers = async () => {
    setLoading(true);
    let query = supabase.from('suppliers').select('*');
    
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (data) setSuppliers(data);
    setLoading(false);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('suppliers').insert([formData]);
    
    if (!error) {
      setShowModal(false);
      setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
      fetchSuppliers();
    } else {
      showAlert('Error adding supplier: ' + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Suppliers Directory</h1>
          <p className={styles.details}>Manage pharmaceutical suppliers and vendors.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <Plus size={20} /> Add Supplier
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
              placeholder="Search suppliers by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading suppliers...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {suppliers.map((supplier) => (
              <div key={supplier.id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', backgroundColor: 'var(--color-card-bg)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={20} color="var(--color-primary)" /> {supplier.name}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Contact: {supplier.contact_person}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={16} color="var(--color-text-secondary)" /> {supplier.phone || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} color="var(--color-text-secondary)" /> {supplier.email || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)' }}>No suppliers found.</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Supplier</h2>
            <form onSubmit={handleAddSupplier}>
              <div className={styles.formGroup}>
                <label>Company / Supplier Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Contact Person</label>
                <input required type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Address</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
