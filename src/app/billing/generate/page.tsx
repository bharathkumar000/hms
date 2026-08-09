'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';
import { Search, Calculator, CheckCircle2, Receipt, Plus, Trash2 } from 'lucide-react';
import styles from './generate.module.css';

export default function GenerateBillPage() {
  const { showAlert, showConfirm } = useModal();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [pendingBill, setPendingBill] = useState<any>(null);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  // New Charge State
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('Consultation');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  const supabase = createClient();

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchPatients();
    } else if (searchQuery.length === 0) {
      fetchPatientsWithPendingBills();
    }
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

    const { data } = await query;
    if (data) {
      const uniquePatients = Array.from(new Map(data.map((item: any) => [item.id, item])).values());
      setPatients(uniquePatients);
    }
    setLoading(false);
  };

  const searchPatients = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles')
      .select('id, first_name, last_name, phone_number')
      .in('role', ['Patient'])
      .ilike('first_name', `%${searchQuery}%`);
      
    if (data) setPatients(data);
    setLoading(false);
  };

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setDiscount(0);
    setTaxPercent(5);
    setPendingBill(null);
    setBillItems([]);
    
    // Fetch the earliest pending or partially paid bill for this patient
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('patient_id', patient.id)
      .in('status', ['Pending', 'Partially Paid'])
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
      setDiscount(Number(currentBill.discount) || 0);
      setTaxPercent(currentBill.tax > 0 ? (currentBill.tax / currentBill.subtotal) * 100 : 5);
      
      const sub = (items || []).reduce((sum, item) => sum + Number(item.amount), 0);
      const t = (sub * (currentBill.tax > 0 ? (currentBill.tax / currentBill.subtotal) * 100 : 5)) / 100;
      const tot = sub + t - (Number(currentBill.discount) || 0);
      const remaining = tot - Number(currentBill.amount_paid || 0);
      setPaymentAmount(remaining > 0 ? remaining : '');
    }
  };

  const handleCreateBill = async () => {
    if (!selectedPatient) return;
    
    const { data, error } = await supabase
      .from('bills')
      .insert([{
        patient_id: selectedPatient.id,
        status: 'Pending',
        bill_type: 'General',
        amount: 0,
        subtotal: 0,
        tax: 0,
        total_amount: 0
      }])
      .select()
      .single();

    if (error) {
      showAlert('Error creating bill: ' + error.message);
    } else if (data) {
      setPendingBill(data);
      setBillItems([]);
    }
  };

  const handleAddCharge = async () => {
    if (!pendingBill || !newItemName || !newItemPrice || Number(newItemPrice) <= 0 || newItemQty <= 0) {
      showAlert('Please fill in valid charge details.');
      return;
    }

    const amount = Number(newItemPrice) * newItemQty;

    const { data, error } = await supabase
      .from('bill_items')
      .insert([{
        bill_id: pendingBill.id,
        item_name: newItemName,
        item_type: newItemType,
        quantity: newItemQty,
        unit_price: Number(newItemPrice),
        amount: amount
      }])
      .select()
      .single();

    if (error) {
      showAlert('Error adding charge: ' + error.message);
    } else if (data) {
      setBillItems([...billItems, data]);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty(1);
    }
  };

  const handleRemoveCharge = async (itemId: string) => {
    if (await showConfirm('Remove this charge?')) {
      const { error } = await supabase.from('bill_items').delete().eq('id', itemId);
      if (error) {
        showAlert('Error removing charge: ' + error.message);
      } else {
        setBillItems(billItems.filter(item => item.id !== itemId));
      }
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
    const amountPaidSoFar = Number(pendingBill.amount_paid || 0);
    const remainingBalance = totalAmount - amountPaidSoFar;
    const currentPayment = Number(paymentAmount);
    
    if (currentPayment <= 0) {
      showAlert('Payment amount must be greater than zero.');
      return;
    }

    if (currentPayment > remainingBalance) {
      showAlert(`Payment cannot exceed the remaining balance of ₹${remainingBalance.toFixed(2)}.`);
      return;
    }

    if (await showConfirm(`Confirm payment of ₹${currentPayment.toFixed(2)} via ${paymentMethod}?`)) {
      const invoiceNumber = pendingBill.invoice_number || `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAmountPaid = amountPaidSoFar + currentPayment;
      const newStatus = newAmountPaid >= totalAmount ? 'Paid' : 'Partially Paid';

      // 1. Update Bill
      const { error: billError } = await supabase
        .from('bills')
        .update({
          subtotal,
          tax,
          discount,
          total_amount: totalAmount,
          amount_paid: newAmountPaid,
          status: newStatus,
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
          amount: currentPayment,
          payment_method: paymentMethod,
          transaction_id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`
        }]);

      if (paymentError) {
        showAlert('Error recording payment: ' + paymentError.message);
      } else {
        showAlert(`Payment successful! ${newStatus === 'Paid' ? `Invoice ${invoiceNumber} generated.` : `Remaining Balance: ₹${(totalAmount - newAmountPaid).toFixed(2)}`}`);
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
          <p className={styles.details}>Manage patient bills, add charges, and process payments.</p>
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
                placeholder="Search patient name..." 
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
                  <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>No patients found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice Details */}
        <div style={{ flex: 2 }}>
          {selectedPatient ? (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>Invoice Summary</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Patient: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {pendingBill ? (
                    <>
                      <p style={{ color: 'var(--color-text-secondary)' }}>Bill ID: {pendingBill.id.substring(0, 8)}</p>
                      <p style={{ color: 'var(--color-text-secondary)' }}>Date: {new Date(pendingBill.created_at).toLocaleDateString()}</p>
                    </>
                  ) : (
                    <button onClick={handleCreateBill} className={styles.btnPrimary} style={{ padding: '0.5rem 1rem' }}>
                      <Plus size={16} style={{ marginRight: '0.5rem' }}/> Create New Bill
                    </button>
                  )}
                </div>
              </div>

              {pendingBill && (
                <>
                  <div style={{ marginBottom: '2rem' }}>
                    <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                          <th style={{ padding: '0.75rem 0' }}>Item Description</th>
                          <th style={{ padding: '0.75rem 0' }}>Type</th>
                          <th style={{ padding: '0.75rem 0' }}>Qty</th>
                          <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Price (₹)</th>
                          <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Amount (₹)</th>
                          <th style={{ padding: '0.75rem 0', textAlign: 'right' }}></th>
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
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                              <button 
                                onClick={() => handleRemoveCharge(item.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                title="Remove Charge"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {/* Add Charge Form Row */}
                        <tr>
                          <td style={{ padding: '1rem 0.5rem 0 0' }}>
                            <input 
                              type="text" 
                              placeholder="New Item Name" 
                              value={newItemName}
                              onChange={e => setNewItemName(e.target.value)}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            />
                          </td>
                          <td style={{ padding: '1rem 0.5rem 0 0' }}>
                            <select 
                              value={newItemType}
                              onChange={e => setNewItemType(e.target.value)}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            >
                              <option value="Consultation">Consultation</option>
                              <option value="Laboratory">Laboratory</option>
                              <option value="Pharmacy">Pharmacy</option>
                              <option value="Registration">Registration</option>
                              <option value="Room/Ward">Room/Ward</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td style={{ padding: '1rem 0.5rem 0 0' }}>
                            <input 
                              type="number" 
                              min="1"
                              value={newItemQty}
                              onChange={e => setNewItemQty(Number(e.target.value))}
                              style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            />
                          </td>
                          <td style={{ padding: '1rem 0.5rem 0 0' }}>
                            <input 
                              type="number" 
                              min="0"
                              placeholder="Price"
                              value={newItemPrice}
                              onChange={e => setNewItemPrice(e.target.value)}
                              style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            />
                          </td>
                          <td colSpan={2} style={{ padding: '1rem 0 0 0', textAlign: 'right' }}>
                            <button onClick={handleAddCharge} className={styles.btnOutline} style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
                              Add Charge
                            </button>
                          </td>
                        </tr>
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
                          
                          {Number(pendingBill?.amount_paid || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--color-success)', fontWeight: 600 }}>
                              <span>Amount Paid:</span>
                              <span>-₹{Number(pendingBill.amount_paid).toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            <span>Remaining Balance:</span>
                            <span>₹{(calculateTotals().totalAmount - Number(pendingBill?.amount_paid || 0)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--color-background)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Payment Details</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Payment Amount (₹)</label>
                            <input 
                              type="number" 
                              min="0"
                              max={calculateTotals().totalAmount - Number(pendingBill?.amount_paid || 0)}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(Number(e.target.value))}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text-primary)' }}
                            />
                          </div>
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
                              <CheckCircle2 size={20} /> Pay ₹{Number(paymentAmount || 0).toFixed(2)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--color-text-secondary)' }}>
              <Receipt size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3>No Patient Selected</h3>
              <p>Select a patient from the list to view or generate their bill.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
