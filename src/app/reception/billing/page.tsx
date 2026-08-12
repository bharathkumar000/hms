'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CreditCard, Plus, Receipt } from 'lucide-react';
import styles from './billing.module.css';

export default function ReceptionBilling() {
  const { showAlert, showConfirm } = useModal();

  const [bills, setBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for Generating Bill
  const [showGenModal, setShowGenModal] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAptId, setSelectedAptId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Modal State for Payment
  // Removed payment modal state as per requirements
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [billsData, paymentsData] = await Promise.all([
      supabase.from('bills').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, profiles(first_name, last_name)').order('payment_date', { ascending: false }).limit(10)
    ]);
    
    if (billsData.data) setBills(billsData.data);
    if (paymentsData.data) setPayments(paymentsData.data);
    setLoading(false);
  };

  const openGenerateModal = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, profiles(first_name, last_name)')
      .eq('status', 'Completed')
      .order('appointment_date', { ascending: false })
      .limit(20);
    
    if (data) setAppointments(data);
    setShowGenModal(true);
  };

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const apt = appointments.find(a => a.id === selectedAptId);
    if (!apt) return;

    const { error } = await supabase.from('bills').insert({
      patient_id: apt.patient_id,
      appointment_id: apt.id,
      amount: parseFloat(amount),
      description: description,
      status: 'Pending'
    });

    if (!error) {
      setShowGenModal(false);
      fetchData();
      setAmount('');
      setDescription('');
      setSelectedAptId('');
    } else {
      showAlert('Error generating bill: ' + error.message);
    }
  };



  const handlePayment = () => {
    setShowRedirectModal(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Billing & Payments</h1>
          <p className={styles.details}>Manage patient billing and record transactions.</p>
        </div>
        <button className={styles.btnPrimary} onClick={openGenerateModal}>
          <Plus size={18} /> Generate Bill
        </button>
      </header>

      {loading ? (
        <p>Loading billing data...</p>
      ) : (
        <div className={styles.grid}>
          {/* Bills Section */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Recent Bills</h2>
            <div className={styles.list}>
              {bills.map(bill => (
                <div key={bill.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>{bill.profiles?.first_name} {bill.profiles?.last_name}</div>
                    <div className={styles.itemSub}>{bill.description}</div>
                    <div className={styles.itemSub} style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Amount: ${Number(bill.amount).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span className={`${styles.status} ${bill.status === 'Paid' ? styles.statusPaid : styles.statusPending}`}>
                      {bill.status}
                    </span>
                    {bill.status === 'Pending' && (
                      <button className={styles.btnOutline} onClick={handlePayment}>
                        Process Payment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments Section */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Recent Payments</h2>
            <div className={styles.list}>
              {payments.map(pay => (
                <div key={pay.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemMain}>
                      <Receipt size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                      ${Number(pay.amount).toFixed(2)} - {pay.payment_method}
                    </div>
                    <div className={styles.itemSub}>Patient: {pay.profiles?.first_name} {pay.profiles?.last_name}</div>
                    <div className={styles.itemSub}>TXN: {pay.transaction_id}</div>
                  </div>
                  <div>
                    <span className={styles.itemSub}>
                      {new Date(pay.payment_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      {showGenModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Generate Bill</h2>
            <form onSubmit={handleGenerateBill}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Completed Appointment</label>
                <select className={styles.input} required value={selectedAptId} onChange={e => setSelectedAptId(e.target.value)}>
                  <option value="">Select Appointment...</option>
                  {appointments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.appointment_date} - {a.profiles?.first_name} {a.profiles?.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <input type="text" className={styles.input} required placeholder="e.g., General Consultation Fee" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Amount ($)</label>
                <input type="number" step="0.01" className={styles.input} required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowGenModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Create Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redirect Modal */}
      {showRedirectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Payment Required</h2>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-light)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>
                Payments cannot be processed in the Reception Portal.
              </p>
              <p style={{ margin: '0', color: 'var(--color-text-secondary)' }}>
                Please direct the patient to the Billing Counter, or log in to the Billing Portal to process this transaction.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setShowRedirectModal(false)}>Close</button>
              <button type="button" className={styles.btnPrimary} onClick={() => {
                setShowRedirectModal(false);
                window.open('/billing/login', '_blank');
              }}>
                Open Billing Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
