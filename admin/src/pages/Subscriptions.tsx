import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Dashboard, SubRow, SubStatus } from '../lib/types';
import { fetchSubscriptions } from '../lib/api';
import { estimateMrr, fmt, fmtDate, fmtMoney, fmtPct, isYearly, pct, platformLabel, productLabel } from '../lib/format';
import { AreaChart, Donut, Meters } from '../components/charts';
import { Avatar, Badge, CardHead, ErrorCard, KpiCard, Pager, Skeleton } from '../components/ui';
import { Icon } from '../components/Icon';

const STATUS: { id: SubStatus; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'grace_period', label: 'En periodo de gracia' },
  { id: 'cancelled', label: 'Canceladas' },
  { id: 'expired', label: 'Vencidas' },
];

const STATUS_BADGE: Record<SubRow['status'], { tone: 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
  active: { tone: 'green', label: 'Activa' },
  grace_period: { tone: 'amber', label: 'En gracia' },
  cancelled: { tone: 'red', label: 'Cancelada' },
  expired: { tone: 'gray', label: 'Vencida' },
};

const LIMIT = 12;

export function Subscriptions({ data, refreshKey }: { data: Dashboard; refreshKey: number }) {
  const [status, setStatus] = useState<SubStatus>('all');
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<SubRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const body = useRef<HTMLTableSectionElement>(null);

  useEffect(() => setOffset(0), [status]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchSubscriptions(status, LIMIT, offset)
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
  }, [status, offset, refreshKey]);

  useLayoutEffect(() => {
    if (!body.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.from('tr', { opacity: 0, x: -12, duration: 0.5, ease: 'power2.out', stagger: 0.035, clearProps: 'all' });
    }, body);
    return () => ctx.revert();
  }, [rows, loading]);

  const { subscriptions: s, users, series } = data;
  const paying = s.active + s.grace;
  const mrr = estimateMrr(s.by_product);
  const monthly = s.by_product.filter((p) => !isYearly(p.key)).reduce((a, p) => a + p.count, 0);
  const yearly = s.by_product.filter((p) => isYearly(p.key)).reduce((a, p) => a + p.count, 0);
  const ios = s.by_platform.find((p) => p.key === 'ios')?.count ?? 0;
  const android = s.by_platform.find((p) => p.key === 'android')?.count ?? 0;
  const churnRate = pct(s.churned_period, paying + s.churned_period);

  return (
    <div className="grid">
      <div className="span-3 md-span-6">
        <KpiCard hero label="Suscripciones activas" value={paying} foot={`${fmtPct(pct(users.premium, users.total))} de los usuarios`} spark={series.map((p) => p.premium)} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard label="Ingreso mensual estimado" value={mrr} format={fmtMoney} foot="Antes de comisión de tiendas" delay={0.1} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard label="Nuevas suscripciones" value={s.new_period} foot={`en ${data.days} días`} delay={0.2} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard label="Bajas" value={s.churned_period} foot={`${fmtPct(churnRate)} de cancelación en ${data.days} días`} delay={0.3} />
      </div>

      <div className="card reveal span-8 xl-span-12">
        <CardHead title="Nuevas suscripciones por día" sub="Compras registradas desde la app" />
        <AreaChart labels={series.map((p) => p.day)} series={[{ key: 'subs', label: 'Suscripciones', color: '#0F4527', values: series.map((p) => p.premium) }]} />
      </div>

      <div className="card reveal span-4 xl-span-6 md-span-12">
        <CardHead title="Por plataforma" sub="Suscripciones vigentes" />
        <div className="donut-wrap">
          <Donut
            slices={[
              { label: 'iOS', value: ios, color: '#111113' },
              { label: 'Android', value: android, color: '#2DBE5A' },
            ]}
            center={
              <>
                <strong>{fmt(ios + android)}</strong>
                <span>vigentes</span>
              </>
            }
          />
          <div className="donut-list">
            <div className="donut-item"><i style={{ background: '#111113' }} /><span>iOS</span><b>{fmt(ios)}</b></div>
            <div className="donut-item"><i style={{ background: '#2DBE5A' }} /><span>Android</span><b>{fmt(android)}</b></div>
          </div>
        </div>
      </div>

      <div className="card reveal span-4 xl-span-6 md-span-12">
        <CardHead title="Tipo de plan" sub="Mensual vs anual" />
        <Meters
          total={Math.max(1, monthly + yearly)}
          items={[
            { label: 'Mensual', value: monthly, color: '#2DBE5A', iconBg: '#E8F8EE', icon: <Icon name="calendar" size={14} />, hint: fmtPct(pct(monthly, monthly + yearly), 0) },
            { label: 'Anual', value: yearly, color: '#0F4527', iconBg: '#E8F8EE', icon: <Icon name="sparkle" size={14} />, hint: fmtPct(pct(yearly, monthly + yearly), 0) },
          ]}
        />
      </div>

      <div className="card reveal span-8 xl-span-12">
        <CardHead title="Estado de las suscripciones" sub="Historial completo" />
        <div className="mini-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="mini"><span>Activas</span><strong style={{ color: 'var(--green-ink)' }}>{fmt(s.active)}</strong></div>
          <div className="mini"><span>En gracia</span><strong style={{ color: '#8a5a00' }}>{fmt(s.grace)}</strong></div>
          <div className="mini"><span>Canceladas</span><strong style={{ color: '#b4232a' }}>{fmt(s.cancelled)}</strong></div>
          <div className="mini"><span>Vencidas</span><strong className="muted">{fmt(s.expired)}</strong></div>
        </div>
      </div>

      <div className="card reveal span-12">
        <CardHead title="Suscripciones" sub="Más recientes primero" />
        <div className="toolbar">
          <div className="chips">
            {STATUS.map((st) => (
              <button key={st.id} className={`chip ${status === st.id ? 'on' : ''}`} onClick={() => setStatus(st.id)}>
                {st.label}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <ErrorCard message={error} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Plan</th>
                  <th>Plataforma</th>
                  <th>Estado</th>
                  <th>Compra</th>
                  <th>Vence</th>
                </tr>
              </thead>
              <tbody ref={body}>
                {loading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i}>
                        <td colSpan={6}><Skeleton h={28} /></td>
                      </tr>
                    ))
                  : rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="person">
                            <Avatar name={r.full_name || r.email || '?'} seed={r.user_id} />
                            <div>
                              <div className="person-name">{r.full_name || 'Sin nombre'}</div>
                              <div className="person-mail">{r.email ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge tone={isYearly(r.product_id) ? 'blue' : 'gray'}>{productLabel(r.product_id)}</Badge>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Icon name="phone" size={15} />
                            {platformLabel(r.platform)}
                          </span>
                        </td>
                        <td>
                          <Badge tone={STATUS_BADGE[r.status].tone} dot>
                            {STATUS_BADGE[r.status].label}
                          </Badge>
                        </td>
                        <td className="muted">{fmtDate(r.purchase_date)}</td>
                        <td className="muted">{r.expiration_date ? fmtDate(r.expiration_date) : 'Renovación automática'}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!loading && !rows.length && <div className="empty">Todavía no hay suscripciones con este estado.</div>}
          </div>
        )}
        <Pager total={total} limit={LIMIT} offset={offset} onChange={setOffset} />
      </div>
    </div>
  );
}
