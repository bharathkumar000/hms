'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';
import { Search, Calculator, CheckCircle2, Receipt } from 'lucide-react';
import styles from './generate.module.css';

export default function GenerateBillPage() {
  const { showAlert, showConfirm } = useModal();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [pendingBill, setPendingBill] = useState<any>(null);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const supabase = createClient();

  useEffect(() => {
    fetchPatientsWithPendingBills();
  }, [searchQuery]);

  const fetchPatientsWithPendingBills = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select(`
      id,
      first_name,
      last_name,
      phone_number,
      bills!inner(id, status, created_at)
    `).eq('bills.status', 'Pending');

    if (searchQuery) {
      query = query.ilike('first_name', `%${searchQuery}%`);
    }

    const { data } = await query;
    if (data) {
      // Deduplicate patients since inner join might return multiples if multiple pending bills exist
      const uniquePatients = Array.from(new Map(data.map((item: any) => [item.id, item])).values());
      setPatients(uniquePatients);
    }
    setLoading(false);
  };

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setDiscount(0);
    setTaxPercent(5);
    
    // Fetch the earliest pending bill for this patient
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'Pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (bills && bills.length > 0) {
      const currentBill = bills[0];
      setPendingBill(currentBill);
      
      const { data: items } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', currentBill.id);
        
      setBillItems(items || []);
    }
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = (subtotal * taxPercent) / 100;
    const totalAmount = subtotal + tax - discount;
    return { subtotal, tax, totalAmount: Math.max(0, totalAmount) };
  };

  const handleProcessPayment = async () => {
    const { subtotal, tax, totalAmount } = calculateTotals();
    
    if (totalAmount <= 0) {
      showAlert('Total amount must be greater than zero.');
      return;
    }

    if (await showConfirm(`Confirm payment of ₹${totalAmount.toFixed(2)} via ${paymentMethod}?`)) {
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Update Bill
      const { error: billError } = await supabase
        .from('bills')
        .update({
          subtotal,
          tax,
          discount,
          total_amount: totalAmount,
          amount_paid: totalAmount,
          status: 'Paid',
          invoice_number: invoiceNumber
        })
        .eq('id', pendingBill.id);

      if (billError) {
        showAlert('Error updating bill: ' + billError.message);
        return;
      }

      // 2. Create Payment Record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          bill_id: pendingBill.id,
          patient_id: selectedPatient.id,
          amount: totalAmount,
          payment_method: paymentMethod,
          transaction_id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`
        }]);

      if (paymentError) {
        showAlert('Error recording payment: ' + paymentError.message);
      } else {
        showAlert(`Payment successful! Invoice ${invoiceNumber} generated.`);
        setSelectedPatient(null);
        setPendingBill(null);
        setBillItems([]);
        fetchPatientsWithPendingBills();
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Generate Final Bill</h1>
          <p className={styles.details}>Consolidate charges and process payments.</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Left Column: Select Patient */}
        <div style={{ flex: 1 }}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem' }}>Select Patient</h2>
            <div className={styles.searchBar} style={{ display: 'flex', alignItems: 'center', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.5rem 1rem', marginBottom: '1.5rem' }}>
              <Search size={20} color="var(--color-text-secondary)" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" 
                placeholder="Search patients with pending bills..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--color-text-primary)' }}
              />
            </div>
            
            {loading ? (
              <p>Searching...</p>
            ) : (
              <div className={styles.list}>
                {patients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className={styles.listItem} 
                    style={{ cursor: 'pointer', border: selectedPatient?.id === patient.id ? '2px solid var(--color-primary)' : '' }}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className={styles.itemContent}>
                      <h4>{patient.first_name} {patient.last_name}</h4>
                      <p>Phone: {patient.phone_number}</p>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>
                      Select
                    </div>
                  </div>
                ))}
                {patients.length === 0 && (
                  <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>No pending bills found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice Details */}
        <div style={{ flex: 2 }}>
          {selectedPatient && pendingBill ? (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>Invoice Summary</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Patient: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                  <p>Bill ID: {pendingBill.id.substring(0, 8)}</p>
                  <p>Date: {new Date(pendingBill.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0' }}>Item Description</th>
                      <th style={{ padding: '0.75rem 0' }}>Type</th>
                      <th style={{ padding: '0.75rem 0' }}>Qty</th>
                      <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Price (₹)</th>
                      <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>{item.item_name}</td>
                        <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>{item.item_type}</td>
                        <td style={{ padding: '0.75rem 0' }}>{item.quantity}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{Number(item.unit_price).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>{Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                    {billItems.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No items added to this bill yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {billItems.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                    <div style={{ width: '300px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>Subtotal:</span>
                        <span style={{ fontWeight: 600 }}>₹{calculateTotals().subtotal.toFixed(2)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <span>Tax (%):</span>
                        <input 
                          type="number" 
                          min="0"
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(Number(e.target.value))}
                          style={{ width: '80px', padding: '0.25rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <span>Discount (₹):</span>
                        <input 
                          type="number" 
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          style={{ width: '80px', padding: '0.25rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--color-border)', fontSize: '1.25rem', fontWeight: 700 }}>
                        <span>Grand Total:</span>
                        <span>₹{calculateTotals().totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-background)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Payment Details</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Payment Method</label>
                        <select 
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text-primary)' }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <button 
                          className={styles.btnPrimary} 
                          style={{ width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                          onClick={handleProcessPayment}
                        >
                          <CheckCircle2 size={20} /> Process Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--color-text-secondary)' }}>
              <Receipt size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3>No Patient Selected</h3>
              <p>Select a patient from the list to generate their final bill.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
