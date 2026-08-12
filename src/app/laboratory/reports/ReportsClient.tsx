'use client';

import { useState } from 'react';
import { Search, CheckCircle, FileText, UploadCloud, Download, Eye, Send } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './reports.module.css';

export default function ReportsClient({ initialReports, currentStaff }: { initialReports: any[], currentStaff: any }) {
  const [reports, setReports] = useState(initialReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'released'>('pending');
  
  const supabase = createClient();
  const isPathologist = currentStaff?.role === 'Pathologist' || currentStaff?.role === 'Admin'; // Adjust according to actual roles. Let's assume Pathologist or high level can approve. For this demo, allow anyone if no role strictly enforced or show button anyway but it may fail RLS. We'll show it.

  const handleApprove = async (reportId: string, orderId: string) => {
    setLoading(reportId);
    try {
      await supabase.from('lab_reports').update({ 
        status: 'Approved',
        pathologist_id: currentStaff?.id,
        approved_at: new Date().toISOString()
      }).eq('id', reportId);

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Approved' } : r));
      alert('Report Approved successfully.');
    } catch (e) {
      console.error(e);
      alert('Failed to approve report');
    } finally {
      setLoading(null);
    }
  };

  const handleRelease = async (reportId: string, orderId: string) => {
    setLoading(reportId);
    try {
      await supabase.from('lab_reports').update({ 
        status: 'Released',
        released_at: new Date().toISOString()
      }).eq('id', reportId);

      // Also update order status to Released
      await supabase.from('lab_orders').update({ status: 'Released' }).eq('id', orderId);

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Released' } : r));
      alert('Report Released to Patient and Doctor.');
    } catch (e) {
      console.error(e);
      alert('Failed to release report');
    } finally {
      setLoading(null);
    }
  };

  const filteredReports = reports.filter(r => {
    const searchString = `${r.order?.patient?.first_name} ${r.order?.test_category}`.toLowerCase();
    if (!searchString.includes(searchQuery.toLowerCase())) return false;
    
    if (activeTab === 'pending') return r.status === 'Pending Approval';
    if (activeTab === 'approved') return r.status === 'Approved';
    if (activeTab === 'released') return r.status === 'Released';
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Report Management</h1>
          <p className={styles.subtitle}>Approve and release laboratory test reports.</p>
        </div>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval ({reports.filter(r => r.status === 'Pending Approval').length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'approved' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved / Ready ({reports.filter(r => r.status === 'Approved').length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'released' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('released')}
        >
          Released ({reports.filter(r => r.status === 'Released').length})
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by patient or test..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.list}>
        {filteredReports.map(report => (
          <div key={report.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.patientName}>{report.order?.patient?.first_name} {report.order?.patient?.last_name}</h3>
                <span className={styles.testName}>{report.order?.test_category}</span>
              </div>
              <span className={`${styles.statusBadge} ${styles['status' + report.status.replace(/\s+/g, '')]}`}>
                {report.status}
              </span>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span><strong>Technician:</strong> {report.technician?.first_name} {report.technician?.last_name}</span>
                <span><strong>Date:</strong> {new Date(report.updated_at).toLocaleString()}</span>
              </div>
              
              <div className={styles.resultsPreview}>
                <strong>Results Summary:</strong>
                <pre className={styles.resultsText}>
                  {typeof report.results_data === 'string' 
                    ? report.results_data 
                    : JSON.stringify(report.results_data, null, 2)}
                </pre>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.leftActions}>
                <button className={styles.btnSecondary}>
                  <Eye size={16} /> View Details
                </button>
                <button className={styles.btnSecondary}>
                  <Download size={16} /> Download PDF
                </button>
              </div>
              
              <div className={styles.rightActions}>
                {report.status === 'Pending Approval' && (
                  <button 
                    className={styles.btnApprove}
                    onClick={() => handleApprove(report.id, report.order_id)}
                    disabled={loading === report.id}
                  >
                    <CheckCircle size={16} /> Approve Report
                  </button>
                )}
                {report.status === 'Approved' && (
                  <button 
                    className={styles.btnRelease}
                    onClick={() => handleRelease(report.id, report.order_id)}
                    disabled={loading === report.id}
                  >
                    <Send size={16} /> Release Report
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} color="var(--color-text-secondary)" />
            <h3>No Reports Found</h3>
            <p>There are no reports in the current category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
