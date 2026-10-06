import { useEffect, useState } from 'react';
import type { Dashboard, UserFilter, UserRow } from '../lib/types';
import { fetchUsers } from '../lib/api';
import { fmt, fmtPct, pct } from '../lib/format';
import { CardHead, ErrorCard, KpiCard, Pager } from '../components/ui';
import { UsersTable } from '../components/UsersTable';

const FILTERS: { id: UserFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'premium', label: 'Premium' },
  { id: 'free', label: 'Gratis' },
  { id: 'whatsapp', label: 'Con WhatsApp' },
  { id: 'inactive', label: 'Inactivos +30 días' },
];

const LIMIT = 15;

export function Users({ data, search, refreshKey }: { data: Dashboard; search: string; refreshKey: number }) {
  const [filter, setFilter] = useState<UserFilter>('all');
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setOffset(0), [query, filter]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchUsers(query, filter, LIMIT, offset)
      .then((r) => {
        if (!alive) return;
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [query, filter, offset, refreshKey]);

  const { users, activity } = data;

  return (
    <div className="grid">
      <div className="span-3 md-span-6">
        <KpiCard hero label="Cuentas creadas" value={users.total} foot={`${fmt(users.new_today)} nuevas hoy`} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard label="Premium" value={users.premium} foot={`${fmtPct(pct(users.premium, users.total))} del total`} delay={0.1} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard label="Con WhatsApp" value={users.whatsapp_linked} foot={`${fmtPct(pct(users.whatsapp_linked, users.total))} del total`} delay={0.2} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard
          label="Sin actividad (30 días)"
          value={Math.max(0, users.total - activity.mau)}
          foot={`${fmtPct(pct(users.total - activity.mau, users.total))} del total`}
          delay={0.3}
        />
      </div>

      <div className="card reveal span-12">
        <CardHead title="Todos los usuarios" sub={search ? `Resultados para “${search}”` : 'Ordenados por fecha de registro'} />
        <div className="toolbar">
          <div className="chips">
            {FILTERS.map((f) => (
              <button key={f.id} className={`chip ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {error ? <ErrorCard message={error} /> : <UsersTable rows={rows} loading={loading} />}
        <Pager total={total} limit={LIMIT} offset={offset} onChange={setOffset} />
      </div>
    </div>
  );
}
