'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClipboardList, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './prescriptions.module.css';

export default function PharmacyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); // Pending, Completed, All
  
  // Dispense Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [dispenseQty, setDispenseQty] = useState(1);
  const [pharmacistId, setPharmacistId] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchPrescriptions();
    fetchPharmacistId();
  }, [filter]);

  const fetchPharmacistId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('pharmacists').select('id').eq('user_id', user.id).single();
      if (data) setPharmacistId(data.id);
    }
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    let query = supabase
      .from('prescriptions')
      .select('*, profiles(first_name, last_name, phone_number), doctors(first_name, last_name)')
      .order('created_at', { ascending: false });

    if (filter === 'Pending') {
      query = query.in('dispense_status', ['Pending', 'Partially Dispensed']);
    } else if (filter === 'Completed') {
      query = query.eq('dispense_status', 'Completed');
    }

    const { data } = await query;
    if (data) setPrescriptions(data);
    setLoading(false);
  };

  const openDispenseModal = async (prescription: any) => {
    setSelectedPrescription(prescription);
    
    // Fetch available batches with stock > 0
    const { data: batches } = await supabase
      .from('medicine_batches')
      .select('*, medicines(name)')
      .gt('quantity', 0)
      .order('expiry_date', { ascending: true }); // FEFO (First Expire First Out)
      
    if (batches) {
      setInventory(batches);
      if (batches.length > 0) setSelectedBatchId(batches[0].id);
    }
    
    setDispenseQty(1);
    setShowModal(true);
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescription || !selectedBatchId) return;

    const batch = inventory.find(b => b.id === selectedBatchId);
    if (!batch || batch.quantity < dispenseQty) {
      alert('Insufficient stock in selected batch!');
      return;
    }

    // 1. Deduct stock from batch
    await supabase.from('medicine_batches').update({ quantity: batch.quantity - dispenseQty }).eq('id', batch.id);

    // 2. Record stock transaction
    await supabase.from('stock_transactions').insert({
      medicine_id: batch.medicine_id,
      batch_id: batch.id,
      transaction_type: 'OUT',
      quantity: dispenseQty,
      reference_type: 'Prescription',
      reference_id: selectedPrescription.id,
      notes: `Dispensed to patient ${selectedPrescription.profiles?.first_name}`
    });

    // 3. Update prescription
    const totalDispensed = (selectedPrescription.dispensed_quantity || 0) + dispenseQty;
    // We assume if they click Complete in the UI, they want to close it out.
    // We'll leave it 'Completed' here, though in reality it might be 'Partially Dispensed'
    
    await supabase.from('prescriptions').update({
      dispensed_quantity: totalDispensed,
      dispense_status: 'Completed',
      pharmacist_id: pharmacistId || null,
      dispense_date: new Date().toISOString()
    }).eq('id', selectedPrescription.id);

    setShowModal(false);
    fetchPrescriptions();
    alert('Medicine dispensed successfully!');
  };

  const getStatusClass = (status: string) => {
    if (status === 'Completed') return styles.statusCompleted;
    if (status === 'Partially Dispensed') return styles.statusPartial;
    return styles.statusPending;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Prescription Management</h1>
          <p className={styles.details}>Review e-prescriptions and dispense medicines securely.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup}>
          <select 
            className={styles.filterSelect} 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Pending">Pending / Active</option>
            <option value="Completed">Completed</option>
            <option value="All">All Prescriptions</option>
          </select>
        </div>

        {loading ? (
          <p>Loading prescriptions...</p>
        ) : prescriptions.length > 0 ? (
          <div className={styles.list}>
            {prescriptions.map(p => (
              <div key={p.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <ClipboardList size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                    {p.medicine_name}
                  </div>
                  <div className={styles.itemSub} style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Rx: {p.dosage} | {p.frequency} | {p.duration}
                  </div>
                  <div className={styles.itemSub}>
                    Patient: {p.profiles?.first_name} {p.profiles?.last_name} | Ph: {p.profiles?.phone_number}
                  </div>
                  <div className={styles.itemSub}>
                    Doctor: Dr. {p.doctors?.first_name} {p.doctors?.last_name}
                  </div>
                  <div className={styles.itemSub} style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Prescribed: {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(p.dispense_status || 'Pending')}`}>
                    {p.dispense_status || 'Pending'}
                  </span>
                  
                  {p.dispensed_quantity > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                      Dispensed: {p.dispensed_quantity}
                    </div>
                  )}
                  
                  {(p.dispense_status === 'Pending' || p.dispense_status === 'Partially Dispensed' || !p.dispense_status) && (
                    <div className={styles.actions}>
                      <button className={styles.btnPrimary} onClick={() => openDispenseModal(p)}>
                        Dispense Medicine
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No prescriptions found for this filter.</p>
        )}
      </div>

      {showModal && selectedPrescription && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '1rem' }}>Dispense Medicine</h2>
            
            <div style={{ backgroundColor: 'var(--color-light)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> 
                Doctor's Request
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedPrescription.medicine_name}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{selectedPrescription.dosage} | {selectedPrescription.frequency} | {selectedPrescription.duration}</p>
            </div>

            <form onSubmit={handleDispense}>
              <div className={styles.formGroup}>
                <label>Select Medicine & Batch from Inventory to Deduct</label>
                <select required value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}>
                  {inventory.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.medicines?.name} - Batch {b.batch_number} (Stock: {b.quantity}, Exp: {new Date(b.expiry_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  * Pharmacist must map the doctor's free-text request to actual inventory.
                </span>
              </div>
              
              <div className={styles.formGroup}>
                <label>Quantity to Dispense (Units)</label>
                <input required type="number" min="1" value={dispenseQty} onChange={e => setDispenseQty(parseInt(e.target.value))} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>
                  <CheckCircle size={18} /> Complete & Dispense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
