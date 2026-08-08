import { createClient } from './supabase/client';

export type LabOrder = {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_category: string;
  notes: string;
  status: string;
  urgent: boolean;
  created_at: string;
  patient?: { first_name: string; last_name: string };
  doctor?: { first_name: string; last_name: string };
};

export type LabSample = {
  id: string;
  order_id: string;
  barcode: string;
  status: string;
  collected_by: string;
  collection_notes: string;
  recollection_required: boolean;
  created_at: string;
  order?: LabOrder;
};

export type LabReport = {
  id: string;
  order_id: string;
  status: string;
  results_data: any;
  remarks: string;
  created_at: string;
  order?: LabOrder;
};

export type Equipment = {
  id: string;
  name: string;
  category: string;
  status: string;
  location: string;
};

export type Reagent = {
  id: string;
  name: string;
  manufacturer: string;
  stock_level: number;
  minimum_stock: number;
  unit: string;
  expiry_date: string;
};

export const getDashboardStats = async () => {
  const supabase = createClient();
  const [ordersRes, samplesRes, testsRes, reportsRes] = await Promise.all([
    supabase.from('lab_orders').select('id', { count: 'exact' }).eq('status', 'Pending'),
    supabase.from('lab_samples').select('id', { count: 'exact' }).eq('status', 'Collected'),
    supabase.from('lab_samples').select('id', { count: 'exact' }).eq('status', 'Processing'),
    supabase.from('lab_reports').select('id', { count: 'exact' }).eq('status', 'Released'),
  ]);

  return {
    pendingRequests: ordersRes.count || 0,
    samplesCollected: samplesRes.count || 0,
    testsInProgress: testsRes.count || 0,
    reportsReady: reportsRes.count || 0,
  };
};

export const getLabOrders = async (status?: string) => {
  const supabase = createClient();
  let query = supabase.from('lab_orders').select(`
    *,
    patient:profiles!patient_id (first_name, last_name),
    doctor:doctors!doctor_id (first_name, last_name)
  `).order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as LabOrder[];
};

export const updateLabOrder = async (id: string, updates: Partial<LabOrder>) => {
  const supabase = createClient();
  const { error } = await supabase.from('lab_orders').update(updates).eq('id', id);
  if (error) throw error;
};

export const getLabSamples = async (status?: string) => {
  const supabase = createClient();
  let query = supabase.from('lab_samples').select(`
    *,
    order:lab_orders!order_id (
      *,
      patient:profiles!patient_id (first_name, last_name)
    )
  `).order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as LabSample[];
};

export const updateLabSample = async (id: string, updates: Partial<LabSample>) => {
  const supabase = createClient();
  const { error } = await supabase.from('lab_samples').update(updates).eq('id', id);
  if (error) throw error;
};

export const getLabReports = async (status?: string) => {
  const supabase = createClient();
  let query = supabase.from('lab_reports').select(`
    *,
    order:lab_orders!order_id (
      *,
      patient:profiles!patient_id (first_name, last_name),
      doctor:doctors!doctor_id (first_name, last_name)
    )
  `).order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as LabReport[];
};

export const updateLabReport = async (id: string, updates: Partial<LabReport>) => {
  const supabase = createClient();
  const { error } = await supabase.from('lab_reports').update(updates).eq('id', id);
  if (error) throw error;
};

export const getEquipment = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from('equipment').select('*').eq('department', 'Laboratory').order('name');
  if (error) throw error;
  return data as Equipment[];
};

export const getReagents = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from('lab_reagents').select('*').order('name');
  if (error) throw error;
  return data as Reagent[];
};

export const generateBarcode = (orderId: string) => {
  return `LAB-${orderId.substring(0, 8).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
};
