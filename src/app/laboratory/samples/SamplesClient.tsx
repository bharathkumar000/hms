'use client';

import { useState } from 'react';
import { Search, Filter, Plus, QrCode, RefreshCw, CheckCircle, Activity, XCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { generateBarcode } from '@/utils/lab-service';
import styles from './samples.module.css';

export default function SamplesClient({ pendingOrders, initialSamples }: { pendingOrders: any[], initialSamples: any[] }) {
  const [activeTab, setActiveTab] = useState<'collect' | 'track'>('track');
  const [samples, setSamples] = useState(initialSamples);
  const [orders, setOrders] = useState(pendingOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const handleCollect = async (orderId: string) => {
    setLoading(orderId);
    try {
      const barcode = generateBarcode(orderId);
      
      const { data: sample, error: sampleError } = await supabase
        .from('lab_samples')
        .insert({
          order_id: orderId,
          barcode: barcode,
          status: 'Collected'
        })
        .select(`
          *,
          order:lab_orders!order_id(
            *,
            patient:profiles!patient_id(first_name, last_name)
          )
        `)
        .single();
        
      if (sampleError) throw sampleError;

      const { error: orderError } = await supabase
        .from('lab_orders')
        .update({ status: 'Sample Collected' })
        .eq('id', orderId);
        
      if (orderError) throw orderError;

      setOrders(prev => prev.filter(o => o.id !== orderId));
      setSamples(prev => [sample, ...prev]);
      alert(`Sample collected. Barcode: ${barcode}`);
    } catch (e) {
      console.error(e);
      alert('Failed to collect sample');
    } finally {
      setLoading(null);
    }
  };

  const updateStatus = async (sampleId: string, orderId: string, newStatus: string) => {
    setLoading(sampleId);
    try {
      const { error: sampleError } = await supabase
        .from('lab_samples')
        .update({ status: newStatus })
        .eq('id', sampleId);
        
      if (sampleError) throw sampleError;

      if (newStatus === 'Processing' || newStatus === 'Rejected') {
        const orderStatus = newStatus === 'Processing' ? 'Processing' : 'Sample Requested';
        const { error: orderError } = await supabase
          .from('lab_orders')
          .update({ status: orderStatus })
          .eq('id', orderId);
        if (orderError) throw orderError;
      }

      setSamples(prev => prev.map(s => s.id === sampleId ? { ...s, status: newStatus } : s));
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    } finally {
      setLoading(null);
    }
  };

  const handleRecollect = async (sampleId: string, orderId: string) => {
    const reason = prompt("Reason for recollection:");
    if (!reason) return;

    setLoading(sampleId);
    try {
      // Mark old sample as rejected
      await supabase.from('lab_samples').update({ status: 'Rejected', recollection_required: true, recollection_reason: reason }).eq('id', sampleId);
      
      // Update order back to Sample Requested
      await supabase.from('lab_orders').update({ status: 'Sample Requested' }).eq('id', orderId);

      // We should ideally refetch, but for now we just remove it from tracking and maybe move the order back
      alert('Sample marked for recollection. Order moved back to Collection queue.');
      window.location.reload(); // Simple way to refresh data
    } catch (e) {
      console.error(e);
      alert('Failed to request recollection');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Sample Management</h1>
          <p className={styles.subtitle}>Collect and track laboratory samples.</p>
        </div>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'track' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('track')}
        >
          Track Samples ({samples.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'collect' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('collect')}
        >
          Awaiting Collection ({orders.length})
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by patient, barcode, or test..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'collect' && (
          <div className={styles.grid}>
            {orders.filter(o => `${o.profiles?.first_name} ${o.test_category}`.toLowerCase().includes(searchQuery.toLowerCase())).map(order => (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.patientName}>{order.profiles?.first_name} {order.profiles?.last_name}</h3>
                  {order.urgent && <span className={styles.urgentBadge}>URGENT</span>}
                </div>
                <div className={styles.cardBody}>
                  <p><strong>Test:</strong> {order.test_category}</p>
                  <p><strong>Requested:</strong> {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className={styles.cardFooter}>
                  <button 
                    className={styles.btnPrimary}
                    onClick={() => handleCollect(order.id)}
                    disabled={loading === order.id}
                  >
                    <Plus size={16} /> Collect Sample
                  </button>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className={styles.emptyText}>No pending sample collections.</p>}
          </div>
        )}

        {activeTab === 'track' && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Barcode ID</th>
                  <th>Patient Name</th>
                  <th>Test Type</th>
                  <th>Collection Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {samples.filter(s => `${s.barcode} ${s.order?.patient?.first_name} ${s.order?.test_category}`.toLowerCase().includes(searchQuery.toLowerCase())).map(sample => (
                  <tr key={sample.id}>
                    <td>
                      <div className={styles.barcodeCell}>
                        <QrCode size={16} color="var(--color-text-secondary)" />
                        {sample.barcode}
                      </div>
                    </td>
                    <td>{sample.order?.patient?.first_name} {sample.order?.patient?.last_name}</td>
                    <td>{sample.order?.test_category}</td>
                    <td>{new Date(sample.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles['status' + sample.status.replace(/\s+/g, '')]}`}>
                        {sample.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        {sample.status === 'Collected' && (
                          <>
                            <button 
                              className={styles.iconBtn} 
                              onClick={() => updateStatus(sample.id, sample.order_id, 'Processing')}
                              title="Start Processing"
                              disabled={loading === sample.id}
                            >
                              <Activity size={18} color="var(--color-primary)" />
                            </button>
                            <button 
                              className={styles.iconBtn} 
                              onClick={() => handleRecollect(sample.id, sample.order_id)}
                              title="Request Recollection"
                              disabled={loading === sample.id}
                            >
                              <RefreshCw size={18} color="#dc2626" />
                            </button>
                          </>
                        )}
                        {sample.status === 'Processing' && (
                           <button 
                           className={styles.iconBtn} 
                           title="Tests in progress"
                           disabled
                         >
                           <ArrowRight size={18} color="var(--color-text-secondary)" />
                         </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {samples.length === 0 && <p className={styles.emptyText}>No samples found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
