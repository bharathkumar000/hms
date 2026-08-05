'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Archive, Download, Search } from 'lucide-react';
import styles from '../orders/orders.module.css'; // Reuse orders styles

export default function LaboratoryArchive() {
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchArchives();
  }, [searchQuery]);

  const fetchArchives = async () => {
    setLoading(true);
    
    let query = supabase
      .from('lab_orders')
      .select('*, profiles(first_name, last_name)')
      .eq('status', 'Released')
      .order('completion_time', { ascending: false });

    // Client side filter or simple search. 
    // Supabase ilike on joined tables is tricky without explicit views. 
    // So we fetch and filter in JS if there's a search query
    const { data, error } = await query;
    
    if (data) {
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        const filtered = data.filter(d => 
          d.profiles?.first_name?.toLowerCase().includes(lowerQ) ||
          d.profiles?.last_name?.toLowerCase().includes(lowerQ) ||
          d.test_category?.toLowerCase().includes(lowerQ) ||
          d.sample_id?.toLowerCase().includes(lowerQ)
        );
        setArchives(filtered);
      } else {
        setArchives(data);
      }
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Patient Report Archive</h1>
          <p className={styles.details}>Search and view all historically released lab reports.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by patient name, test, or sample ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', fontFamily: 'inherit' }}
          />
        </div>

        {loading ? (
          <p>Loading archive...</p>
        ) : archives.length > 0 ? (
          <div className={styles.list}>
            {archives.map(arc => (
              <div key={arc.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>
                    <Archive size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--color-text-secondary)' }}/>
                    {arc.test_category}
                  </div>
                  <div className={styles.itemSub}>
                    Patient: {arc.profiles?.first_name} {arc.profiles?.last_name}
                  </div>
                  <div className={styles.itemSub} style={{ fontSize: '0.85rem' }}>
                    Sample ID: {arc.sample_id} | Completed: {new Date(arc.completion_time).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {arc.report_url && (
                    <a href={arc.report_url} target="_blank" rel="noreferrer" className={styles.btnOutline} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No archived reports found matching your search.</p>
        )}
      </div>
    </div>
  );
}
