import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import CanteenClient from './CanteenClient';
import styles from './canteen.module.css';

export default async function CanteenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/patient/login');
  }

  // Fetch admission to determine delivery location
  const { data: admission } = await supabase
    .from('admissions')
    .select(`
      id,
      beds(bed_number, rooms(room_number, wards(name)))
    `)
    .eq('patient_id', user.id)
    .eq('status', 'Admitted')
    .order('admission_date', { ascending: false })
    .limit(1)
    .single();

  let deliveryLocation = 'Self Pickup / OP Visit';
  if (admission && admission.beds) {
    const beds = admission.beds as any;
    deliveryLocation = `${beds.rooms?.wards?.name} - Room ${beds.rooms?.room_number}, Bed ${beds.bed_number}`;
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
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hospital Canteen</h1>
          <p className={styles.subtitle}>Order fresh and healthy food directly to your room.</p>
        </div>
      </div>

      <CanteenClient 
        categories={categories || []} 
        menuItems={menuItems || []} 
        deliveryLocation={deliveryLocation}
        admissionId={admission?.id || null}
        patientId={user.id}
        previousOrders={previousOrders || []}
      />
    </div>
  );
}
