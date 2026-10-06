import { useEffect, useState } from 'react';
import type { Dashboard, UserRow } from '../lib/types';
import { fetchUsers } from '../lib/api';
import { fmt, fmtPct, growth, pct } from '../lib/format';
import { AreaChart, BarChart, Donut, Meters } from '../components/charts';
import { CardHead, KpiCard, Skeleton } from '../components/ui';
import { UsersTable } from '../components/UsersTable';
import { Icon } from '../components/Icon';
import type { PageId } from '../components/Shell';

export function Overview({ data, onNavigate, refreshKey }: { data: Dashboard; onNavigate: (p: PageId) => void; refreshKey: number }) {
  const [recent, setRecent] = useState<UserRow[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoadingRecent(true);
    fetchUsers('', 'all', 6, 0)
      .then((r) => alive && setRecent(r.rows))
      .catch(() => alive && setRecent([]))
      .finally(() => alive && setLoadingRecent(false));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const { users, activity, series, whatsapp, top_categories } = data;
  const labels = series.map((s) => s.day);
  const conversion = pct(users.premium, users.total);
  const waTotal = whatsapp.text + whatsapp.audio + whatsapp.image;

  return (
    <>
      <div className="grid">
        <div className="span-3 md-span-6">
          <KpiCard
            hero
            label="Usuarios totales"
            value={users.total}
            delta={growth(users.new_period, users.new_prev_period)}
            foot={`+${fmt(users.new_period)} en ${data.days} días`}
            spark={series.map((s) => s.signups)}
            onClick={() => onNavigate('users')}
          />
        </div>
        <div className="span-3 md-span-6">
          <KpiCard
            label="Nuevos registros"
            value={users.new_period}
            delta={growth(users.new_period, users.new_prev_period)}
            foot={`${fmt(users.new_today)} hoy`}
            delay={0.1}
          />
        </div>
        <div className="span-3 md-span-6">
          <KpiCard
            label="Usuarios Premium"
            value={users.premium}
            foot={`${fmtPct(conversion)} de conversión`}
            spark={series.map((s) => s.premium)}
            onClick={() => onNavigate('subscriptions')}
            delay={0.2}
          />
        </div>
        <div className="span-3 md-span-6">
          <KpiCard
            label="Activos este mes"
            value={activity.mau}
            foot={`${fmt(activity.wau)} esta semana · ${fmt(activity.dau)} hoy`}
            onClick={() => onNavigate('activity')}
            delay={0.3}
          />
        </div>

        <div className="card reveal span-8 xl-span-12">
          <CardHead
            title="Crecimiento de usuarios"
            sub="Registros y nuevas suscripciones por día"
            right={
              <div className="legend">
                <span><i style={{ background: 'var(--green)' }} />Registros</span>
                <span><i style={{ background: 'var(--forest)' }} />Premium</span>
              </div>
            }
          />
          <AreaChart
            labels={labels}
            series={[
              { key: 'signups', label: 'Registros', color: '#2DBE5A', values: series.map((s) => s.signups) },
              { key: 'premium', label: 'Premium', color: '#0F4527', values: series.map((s) => s.premium), dashed: true },
            ]}
          />
        </div>

        <div className="card reveal span-4 xl-span-6 md-span-12">
          <CardHead title="Plan de usuarios" sub="Gratis vs Premium" />
          <div className="donut-wrap">
            <Donut
              slices={[
                { label: 'Premium', value: users.premium, color: '#0F4527' },
                { label: 'Gratis', value: Math.max(0, users.total - users.premium), color: '#2DBE5A' },
              ]}
              center={
                <>
                  <strong>{fmtPct(conversion)}</strong>
                  <span>conversión</span>
                </>
              }
            />
            <div className="donut-list">
              <div className="donut-item"><i style={{ background: '#0F4527' }} /><span>Premium</span><b>{fmt(users.premium)}</b></div>
              <div className="donut-item"><i style={{ background: '#2DBE5A' }} /><span>Gratis</span><b>{fmt(users.total - users.premium)}</b></div>
              <div className="donut-item"><i style={{ background: '#E5484D' }} /><span>Cuentas borradas</span><b>{fmt(users.deleted)}</b></div>
            </div>
          </div>
        </div>

        <div className="card reveal span-5 xl-span-6 md-span-12">
          <CardHead title="Movimientos registrados" sub={`${fmt(activity.tx_period)} en ${data.days} días`} />
          <BarChart labels={labels} values={series.map((s) => s.transactions)} label="movimientos" />
        </div>

        <div className="card reveal span-4 md-span-6">
          <CardHead
            title="Bot de WhatsApp"
            sub={`${fmt(whatsapp.saved_period)} movimientos guardados`}
            right={<span className="badge green"><span className="dot" />{fmt(whatsapp.active_users_period)} usuarios</span>}
          />
          <Meters
            total={waTotal || 1}
            items={[
              { label: 'Texto', value: whatsapp.text, color: '#2DBE5A', iconBg: '#E8F8EE', icon: <Icon name="text" size={14} />, hint: fmtPct(pct(whatsapp.text, waTotal), 0) },
              { label: 'Notas de voz', value: whatsapp.audio, color: '#3B82F6', iconBg: '#E8F0FE', icon: <Icon name="mic" size={14} />, hint: fmtPct(pct(whatsapp.audio, waTotal), 0) },
              { label: 'Fotos de ticket', value: whatsapp.image, color: '#F5A524', iconBg: '#FFF4DC', icon: <Icon name="camera" size={14} />, hint: fmtPct(pct(whatsapp.image, waTotal), 0) },
            ]}
          />
        </div>

        <div className="card reveal span-3 md-span-6">
          <CardHead title="Top categorías" sub="Gastos del periodo" />
          {top_categories.length ? (
            <Meters items={top_categories.map((c, i) => ({ label: c.name, value: c.count, color: i === 0 ? '#0F4527' : '#2DBE5A' }))} />
          ) : (
            <div className="empty">Sin gastos todavía.</div>
          )}
        </div>

        <div className="card reveal span-12">
          <CardHead
            title="Usuarios recientes"
            sub="Las últimas cuentas creadas"
            right={
              <button className="btn ghost" onClick={() => onNavigate('users')}>
                Ver todos <Icon name="arrowUpRight" size={15} />
              </button>
            }
          />
          <UsersTable rows={recent} loading={loadingRecent} compact />
        </div>
      </div>
    </>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="grid">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card span-3 md-span-6" style={{ minHeight: 168 }}>
          <Skeleton h={14} w="50%" />
          <div style={{ height: 70 }} />
          <Skeleton h={38} w="60%" />
        </div>
      ))}
      <div className="card span-8 xl-span-12"><Skeleton h={300} /></div>
      <div className="card span-4 xl-span-6 md-span-12"><Skeleton h={300} /></div>
    </div>
  );
}
