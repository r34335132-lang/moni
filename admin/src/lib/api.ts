import { supabase } from './supabase';
import type { Dashboard, Page, SubRow, SubStatus, UserFilter, UserRow } from './types';

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City';

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    if (error.code === '42501') throw new Error('Tu cuenta no tiene permisos de administrador.');
    if (error.code === 'PGRST202') throw new Error('Falta correr la migración 008_admin_dashboard.sql en Supabase.');
    throw new Error(error.message);
  }
  return data as T;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    if (error.code === 'PGRST202') throw new Error('Falta correr la migración 008_admin_dashboard.sql en Supabase.');
    throw new Error(error.message);
  }
  return data === true;
}

export function fetchDashboard(days: number): Promise<Dashboard> {
  return rpc<Dashboard>('admin_dashboard', { p_days: days, p_tz: TZ });
}

export function fetchUsers(search: string, filter: UserFilter, limit: number, offset: number): Promise<Page<UserRow>> {
  return rpc<Page<UserRow>>('admin_list_users', {
    p_search: search || null,
    p_filter: filter,
    p_limit: limit,
    p_offset: offset,
  });
}

export function fetchSubscriptions(status: SubStatus, limit: number, offset: number): Promise<Page<SubRow>> {
  return rpc<Page<SubRow>>('admin_list_subscriptions', { p_status: status, p_limit: limit, p_offset: offset });
}
