'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  ChefHat, 
  Clock, 
  CheckCircle, 
  XCircle, 
  IndianRupee,
  Utensils,
  Bell,
  Truck
} from 'lucide-react';
import styles from './dashboard.module.css';

interface DashboardClientProps {
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    outForDelivery: number;
    deliveredOrders: number;
    cancelledOrders: number;
    todayRevenue: number;
  };
  popularItems: { name: string; count: number }[];
  recentOrders: any[];
}

export default function DashboardClient({ metrics, popularItems, recentOrders }: DashboardClientProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Canteen Dashboard</h1>
          <p className={styles.subtitle}>Overview of today's canteen operations.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/canteen/orders" className={styles.btnPrimary}>
            View All Orders
          </Link>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} style={{ background: '#e0e7ff', color: '#4f46e5' }}>
              <IndianRupee size={24} />
            </span>
          </div>
          <p className={styles.cardLabel}>Today's Revenue</p>
          <h3 className={styles.cardValue}>₹{metrics.todayRevenue.toFixed(2)}</h3>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={24} />
            </span>
          </div>
          <p className={styles.cardLabel}>Pending Orders</p>
          <h3 className={styles.cardValue}>{metrics.pendingOrders}</h3>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} style={{ background: '#ffedd5', color: '#ea580c' }}>
              <ChefHat size={24} />
            </span>
          </div>
          <p className={styles.cardLabel}>Preparing / Ready</p>
          <h3 className={styles.cardValue}>{metrics.preparingOrders + metrics.readyOrders}</h3>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
              <Truck size={24} />
            </span>
          </div>
          <p className={styles.cardLabel}>Out for Delivery</p>
          <h3 className={styles.cardValue}>{metrics.outForDelivery}</h3>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}><Utensils size={18} /> Popular Items Today</h3>
          {popularItems.length > 0 ? (
            <div className={styles.list}>
              {popularItems.map((item, idx) => (
                <div key={idx} className={styles.listItem}>
                  <span>{item.name}</span>
                  <span className={styles.badge}>{item.count} ordered</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No items sold today yet.</p>
          )}
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}><Bell size={18} /> Recent Orders</h3>
          {recentOrders.length > 0 ? (
            <div className={styles.list}>
              {recentOrders.map((order, idx) => (
                <div key={idx} className={styles.listItem}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Order #{order.id.split('-')[0]}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {order.canteen_order_items?.length || 0} items
                    </div>
                  </div>
                  <span className={styles.badge} data-status={order.status}>{order.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No recent orders.</p>
          )}
        </div>
      </div>
    </div>
  );
}
