import { createClient } from '@/utils/supabase/server';
import RequestsClient from './RequestsClient';

export default async function TestRequestsPage() {
  const supabase = await createClient();

  // Fetch all pending test requests and their related details
  const { data: requests, error } = await supabase
    .from('lab_orders')
    .select(`
      *,
      profiles!patient_id(first_name, last_name, gender, date_of_birth),
      doctors!doctor_id(first_name, last_name, specialization)
    `)
    .in('status', ['Pending'])
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching lab requests:', error);
  }

  // Fetch laboratory staff for assignment
  const { data: staff } = await supabase
    .from('lab_staff')
    .select('id, first_name, last_name, role');

  return (
    <RequestsClient 
      initialRequests={requests || []} 
      staff={staff || []}
    />
  );
}
