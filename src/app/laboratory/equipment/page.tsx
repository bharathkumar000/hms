import { createClient } from '@/utils/supabase/server';
import EquipmentClient from './EquipmentClient';

export default async function EquipmentPage() {
  const supabase = await createClient();

  // Fetch equipment
  const { data: equipment } = await supabase
    .from('equipment')
    .select('*')
    .eq('department', 'Laboratory')
    .order('name');

  // Fetch reagents
  const { data: reagents } = await supabase
    .from('lab_reagents')
    .select('*')
    .order('name');

  // Fetch maintenance schedules
  const { data: maintenance } = await supabase
    .from('lab_maintenance')
    .select('*, equipment:equipment!equipment_id(*)')
    .order('scheduled_date', { ascending: false });

  return (
    <EquipmentClient 
      initialEquipment={equipment || []} 
      initialReagents={reagents || []}
      initialMaintenance={maintenance || []}
    />
  );
}
