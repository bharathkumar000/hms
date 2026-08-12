'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import styles from './print.module.css';

export default function PrintInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [bill, setBill] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    // Fetch bill details
    const { data: billData } = await supabase
      .from('bills')
      .select(`
        *,
        profiles (first_name, last_name, phone_number)
      `)
      .eq('id', id)
      .single();

    if (billData) {
      setBill(billData);
      
      // Fetch bill items
      const { data: itemsData } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', id);
        
      if (itemsData) setItems(itemsData);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoice...</div>;
  if (!bill) return <div style={{ padding: '2rem', textAlign: 'center' }}>Invoice not found.</div>;

  return (
    <div className={styles.printContainer}>
      <div className={styles.noPrint}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => router.back()}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button 
            onClick={handlePrint}
            className={styles.printBtn}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={18} /> Print Invoice
          </button>
        </div>
      </div>

      <div className={styles.invoiceWrapper}>
        <div className={styles.header}>
          <div className={styles.hospitalInfo}>
            <h1>City General Hospital</h1>
            <p>123 Health Avenue, Medical District</p>
            <p>Metropolis, NY 10001</p>
            <p>Phone: (555) 123-4567 | Email: billing@cityhospital.com</p>
          </div>
          <div className={styles.invoiceDetails}>
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> {bill.invoice_number || 'PENDING'}</p>
            <p><strong>Date:</strong> {new Date(bill.created_at).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {bill.status}</p>
          </div>
        </div>

        <div className={styles.patientSection}>
          <h3>Billed To</h3>
          <div className={styles.patientGrid}>
            <div>
              <p><strong>Patient Name:</strong> {bill.profiles?.first_name} {bill.profiles?.last_name}</p>
              <p><strong>Patient ID:</strong> {bill.patient_id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p><strong>Phone:</strong> {bill.profiles?.phone_number || 'N/A'}</p>
              <p><strong>Bill Type:</strong> {bill.bill_type}</p>
            </div>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
              <th style={{ textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.item_name}</td>
                <td>{item.item_type}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{Number(item.unit_price).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{Number(item.amount).toFixed(2)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No items on this bill.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal:</span>
            <span>₹{Number(bill.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Tax:</span>
            <span>₹{Number(bill.tax || 0).toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Discount:</span>
            <span>-₹{Number(bill.discount || 0).toFixed(2)}</span>
          </div>
          <div className={styles.grandTotal}>
            <span>Total Amount:</span>
            <span>₹{Number(bill.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className={styles.totalRow} style={{ marginTop: '8px', color: '#166534', fontWeight: 600 }}>
            <span>Amount Paid:</span>
            <span>₹{Number(bill.amount_paid || 0).toFixed(2)}</span>
          </div>
          {bill.total_amount > bill.amount_paid && (
            <div className={styles.totalRow} style={{ color: '#b91c1c', fontWeight: 600 }}>
              <span>Balance Due:</span>
              <span>₹{(Number(bill.total_amount) - Number(bill.amount_paid)).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p>Thank you for choosing City General Hospital.</p>
          <p>For any billing inquiries, please contact our support team.</p>
        </div>
      </div>
    </div>
  );
}
