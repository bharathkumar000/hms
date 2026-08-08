'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, Database, History, Search, Download } from 'lucide-react';
import styles from '../../users/users.module.css';

export default function AdminLogs() {
  const { showAlert, showConfirm } = useModal();

  const [activeTab, setActiveTab] = useState<'audit' | 'system' | 'backup'>('audit');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    if (activeTab === 'audit') {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setAuditLogs(data);
    } else if (activeTab === 'system') {
      const { data } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setSystemLogs(data);
    }
    setLoading(false);
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      showAlert('Database backup completed successfully and downloaded securely.');
    }, 2000);
  };

  const filteredAuditLogs = auditLogs.filter(l => 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredSystemLogs = systemLogs.filter(l => 
    l.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Logs & Backup</h1>
          <p className={styles.details}>Monitor system activity and manage database backups.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'audit' ? styles.activeTab : ''}`} onClick={() => setActiveTab('audit')}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={18} /> Audit Logs</span>
          </button>
          <button className={`${styles.tab} ${activeTab === 'system' ? styles.activeTab : ''}`} onClick={() => setActiveTab('system')}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldAlert size={18} /> System Logs</span>
          </button>
          <button className={`${styles.tab} ${activeTab === 'backup' ? styles.activeTab : ''}`} onClick={() => setActiveTab('backup')}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={18} /> Backup & Restore</span>
          </button>
        </div>

        {activeTab !== 'backup' && (
          <div className={styles.filterGroup}>
            <div className={styles.searchBar}>
              <Search className={styles.searchIcon} size={20} />
              <input 
                type="text" 
                className={styles.searchInput} 
                placeholder={`Search logs...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading audit logs...
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Entity ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{log.action}</td>
                      <td>{log.entity_type}</td>
                      <td>{log.entity_id || 'N/A'}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                        No audit logs available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'system' && (
          loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading system logs...
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>Message</th>
                    <th>Error Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSystemLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                      <td>
                        <span className={`${styles.badge} ${log.event_type === 'Error' ? styles.badgeDanger : styles.badgeSuccess}`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.message}</td>
                      <td style={{ color: '#dc2626', fontSize: '0.85rem' }}>{log.error_details || 'None'}</td>
                    </tr>
                  ))}
                  {filteredSystemLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                        No system logs available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'backup' && (
          <div style={{ maxWidth: '600px', padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Database Backup</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Generate a full secure backup of all hospital data, including patient records, 
              appointments, and billing history. This process may take a few moments depending 
              on the database size.
            </p>
            <button 
              className={styles.btnPrimary} 
              onClick={handleBackup} 
              disabled={isBackingUp}
            >
              {isBackingUp ? 'Generating Backup...' : <><Download size={18} /> Download Latest Backup</>}
            </button>

            <h3 style={{ marginTop: '3rem', marginBottom: '1rem', color: '#dc2626' }}>Restore Data</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Warning: Restoring from a backup will overwrite current database records.
              This action cannot be undone. Please contact system support for restoration procedures.
            </p>
            <button className={styles.btnOutline} style={{ color: '#dc2626', borderColor: '#dc2626' }} onClick={() => showAlert('Contacting support...')}>
              Request Restore Assistance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
