import { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];

export type Profile = Tables['profiles']['Row'] & {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: 'admin' | 'manager' | 'customer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>> & { updated_at?: string };
