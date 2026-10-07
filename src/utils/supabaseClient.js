import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zpwufyfvggjffmgxhgcf.supabase.co";
const supabaseAnonKey = "sb_publishable_fgk2R8s3-p3sSDr8ItktLg_h9TkxhZc";

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
