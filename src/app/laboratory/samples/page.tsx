import { createClient } from '@/utils/supabase/server';
import SamplesClient from './SamplesClient';

export default async function SampleManagementPage() {
  const supabase = await createClient();

  // Fetch orders that are waiting for sample collection
  const { data: pendingOrders } = await supabase
    .from('lab_orders')
    .select(`
      *,
      profiles!patient_id(first_name, last_name, date_of_birth, gender)
    `)
    .in('status', ['Sample Requested'])
    .order('created_at', { ascending: false });

  // Fetch collected/processing samples
  const { data: samples } = await supabase
    .from('lab_samples')
    .select(`
      *,
      order:lab_orders!order_id(
        *,
        patient:profiles!patient_id(first_name, last_name)
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <SamplesClient 
      pendingOrders={pendingOrders || []} 
      initialSamples={samples || []} 
    />
  );
}
