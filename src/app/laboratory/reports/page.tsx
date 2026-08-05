'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FileText, CheckCircle, Upload } from 'lucide-react';
import styles from '../orders/orders.module.css'; // Reuse orders styles

export default function LaboratoryReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Completed'); // Completed (needs report), Draft, Approved, Released
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reportUrl, setReportUrl] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    let query = supabase
      .from('lab_orders')
      .select('*, profiles(first_name, last_name)')
      .order('urgent', { ascending: false })
      .order('completion_time', { ascending: false });

    if (filter === 'Completed') {
      query = query.eq('status', 'Completed');
    } else if (filter === 'Released') {
      query = query.eq('status', 'Released');
    } else if (filter === 'Report Ready') {
      query = query.eq('status', 'Report Ready');
    }

    const { data, error } = await query;
    if (data) setReports(data);
    setLoading(false);
  };

  const openUploadModal = (order: any) => {
    setSelectedOrder(order);
    setReportUrl(order.report_url || '');
    setShowModal(true);
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const { error } = await supabase
      .from('lab_orders')
      .update({ 
        report_url: reportUrl, 
        report_status: 'Approved',
        status: 'Report Ready'
      })
      .eq('id', selectedOrder.id);
    
    if (!error) {
      // Also add to documents table for cross-portal access
      await supabase.from('documents').insert({
        patient_id: selectedOrder.patient_id,
        document_type: 'Lab Report',
        document_url: reportUrl,
        title: `${selectedOrder.test_category} Report`
      });

      setShowModal(false);
      fetchReports();
    }
  };

  const handleReleaseReport = async (id: string) => {
    const { error } = await supabase
      .from('lab_orders')
      .update({ status: 'Released', report_status: 'Released' })
      .eq('id', id);
    
    if (!error) fetchReports();
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Released': return styles.statusRequested; // Greenish
      case 'Completed': return styles.statusPending; // Yellowish
      default: return styles.statusRequested;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Report Management</h1>
          <p className={styles.details}>Upload, approve, and release test reports.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup}>
          <select 
            className={styles.filterSelect} 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Completed">Needs Report (Completed Tests)</option>
            <option value="Report Ready">Ready for Release</option>
            <option value="Released">Released Reports</option>
          </select>
        </div>

        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length > 0 ? (
          <div className={styles.list}>
            {reports.map(rep => (
              <div key={rep.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <FileText size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/>
                    {rep.test_category}
                    {rep.urgent && <span className={styles.badgeUrgent}>URGENT</span>}
                  </div>
                  <div className={styles.itemSub}>
                    Patient: {rep.profiles?.first_name} {rep.profiles?.last_name}
                  </div>
                  {rep.completion_time && (
                    <div className={styles.itemSub} style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      Test Completed: {new Date(rep.completion_time).toLocaleString()}
                    </div>
                  )}
                  {rep.report_url && (
                    <div className={styles.itemSub} style={{ marginTop: '0.5rem' }}>
                      <a href={rep.report_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        View Report Document
                      </a>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${getStatusClass(rep.status)}`}>
                    {rep.status}
                  </span>
                  
                  {rep.status === 'Completed' && (
                    <div className={styles.actions}>
                      <button className={styles.btnPrimary} onClick={() => openUploadModal(rep)}>
                        <Upload size={14} style={{ display: 'inline', marginRight: '4px' }}/>
                        Upload / Draft Report
                      </button>
                    </div>
                  )}

                  {rep.status === 'Report Ready' && (
                    <div className={styles.actions}>
                      <button className={styles.btnPrimary} onClick={() => handleReleaseReport(rep.id)}>
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }}/>
                        Release to Portals
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No reports found in this category.</p>
        )}
      </div>

      {showModal && selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--color-card-bg)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Upload Test Report</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
              Test: {selectedOrder.test_category} <br/>
              Patient: {selectedOrder.profiles?.first_name} {selectedOrder.profiles?.last_name}
            </p>
            <form onSubmit={handleUploadReport}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Report Document URL (PDF/Image)</label>
                <input 
                  type="url" 
                  required 
                  value={reportUrl} 
                  onChange={e => setReportUrl(e.target.value)} 
                  placeholder="https://example.com/report.pdf"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Approve & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
