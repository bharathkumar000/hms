import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DashboardClient from './DashboardClient';

export default async function CanteenDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/canteen/login');
  }

  // Get today's start date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  // Fetch orders for today
  const { data: orders } = await supabase
    .from('canteen_orders')
    .select('*, canteen_order_items(menu_item_id, quantity, price_at_time, menu_items(name))')
    .gte('created_at', todayIso);

  const safeOrders = orders || [];

  // Calculate metrics
  const totalOrders = safeOrders.length;
  const pendingOrders = safeOrders.filter(o => o.status === 'Pending').length;
  const preparingOrders = safeOrders.filter(o => o.status === 'Preparing').length;
  const readyOrders = safeOrders.filter(o => o.status === 'Ready').length;
  const outForDelivery = safeOrders.filter(o => o.status === 'Out for Delivery').length;
  const deliveredOrders = safeOrders.filter(o => o.status === 'Delivered').length;
  const cancelledOrders = safeOrders.filter(o => o.status === 'Cancelled').length;

  const todayRevenue = safeOrders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

  // Calculate popular items
  const itemCounts: Record<string, { name: string, count: number }> = {};
  safeOrders.forEach(order => {
    if (order.status !== 'Cancelled') {
      order.canteen_order_items?.forEach((item: any) => {
        const id = item.menu_item_id;
        const name = item.menu_items?.name || 'Unknown Item';
        if (!itemCounts[id]) {
          itemCounts[id] = { name, count: 0 };
        }
        itemCounts[id].count += Number(item.quantity);
      });
    }
  });

  const popularItems = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <DashboardClient 
      metrics={{
        totalOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        outForDelivery,
        deliveredOrders,
        cancelledOrders,
        todayRevenue
      }}
      popularItems={popularItems}
      recentOrders={safeOrders.slice(0, 5)}
    />
  );
}
