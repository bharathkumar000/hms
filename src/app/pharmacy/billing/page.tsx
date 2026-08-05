'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Receipt, Search, IndianRupee } from 'lucide-react';
import styles from '../prescriptions/prescriptions.module.css';

export default function PharmacyBilling() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Search Patients
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    amount: 0,
    description: 'Pharmacy Bill - Medicines Dispensed',
    due_date: new Date().toISOString().split('T')[0]
  });

  const supabase = createClient();

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  const fetchBills = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bills')
      .select('*, profiles(first_name, last_name, phone_number)')
      .eq('bill_type', 'Pharmacy')
      .order('created_at', { ascending: false });
    
    if (data) setBills(data);
    setLoading(false);
  };

  const searchPatients = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone_number')
      .ilike('first_name', `%${searchQuery}%`)
      .limit(5);
    if (data) setPatients(data);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) {
      alert('Please select a patient.');
      return;
    }
    
    const { error } = await supabase
      .from('bills')
      .insert([{
        ...formData,
        bill_type: 'Pharmacy',
        status: 'Pending'
      }]);
    
    if (!error) {
      setShowModal(false);
      setFormData({ patient_id: '', amount: 0, description: 'Pharmacy Bill - Medicines Dispensed', due_date: new Date().toISOString().split('T')[0] });
      setSearchQuery('');
      fetchBills();
      alert('Bill generated successfully! Payment can be received in the Patient Portal or Reception.');
    } else {
      alert('Error creating bill: ' + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pharmacy Billing</h1>
          <p className={styles.details}>Generate POS bills for medicines dispensed.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <Receipt size={20} /> Generate Bill
          </button>
        </div>
      </header>

      <div className={styles.card}>
        {loading ? (
          <p>Loading bills...</p>
        ) : (
          <div className={styles.list}>
            {bills.map(bill => (
              <div key={bill.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <IndianRupee size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                    ₹{bill.amount} - {bill.description}
                  </div>
                  <div className={styles.itemSub}>
                    Patient: {bill.profiles?.first_name} {bill.profiles?.last_name} | Ph: {bill.profiles?.phone_number}
                  </div>
                  <div className={styles.itemSub} style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    Date: {new Date(bill.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${bill.status === 'Paid' ? styles.statusCompleted : styles.statusPending}`}>
                    {bill.status}
                  </span>
                </div>
              </div>
            ))}
            {bills.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)' }}>No pharmacy bills found.</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '1.5rem' }}>Generate Pharmacy Bill</h2>
            
            <form onSubmit={handleCreateBill}>
              <div className={styles.formGroup}>
                <label>Search Patient</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'gray' }}/>
                  <input 
                    type="text" 
                    placeholder="Type patient name..." 
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setFormData({...formData, patient_id: ''}); }}
                    style={{ width: '100%', paddingLeft: '2rem' }}
                  />
                </div>
                {patients.length > 0 && !formData.patient_id && (
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', marginTop: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                    {patients.map(p => (
                      <div 
                        key={p.id} 
                        style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}
                        onClick={() => { setFormData({...formData, patient_id: p.id}); setSearchQuery(`${p.first_name} ${p.last_name}`); setPatients([]); }}
                      >
                        {p.first_name} {p.last_name} ({p.phone_number})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label>Total Amount (₹)</label>
                <input required type="number" step="0.01" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={!formData.patient_id}>Create Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
