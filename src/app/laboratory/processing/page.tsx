import { createClient } from '@/utils/supabase/server';
import ProcessingClient from './ProcessingClient';

export default async function ProcessingPage() {
  const supabase = await createClient();

  // Fetch samples that are in Processing status or Collected (ready to start processing)
  const { data: samples } = await supabase
    .from('lab_samples')
    .select(`
      *,
      order:lab_orders!order_id(
        *,
        patient:profiles!patient_id(first_name, last_name, date_of_birth, gender)
      )
    `)
    .in('status', ['Collected', 'Processing'])
    .order('created_at', { ascending: true });

  // Fetch draft reports for these orders
  const orderIds = samples?.map((s: any) => s.order_id) || [];
  
  let reports = [];
  if (orderIds.length > 0) {
    const { data: reportData } = await supabase
      .from('lab_reports')
      .select('*')
      .in('order_id', orderIds);
    reports = reportData || [];
  }

  // Fetch lab staff for assignment/tracking (Current logged in user info ideally)
  const { data: { user } } = await supabase.auth.getUser();
  let currentUserStaffId = null;
  if (user) {
    const { data: profile } = await supabase
      .from('lab_staff')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (profile) currentUserStaffId = profile.id;
  }

  return (
    <ProcessingClient 
      initialSamples={samples || []} 
      initialReports={reports}
      currentStaffId={currentUserStaffId}
    />
  );
}
