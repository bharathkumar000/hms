'use client';

import { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, UserPlus, FileText, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './requests.module.css';

export default function RequestsClient({ initialRequests, staff }: { initialRequests: any[], staff: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const filteredRequests = requests.filter(req => {
    const searchString = `${req.profiles?.first_name} ${req.profiles?.last_name} ${req.test_category}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  const handleAccept = async (id: string) => {
    setLoading(id);
    try {
      const { error } = await supabase
        .from('lab_orders')
        .update({ status: 'Sample Requested' })
        .eq('id', id);
        
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to accept request');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Please enter the reason for rejection:");
    if (!reason) return;

    setLoading(id);
    try {
      const { error } = await supabase
        .from('lab_orders')
        .update({ status: 'Cancelled', notes: `Rejected: ${reason}` })
        .eq('id', id);
        
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to reject request');
    } finally {
      setLoading(null);
    }
  };

  const handleAssign = async (id: string, technicianId: string) => {
    if (!technicianId) return;
    setLoading(id);
    try {
      const { error } = await supabase
        .from('lab_orders')
        .update({ technician_id: technicianId })
        .eq('id', id);
        
      if (error) throw error;
      alert('Technician assigned successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to assign technician');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Test Requests</h1>
          <p className={styles.subtitle}>Manage incoming laboratory test requests.</p>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search patients or tests..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className={styles.filterBtn}>
          <Filter size={20} />
          Filter
        </button>
      </div>

      <div className={styles.list}>
        {filteredRequests.length > 0 ? (
          filteredRequests.map(req => (
            <div key={req.id} className={`${styles.card} ${req.urgent ? styles.urgentCard : ''}`}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 className={styles.patientName}>{req.profiles?.first_name} {req.profiles?.last_name}</h3>
                  {req.urgent && (
                    <span className={styles.urgentBadge}>
                      <AlertTriangle size={14} /> URGENT
                    </span>
                  )}
                </div>
                <span className={styles.timestamp}>
                  {new Date(req.created_at).toLocaleString()}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.infoGroup}>
                  <FileText size={16} />
                  <span><strong>Test:</strong> {req.test_category}</span>
                </div>
                <div className={styles.infoGroup}>
                  <UserPlus size={16} />
                  <span><strong>Doctor:</strong> Dr. {req.doctors?.first_name} {req.doctors?.last_name}</span>
                </div>
                {req.notes && (
                  <div className={styles.notes}>
                    <strong>Notes:</strong> {req.notes}
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.assignGroup}>
                  <label>Assign Tech:</label>
                  <select 
                    className={styles.select}
                    onChange={(e) => handleAssign(req.id, e.target.value)}
                    disabled={loading === req.id}
                  >
                    <option value="">Select Technician...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.actions}>
                  <button 
                    onClick={() => handleReject(req.id)}
                    className={styles.btnReject}
                    disabled={loading === req.id}
                  >
                    <XCircle size={18} /> Reject
                  </button>
                  <button 
                    onClick={() => handleAccept(req.id)}
                    className={styles.btnAccept}
                    disabled={loading === req.id}
                  >
                    <CheckCircle size={18} /> Accept Request
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <FileText size={48} color="var(--color-text-secondary)" />
            <h3>No Pending Requests</h3>
            <p>You have caught up with all incoming test requests.</p>
          </div>
        )}
      </div>
    </div>
  );
}
