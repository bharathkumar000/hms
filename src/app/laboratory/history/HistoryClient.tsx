'use client';

import { useState } from 'react';
import { Search, History, Download, GitCommit, FileText, ArrowRightLeft } from 'lucide-react';
import styles from './history.module.css';

export default function HistoryClient({ historyData, patients }: { historyData: any[], patients: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  
  // Optional feature: Compare reports
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const filteredHistory = historyData.filter(h => {
    if (selectedPatient && h.patient_id !== selectedPatient) return false;
    
    const searchString = `${h.patient?.first_name} ${h.patient?.last_name} ${h.test_category}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  const handleSelectCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(prev => prev.filter(item => item !== id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare(prev => [...prev, id]);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Patient Test History</h1>
          <p className={styles.subtitle}>Review past laboratory reports and track patient history over time.</p>
        </div>
        <button 
          className={compareMode ? styles.btnCompareActive : styles.btnCompare}
          onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}
        >
          <ArrowRightLeft size={18} />
          {compareMode ? 'Cancel Compare' : 'Compare Reports'}
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search tests..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className={styles.selectFilter}
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
        >
          <option value="">All Patients</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {compareMode && selectedForCompare.length === 2 && (
        <div className={styles.compareBanner}>
          <p>Ready to compare selected reports.</p>
          <button className={styles.btnAction} onClick={() => alert('Comparison view would open here in a full-scale app.')}>
            View Comparison
          </button>
        </div>
      )}

      <div className={styles.timeline}>
        {filteredHistory.length > 0 ? (
          filteredHistory.map(item => {
            const report = item.reports?.[0];
            const isSelected = selectedForCompare.includes(item.id);
            
            return (
              <div key={item.id} className={`${styles.timelineItem} ${isSelected ? styles.selectedItem : ''}`}>
                <div className={styles.timelineIcon}>
                  <GitCommit size={24} color={isSelected ? "var(--color-primary)" : "var(--color-text-secondary)"} />
                </div>
                
                <div className={styles.timelineContent}>
                  {compareMode && (
                    <input 
                      type="checkbox" 
                      className={styles.compareCheckbox}
                      checked={isSelected}
                      onChange={() => handleSelectCompare(item.id)}
                      disabled={!isSelected && selectedForCompare.length >= 2}
                    />
                  )}
                  
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.patientName}>{item.patient?.first_name} {item.patient?.last_name}</h3>
                      <span className={styles.testCategory}>{item.test_category}</span>
                    </div>
                    <div className={styles.dateInfo}>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      <span className={styles.statusBadge}>{item.status}</span>
                    </div>
                  </div>
                  
                  {report && (
                    <div className={styles.cardBody}>
                      <div className={styles.resultsPreview}>
                        <FileText size={16} />
                        <span>
                          {typeof report.results_data === 'string' 
                            ? (report.results_data.substring(0, 100) + '...') 
                            : 'Structured results available.'}
                        </span>
                      </div>
                      
                      <div className={styles.actions}>
                        <button className={styles.btnSecondary}>
                          <Download size={16} /> Download PDF
                        </button>
                      </div>
                    </div>
                  )}
                  {!report && (
                    <p className={styles.noReport}>Report data is not available yet.</p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <History size={48} color="var(--color-text-secondary)" />
            <h3>No History Found</h3>
            <p>Adjust your search filters to find historical test data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
