import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Patient } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
}

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing. Database features will be disabled.');
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Auth Functions
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

// Data Functions
export async function getPatients() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createPatient(patient: { name: string; age: number; complaint: string }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('pacientes')
    .insert([{ ...patient, status: 'active', user_id: user.id }])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updatePatient(id: string, updates: Partial<Patient>) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('pacientes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function saveConceptualization(patientId: string, inputData: string, resultText: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('conceituacoes_caso')
    .insert([{ 
      patient_id: patientId, 
      input_data: inputData, 
      result_text: resultText,
      user_id: user.id 
    }])
    .select();
  if (error) throw error;
  return data[0];
}

export async function getConceptualizationHistory(patientId: string) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('conceituacoes_caso')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  const supabase = getSupabase();
  if (!supabase) return { activePatients: 0, todaySessions: 0, savedProtocols: 0 };

  const user = await getCurrentUser();
  if (!user) return { activePatients: 0, todaySessions: 0, savedProtocols: 0 };

  try {
    // Count active patients
    const { count: activePatients } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Count today's sessions
    const today = new Date().toISOString().split('T')[0];
    const { count: todaySessions } = await supabase
      .from('sessoes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('date', today);

    // Count saved protocols (conceptualizations)
    const { count: savedProtocols } = await supabase
      .from('conceituacoes_caso')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return {
      activePatients: activePatients || 0,
      todaySessions: todaySessions || 0,
      savedProtocols: savedProtocols || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { activePatients: 0, todaySessions: 0, savedProtocols: 0 };
  }
}
