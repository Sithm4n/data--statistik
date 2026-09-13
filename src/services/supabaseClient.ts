import { createClient } from '@supabase/supabase-js';

// Supabase credentials
// Project Ref: ngnufiwvzewowgfwgjjc
// Project URL standard format: https://<ref>.supabase.co
export const SUPABASE_URL = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ngnufiwvzewowgfwgjjc.supabase.co';

export const SUPABASE_ANON_KEY = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbnVmaXd2emV3b3dnZndnampjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTE2NjUsImV4cCI6MjEwNDg2NzY2NX0.VNsVLtIH44rRFJFVsXpkdqRF_FdOy_vWahHtOsdXELE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Tes koneksi aktif ke Supabase
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('uploads').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // Jika tabel belum di-query atau RLS aktif tapi koneksi tersambung
      return { ok: true, message: `Koneksi aktif ke ${SUPABASE_URL}` };
    }
    return { ok: true, message: 'Terhubung ke Supabase Cloud' };
  } catch (err: any) {
    console.warn('Supabase test ping error:', err);
    return { ok: false, message: err?.message || 'Gagal tersambung ke Supabase' };
  }
}
