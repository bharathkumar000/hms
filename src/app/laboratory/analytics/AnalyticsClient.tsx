'use client';

import { useState } from 'react';
import { BarChart2, Calendar, FileText, PieChart, Activity, User, Download, Printer, CheckCircle } from 'lucide-react';
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

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Overall Metrics
    csvContent += "Overall Metrics\n";
    csvContent += `Timeframe,${timeframe}\n`;
    csvContent += `Total Tests,${totalTests}\n`;
    csvContent += `Completed,${completedTests}\n`;
    csvContent += `Pending/Processing,${pendingTests + processingTests}\n\n`;

    // Technician Performance
    csvContent += "Technician Performance\n";
    csvContent += "Technician Name,Assigned Tests,Completed,Completion Rate\n";
    Object.values(techStats).forEach(tech => {
      const rate = tech.assigned > 0 ? Math.round((tech.completed / tech.assigned) * 100) : 0;
      csvContent += `${tech.name},${tech.assigned},${tech.completed},${rate}%\n`;
    });
    
    // Test Volume
    csvContent += "\nTest Volume by Category\n";
    csvContent += "Category,Count\n";
    Object.entries(categoryStats).forEach(([category, count]) => {
      csvContent += `${category},${count}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laboratory_report_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `
      <html>
        <head>
          <title>Laboratory Report - ${timeframe}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            h2 { color: #555; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f8fafc; color: #334155; font-weight: 600; }
            tr:nth-child(even) { background-color: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>Laboratory Analytics Report (${timeframe.toUpperCase()})</h1>
          
          <h2>Overall Metrics</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Tests</td><td>${totalTests}</td></tr>
            <tr><td>Completed</td><td>${completedTests}</td></tr>
            <tr><td>Pending/Processing</td><td>${pendingTests + processingTests}</td></tr>
          </table>

          <h2>Technician Performance</h2>
          <table>
            <tr><th>Technician Name</th><th>Assigned Tests</th><th>Completed</th><th>Completion Rate</th></tr>
            ${Object.values(techStats).map(tech => {
              const rate = tech.assigned > 0 ? Math.round((tech.completed / tech.assigned) * 100) : 0;
              return '<tr><td>' + tech.name + '</td><td>' + tech.assigned + '</td><td>' + tech.completed + '</td><td>' + rate + '%</td></tr>';
            }).join('')}
          </table>

          <h2>Test Volume by Category</h2>
          <table>
            <tr><th>Category</th><th>Count</th></tr>
            ${Object.entries(categoryStats).map(([category, count]) => {
              return '<tr><td>' + category + '</td><td>' + count + '</td></tr>';
            }).join('')}
          </table>
          
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close(); 
              }, 250);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Laboratory Reports & Analytics</h1>
          <p className={styles.subtitle}>Analyze lab performance, test volumes, and equipment usage.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={exportToCSV}>
            <Download size={18} /> Export (CSV)
          </button>
          <button className={styles.btnPrimary} onClick={printReport}>
            <Printer size={18} /> Print Report
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
