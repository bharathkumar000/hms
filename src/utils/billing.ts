import { createClient } from '@/utils/supabase/client';

export const addChargeToPatient = async (
  patientId: string,
  appointmentId: string | null,
  itemName: string,
  itemType: string,
  unitPrice: number,
  quantity: number = 1
) => {
  const supabase = createClient();
  const amount = unitPrice * quantity;

  try {
    // 1. Check if patient has a Pending bill
    const { data: existingBills, error: fetchError } = await supabase
      .from('bills')
      .select('id')
      .eq('patient_id', patientId)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    let targetBillId = null;

    if (existingBills && existingBills.length > 0) {
      targetBillId = existingBills[0].id;
    } else {
      // 2. Create new Pending bill if none exists
      const { data: newBill, error: insertError } = await supabase
        .from('bills')
        .insert([{
          patient_id: patientId,
          appointment_id: appointmentId,
          status: 'Pending',
          bill_type: 'General',
          total_amount: 0,
          amount_paid: 0
        }])
        .select('id')
        .single();

      if (insertError) throw insertError;
      targetBillId = newBill.id;
    }

    // 3. Add the bill item
    const { error: itemError } = await supabase
      .from('bill_items')
      .insert([{
        bill_id: targetBillId,
        item_name: itemName,
        item_type: itemType,
        quantity,
        unit_price: unitPrice,
        amount
      }]);

    if (itemError) throw itemError;

    return { success: true, billId: targetBillId };

  } catch (error: any) {
    console.error('Billing automation error:', error);
    return { success: false, error: error.message };
  }
};
