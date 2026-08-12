import { createClient } from '@/utils/supabase/server';
import HistoryClient from './HistoryClient';

export default async function HistoryPage() {
  const supabase = await createClient();

  // Fetch all completed/released orders and reports to act as history
  const { data: history } = await supabase
    .from('lab_orders')
    .select(`
      *,
      patient:profiles!patient_id(first_name, last_name, date_of_birth, gender),
      doctor:doctors!doctor_id(first_name, last_name),
      reports:lab_reports(*)
    `)
    .in('status', ['Report Ready', 'Released'])
    .order('created_at', { ascending: false });

  // Extract unique patients for the filter dropdown
  const uniquePatients = Array.from(new Set((history || []).map((h: any) => h.patient_id)))
    .map(id => {
      const p = history?.find((h: any) => h.patient_id === id)?.patient;
      return { id, name: `${p?.first_name} ${p?.last_name}` };
    });

  return (
    <HistoryClient 
      historyData={history || []} 
      patients={uniquePatients}
    />
  );
}
