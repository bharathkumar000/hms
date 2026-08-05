import { createClient } from '@/utils/supabase/server';
import styles from './billing.module.css';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Fetch bills
  const { data: bills } = await supabase
    .from('bills')
    .select('*')
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Billing & Payments</h1>
      </div>

      <div className={styles.card}>
        {(!bills || bills.length === 0) ? (
          <p>No billing records found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Description</th>
                  <th className={styles.th}>Amount</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className={styles.tr}>
                    <td className={styles.td}>{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td className={styles.td}>{bill.description}</td>
                    <td className={styles.td}>${parseFloat(bill.amount).toFixed(2)}</td>
                    <td className={styles.td}>
                      <span className={`${styles.status} ${bill.status === 'Paid' ? styles.statusPaid : styles.statusPending}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {bill.invoice_url ? (
                        <Link href={bill.invoice_url} target="_blank" rel="noopener noreferrer" className={styles.btnDownload}>
                          <Download size={14} /> Download
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
