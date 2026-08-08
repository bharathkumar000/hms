import { createClient } from '@/utils/supabase/server';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const supabase = await createClient();

  // Fetch all reports that are either Pending Approval or Approved (ready to release)
  const { data: reports } = await supabase
    .from('lab_reports')
    .select(`
      *,
      order:lab_orders!order_id(
        *,
        patient:profiles!patient_id(first_name, last_name, date_of_birth, gender),
        doctor:doctors!doctor_id(first_name, last_name)
      ),
      technician:lab_staff!technician_id(first_name, last_name)
    `)
    .in('status', ['Pending Approval', 'Approved', 'Released'])
    .order('updated_at', { ascending: false });

  // Fetch current user
  const { data: { user } } = await supabase.auth.getUser();
  let currentStaff = null;
  if (user) {
    const { data: profile } = await supabase
      .from('lab_staff')
      .select('id, role')
      .eq('user_id', user.id)
      .single();
    if (profile) currentStaff = profile;
  }

  return (
    <ReportsClient 
      initialReports={reports || []} 
      currentStaff={currentStaff}
    />
  );
}
