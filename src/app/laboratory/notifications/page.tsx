import { createClient } from '@/utils/supabase/server';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let notifications: any[] = [];
  
  // Since this is a demo environment where anyone can be lab staff, we might want to fetch all lab-related notifications.
  // We'll fetch notifications targeted at the user, or system notifications.
  if (user) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    notifications = data || [];
  } else {
    // If no user but still rendering (maybe dev mode without strict auth middleware)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    notifications = data || [];
  }

  // To simulate the requested alerts if the notifications table doesn't have them yet:
  // (In a real app, triggers would populate the notifications table)
  const { data: urgentOrders } = await supabase
    .from('lab_orders')
    .select('*, patient:profiles!patient_id(first_name, last_name)')
    .eq('urgent', true)
    .in('status', ['Pending', 'Sample Requested']);
    
  if (urgentOrders) {
    urgentOrders.forEach(order => {
      // Create a virtual notification for the UI if it doesn't exist
      notifications.push({
        id: 'virtual-urgent-' + order.id,
        title: 'Urgent Test Request',
        message: `Urgent test ${order.test_category} requested for ${order.patient?.first_name} ${order.patient?.last_name}.`,
        type: 'Urgent',
        is_read: false,
        created_at: order.created_at,
        isVirtual: true
      });
    });
  }
  
  // Sort by date again after injecting virtuals
  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return <NotificationsClient initialNotifications={notifications} userId={user?.id || ''} />;
}
