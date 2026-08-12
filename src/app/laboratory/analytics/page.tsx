import { createClient } from '@/utils/supabase/server';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch all orders to compute stats
  const { data: allOrders } = await supabase
    .from('lab_orders')
    .select('*, technician:lab_staff!technician_id(first_name, last_name)');
    
  const { data: maintenanceLogs } = await supabase
    .from('lab_maintenance')
    .select('*, equipment:equipment!equipment_id(name)');

  return <AnalyticsClient orders={allOrders || []} maintenanceLogs={maintenanceLogs || []} />;
}
