export type KeyCount = { key: string; count: number };

export type SeriesPoint = {
  day: string;
  signups: number;
  premium: number;
  transactions: number;
  active_users: number;
};

export type Dashboard = {
  days: number;
  from: string;
  to: string;
  generated_at: string;
  users: {
    total: number;
    deleted: number;
    new_today: number;
    new_period: number;
    new_prev_period: number;
    premium: number;
    whatsapp_linked: number;
  };
  activity: {
    dau: number;
    wau: number;
    mau: number;
    active_period: number;
    tx_period: number;
    tx_prev_period: number;
    tx_total: number;
  };
  subscriptions: {
    active: number;
    grace: number;
    cancelled: number;
    expired: number;
    new_period: number;
    churned_period: number;
    by_platform: KeyCount[];
    by_product: KeyCount[];
  };
  series: SeriesPoint[];
  whatsapp: {
    linked: number;
    linked_period: number;
    saved_period: number;
    discarded_period: number;
    text: number;
    audio: number;
    image: number;
    active_users_period: number;
  };
  top_categories: { name: string; count: number }[];
};

export type UserFilter = 'all' | 'premium' | 'free' | 'whatsapp' | 'inactive';

export type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
  created_at: string;
  whatsapp_linked_at: string | null;
  premium: boolean;
  product_id: string | null;
  platform: string | null;
  expiration_date: string | null;
  last_tx_at: string | null;
  tx_count: number;
};

export type SubStatus = 'all' | 'active' | 'grace_period' | 'cancelled' | 'expired';

export type SubRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  platform: 'ios' | 'android';
  product_id: string;
  status: Exclude<SubStatus, 'all'>;
  purchase_date: string;
  expiration_date: string | null;
  updated_at: string;
};

export type Page<T> = { total: number; rows: T[] };
