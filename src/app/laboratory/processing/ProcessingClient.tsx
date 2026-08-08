'use client';

import { useState } from 'react';
import { Activity, Play, CheckCircle, Save, FileText, Search } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './processing.module.css';

export default function ProcessingClient({ initialSamples, initialReports, currentStaffId }: { initialSamples: any[], initialReports: any[], currentStaffId: string | null }) {
  const [samples, setSamples] = useState(initialSamples);
  const [reports, setReports] = useState(initialReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  
  // Test Results form state { sampleId: string (json string) }
  const [resultsData, setResultsData] = useState<Record<string, string>>({});
  
  const supabase = createClient();

  const handleStartProcessing = async (sampleId: string, orderId: string) => {
    setLoading(sampleId);
    try {
      await supabase.from('lab_samples').update({ status: 'Processing' }).eq('id', sampleId);
      await supabase.from('lab_orders').update({ status: 'Processing', processing_start_time: new Date().toISOString() }).eq('id', orderId);
      
      setSamples(prev => prev.map(s => s.id === sampleId ? { ...s, status: 'Processing' } : s));
    } catch (e) {
      console.error(e);
      alert('Failed to start processing');
    } finally {
      setLoading(null);
    }
  };

  const getOrCreateReport = async (orderId: string) => {
    let report = reports.find(r => r.order_id === orderId);
    if (!report) {
      const { data, error } = await supabase
        .from('lab_reports')
        .insert({
          order_id: orderId,
          status: 'Draft',
          technician_id: currentStaffId
        })
        .select()
        .single();
        
      if (error) throw error;
      report = data;
      setReports(prev => [...prev, report]);
    }
    return report;
  };

  const handleSaveDraft = async (sample: any) => {
    setLoading('save-' + sample.id);
    try {
      const report = await getOrCreateReport(sample.order_id);
      let parsedResults = {};
      try {
        parsedResults = JSON.parse(resultsData[sample.id] || '{}');
      } catch (e) {
        parsedResults = { text: resultsData[sample.id] }; // fallback to just storing the string if not valid json
      }

      await supabase.from('lab_reports').update({ results_data: parsedResults }).eq('id', report.id);
      alert('Draft saved successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to save draft');
    } finally {
      setLoading(null);
    }
  };

  const handleCompleteTest = async (sample: any) => {
    if (!confirm('Are you sure you want to complete this test? This will send the report for approval.')) return;
    
    setLoading('complete-' + sample.id);
    try {
      const report = await getOrCreateReport(sample.order_id);
      let parsedResults = {};
      try {
        parsedResults = JSON.parse(resultsData[sample.id] || '{}');
      } catch (e) {
        parsedResults = { text: resultsData[sample.id] };
      }

      // Update Report to Pending Approval
      await supabase.from('lab_reports').update({ 
        results_data: parsedResults,
        status: 'Pending Approval' 
      }).eq('id', report.id);

      // Update Sample to Completed
      await supabase.from('lab_samples').update({ status: 'Completed' }).eq('id', sample.id);

      // Update Order to Report Ready
      await supabase.from('lab_orders').update({ status: 'Report Ready', completion_time: new Date().toISOString() }).eq('id', sample.order_id);

      setSamples(prev => prev.filter(s => s.id !== sample.id));
      alert('Test completed. Report submitted for approval.');
    } catch (e) {
      console.error(e);
      alert('Failed to complete test');
    } finally {
      setLoading(null);
    }
  };

  const filteredSamples = samples.filter(s => 
    `${s.barcode} ${s.order?.patient?.first_name} ${s.order?.test_category}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Test Processing</h1>
          <p className={styles.subtitle}>Execute tests and record results.</p>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by barcode, patient or test..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredSamples.map(sample => {
          const report = reports.find(r => r.order_id === sample.order_id);
          // Initialize text area if empty but report exists
          if (!resultsData[sample.id] && report?.results_data) {
             const dataString = typeof report.results_data === 'string' 
                ? report.results_data 
                : JSON.stringify(report.results_data, null, 2);
             // Use setTimeout to avoid state updates during render
             setTimeout(() => {
                setResultsData(prev => ({ ...prev, [sample.id]: dataString }));
             }, 0);
          }

          return (
            <div key={sample.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.headerInfo}>
                  <h3 className={styles.testName}>{sample.order?.test_category}</h3>
                  <span className={styles.barcode}>{sample.barcode}</span>
                </div>
                <span className={`${styles.statusBadge} ${sample.status === 'Processing' ? styles.statusProcessing : styles.statusCollected}`}>
                  {sample.status}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <p className={styles.patientInfo}>
                  <strong>Patient:</strong> {sample.order?.patient?.first_name} {sample.order?.patient?.last_name} 
                  ({sample.order?.patient?.gender}, {new Date().getFullYear() - new Date(sample.order?.patient?.date_of_birth).getFullYear()}y)
                </p>
                
                {sample.status === 'Collected' ? (
                  <div className={styles.actionCenter}>
                    <Activity size={48} color="var(--color-border)" />
                    <p>Sample collected and ready for processing.</p>
                    <button 
                      className={styles.btnStart}
                      onClick={() => handleStartProcessing(sample.id, sample.order_id)}
                      disabled={loading === sample.id}
                    >
                      <Play size={18} /> Start Processing
                    </button>
                  </div>
                ) : (
                  <div className={styles.resultsForm}>
                    <label className={styles.label}>Test Results Data (JSON/Text):</label>
                    <textarea 
                      className={styles.textarea}
                      placeholder="Enter test results here..."
                      value={resultsData[sample.id] || ''}
                      onChange={(e) => setResultsData(prev => ({ ...prev, [sample.id]: e.target.value }))}
                      rows={8}
                    ></textarea>
                    
                    <div className={styles.formActions}>
                      <button 
                        className={styles.btnDraft}
                        onClick={() => handleSaveDraft(sample)}
                        disabled={loading === 'save-' + sample.id}
                      >
                        <Save size={16} /> Save Draft
                      </button>
                      <button 
                        className={styles.btnComplete}
                        onClick={() => handleCompleteTest(sample)}
                        disabled={loading === 'complete-' + sample.id}
                      >
                        <CheckCircle size={16} /> Complete Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredSamples.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} color="var(--color-text-secondary)" />
            <h3>No Samples to Process</h3>
            <p>All samples have been processed or none have been collected yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
