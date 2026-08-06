import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DoctorCanteenClient from './DoctorCanteenClient';
import styles from './canteen.module.css';

export default async function DoctorCanteenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/doctor/login');
  }

  // Fetch doctor profile to determine delivery location
  const { data: profile } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', user.id)
    .single();

  let deliveryLocation = 'Doctor Cabin';
  if (profile && profile.department) {
    deliveryLocation = `Doctor Cabin - ${profile.department} Department`;
  }

  // Fetch food categories and menu items
  const { data: categories } = await supabase
    .from('food_categories')
    .select('*')
    .order('name');

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*, food_categories(name)')
    .eq('is_available', true);

  // Fetch previous orders
  const { data: previousOrders } = await supabase
    .from('canteen_orders')
    .select(`
      *,
      canteen_order_items(quantity, price_at_time, menu_items(name))
    `)
    .eq('staff_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Doctor's Canteen Portal</h1>
          <p className={styles.subtitle}>Order fresh food and beverages directly to your cabin.</p>
        </div>
      </div>

      <DoctorCanteenClient 
        categories={categories || []} 
        menuItems={menuItems || []} 
        deliveryLocation={deliveryLocation}
        doctorId={user.id}
        previousOrders={previousOrders || []}
      />
    </div>
  );
}
