import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { BarChart3, TrendingUp, IndianRupee, Utensils } from 'lucide-react';
import styles from './reports.module.css';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/canteen/login');
  }

  // Fetch all orders for report calculation
  const { data: orders } = await supabase
    .from('canteen_orders')
    .select('*, canteen_order_items(menu_item_id, quantity, price_at_time, menu_items(name))')
    .neq('status', 'Cancelled');

  const safeOrders = orders || [];

  // Calculate Revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisWeek = new Date(today);
  thisWeek.setDate(today.getDate() - 7);

  const thisMonth = new Date(today);
  thisMonth.setMonth(today.getMonth() - 1);

  const todayRevenue = safeOrders
    .filter(o => new Date(o.created_at) >= today)
    .reduce((sum, order) => sum + Number(order.total_amount), 0);

  const weeklyRevenue = safeOrders
    .filter(o => new Date(o.created_at) >= thisWeek)
    .reduce((sum, order) => sum + Number(order.total_amount), 0);

  const monthlyRevenue = safeOrders
    .filter(o => new Date(o.created_at) >= thisMonth)
    .reduce((sum, order) => sum + Number(order.total_amount), 0);

  // Calculate Popular Items
  const itemCounts: Record<string, { name: string, count: number, revenue: number }> = {};
  safeOrders.forEach(order => {
    order.canteen_order_items?.forEach((item: any) => {
      const id = item.menu_item_id;
      const name = item.menu_items?.name || 'Unknown Item';
      if (!itemCounts[id]) {
        itemCounts[id] = { name, count: 0, revenue: 0 };
      }
      itemCounts[id].count += Number(item.quantity);
      itemCounts[id].revenue += Number(item.quantity) * Number(item.price_at_time);
    });
  });

  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const leastSelling = Object.values(itemCounts)
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Revenue & Reports</h1>
          <p className={styles.subtitle}>Analytics and performance metrics for the canteen.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#e0e7ff', color: '#4f46e5', borderRadius: '0.5rem' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Today's Revenue</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{todayRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#dcfce7', color: '#16a34a', borderRadius: '0.5rem' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Weekly Revenue</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{weeklyRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f3e8ff', color: '#9333ea', borderRadius: '0.5rem' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Monthly Revenue</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{monthlyRevenue.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className={styles.card}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <Utensils size={20} color="var(--color-primary)" /> Top Selling Items
          </h3>
          {topItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 700, color: '#9ca3af', width: '20px' }}>#{idx + 1}</span>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 600 }}>{item.count} sold</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>₹{item.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>No data available.</p>
          )}
        </div>

        <div className={styles.card}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            Least Selling Items
          </h3>
          {leastSelling.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {leastSelling.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{item.count} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>No data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
