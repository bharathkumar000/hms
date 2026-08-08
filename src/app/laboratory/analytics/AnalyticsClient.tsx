'use client';

import { useState } from 'react';
import { BarChart2, Calendar, FileText, PieChart, Activity, User, Download, Printer } from 'lucide-react';
import styles from './analytics.module.css';

export default function AnalyticsClient({ orders, maintenanceLogs }: { orders: any[], maintenanceLogs: any[] }) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const now = new Date();
  
  // Helper to check if a date falls within timeframe
  const isWithinTimeframe = (dateString: string) => {
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (timeframe === 'daily') return diffDays <= 1;
    if (timeframe === 'weekly') return diffDays <= 7;
    if (timeframe === 'monthly') return diffDays <= 30;
    return true;
  };

  const filteredOrders = orders.filter(o => isWithinTimeframe(o.created_at));

  // Compute Metrics
  const totalTests = filteredOrders.length;
  const pendingTests = filteredOrders.filter(o => ['Pending', 'Sample Requested', 'Sample Collected'].includes(o.status)).length;
  const completedTests = filteredOrders.filter(o => ['Report Ready', 'Released'].includes(o.status)).length;
  const processingTests = filteredOrders.filter(o => o.status === 'Processing').length;

  // Technician Performance
  const techStats: Record<string, { name: string, completed: number, assigned: number }> = {};
  filteredOrders.forEach(o => {
    if (o.technician_id && o.technician) {
      const name = `${o.technician.first_name} ${o.technician.last_name}`;
      if (!techStats[o.technician_id]) {
        techStats[o.technician_id] = { name, completed: 0, assigned: 0 };
      }
      techStats[o.technician_id].assigned++;
      if (['Report Ready', 'Released'].includes(o.status)) {
        techStats[o.technician_id].completed++;
      }
    }
  });

  // Test Categories
  const categoryStats: Record<string, number> = {};
  filteredOrders.forEach(o => {
    categoryStats[o.test_category] = (categoryStats[o.test_category] || 0) + 1;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Laboratory Reports & Analytics</h1>
          <p className={styles.subtitle}>Analyze lab performance, test volumes, and equipment usage.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={() => window.print()}>
            <Printer size={18} /> Print Report
          </button>
          <button className={styles.btnPrimary} onClick={() => alert('Exporting to PDF...')}>
            <Download size={18} /> Export PDF
          </button>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.timeframeToggle}>
          <button 
            className={timeframe === 'daily' ? styles.activeToggle : styles.toggleBtn}
            onClick={() => setTimeframe('daily')}
          >
            Daily
          </button>
          <button 
            className={timeframe === 'weekly' ? styles.activeToggle : styles.toggleBtn}
            onClick={() => setTimeframe('weekly')}
          >
            Weekly
          </button>
          <button 
            className={timeframe === 'monthly' ? styles.activeToggle : styles.toggleBtn}
            onClick={() => setTimeframe('monthly')}
          >
            Monthly
          </button>
        </div>
        <div className={styles.dateDisplay}>
          <Calendar size={18} color="var(--color-text-secondary)" />
          <span>
            {timeframe === 'daily' ? 'Last 24 Hours' : 
             timeframe === 'weekly' ? 'Last 7 Days' : 
             'Last 30 Days'}
          </span>
        </div>
      </div>

      <div className={styles.overviewGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
            <FileText size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Tests</h3>
            <p className={styles.statValue}>{totalTests}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>Completed</h3>
            <p className={styles.statValue}>{completedTests}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}>
            <Activity size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>Pending/Processing</h3>
            <p className={styles.statValue}>{pendingTests + processingTests}</p>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {/* Technician Performance */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <User size={20} color="var(--color-primary)" />
            <h2>Technician Performance</h2>
          </div>
          <div className={styles.chartBody}>
            {Object.keys(techStats).length > 0 ? (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Technician Name</th>
                    <th>Assigned Tests</th>
                    <th>Completed</th>
                    <th>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(techStats).map(tech => (
                    <tr key={tech.name}>
                      <td>{tech.name}</td>
                      <td>{tech.assigned}</td>
                      <td>{tech.completed}</td>
                      <td>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ width: `${(tech.completed / tech.assigned) * 100}%` }}
                          ></div>
                        </div>
                        <span className={styles.progressText}>{Math.round((tech.completed / tech.assigned) * 100)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.emptyText}>No technician data in this timeframe.</p>
            )}
          </div>
        </div>

        {/* Equipment Usage/Maintenance */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <BarChart2 size={20} color="var(--color-primary)" />
            <h2>Recent Maintenance Logs</h2>
          </div>
          <div className={styles.chartBody}>
             {maintenanceLogs.length > 0 ? (
              <ul className={styles.logList}>
                {maintenanceLogs.slice(0, 5).map(log => (
                  <li key={log.id} className={styles.logItem}>
                    <div>
                      <strong>{log.equipment?.name}</strong>
                      <p>{log.maintenance_type} - {log.status}</p>
                    </div>
                    <span>{new Date(log.scheduled_date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
             ) : (
              <p className={styles.emptyText}>No recent maintenance logs.</p>
             )}
          </div>
        </div>

        {/* Test Volume by Category */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.chartHeader}>
            <PieChart size={20} color="var(--color-primary)" />
            <h2>Test Volume by Category</h2>
          </div>
          <div className={styles.chartBody}>
            {Object.keys(categoryStats).length > 0 ? (
              <div className={styles.categoryGrid}>
                {Object.entries(categoryStats).map(([category, count]) => (
                  <div key={category} className={styles.categoryItem}>
                    <span className={styles.categoryName}>{category}</span>
                    <span className={styles.categoryCount}>{count as number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No test data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
