import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Dashboard } from '../lib/types';
import { fmt, fmtPct, growth, pct } from '../lib/format';
import { AreaChart, BarChart, Meters } from '../components/charts';
import { CardHead, KpiCard } from '../components/ui';
import { Icon } from '../components/Icon';

function Funnel({ steps }: { steps: { label: string; value: number; color: string; ink: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(1, steps[0]?.value ?? 1);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.fill', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.out', stagger: 0.15, delay: 0.3 });
    }, ref);
    return () => ctx.revert();
  }, [steps.map((s) => s.value).join(',')]);

  return (
    <div className="funnel" ref={ref}>
      {steps.map((s, i) => (
        <div key={s.label} className="funnel-step" style={{ background: 'var(--bg)', color: s.ink }}>
          <div className="fill" style={{ width: `${Math.max(4, (s.value / max) * 100)}%`, background: s.color }} />
          <span>{s.label}</span>
          <b className="num">
            {fmt(s.value)}
            {i > 0 && <span style={{ opacity: 0.6, fontWeight: 600, marginLeft: 8 }}>{fmtPct(pct(s.value, steps[i - 1].value), 0)}</span>}
          </b>
        </div>
      ))}
    </div>
  );
}

export function Activity({ data }: { data: Dashboard }) {
  const { activity, series, whatsapp, users, top_categories } = data;
  const labels = series.map((s) => s.day);
  const stickiness = pct(activity.dau, activity.mau);
  const perUser = activity.active_period ? activity.tx_period / activity.active_period : 0;
  const waTotal = whatsapp.text + whatsapp.audio + whatsapp.image;

  return (
    <div className="grid">
      <div className="span-3 md-span-6">
        <KpiCard hero label="Activos hoy" value={activity.dau} foot={`${fmtPct(stickiness)} de los activos del mes`} spark={series.map((s) => s.active_users)} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard label="Activos en 7 días" value={activity.wau} foot={`${fmtPct(pct(activity.wau, users.total))} de los usuarios`} delay={0.1} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard label="Activos en 30 días" value={activity.mau} foot={`${fmtPct(pct(activity.mau, users.total))} de los usuarios`} delay={0.2} />
      </div>
      <div className="span-3 md-span-6">
        <KpiCard
          label="Movimientos"
          value={activity.tx_period}
          delta={growth(activity.tx_period, activity.tx_prev_period)}
          foot={`${perUser.toFixed(1)} por usuario activo`}
          delay={0.3}
        />
      </div>

      <div className="card reveal span-8 xl-span-12">
        <CardHead
          title="Usuarios activos por día"
          sub="Personas que registraron al menos un movimiento"
          right={<span className="badge green"><span className="dot" />{fmt(activity.active_period)} en el periodo</span>}
        />
        <AreaChart labels={labels} series={[{ key: 'active', label: 'Activos', color: '#2DBE5A', values: series.map((s) => s.active_users) }]} />
      </div>

      <div className="card reveal span-4 xl-span-6 md-span-12">
        <CardHead title="Embudo de WhatsApp" sub={`Últimos ${data.days} días`} />
        <Funnel
          steps={[
            { label: 'Usuarios', value: users.total, color: '#D7F3E0', ink: 'var(--green-ink)' },
            { label: 'Vinculados', value: whatsapp.linked, color: '#9BE3B4', ink: 'var(--green-ink)' },
            { label: 'Usaron el bot', value: whatsapp.active_users_period, color: '#2DBE5A', ink: '#0b3a1f' },
          ]}
        />
        <div className="mini-stats" style={{ marginTop: 14, gridTemplateColumns: '1fr 1fr' }}>
          <div className="mini"><span>Nuevos vínculos</span><strong>{fmt(whatsapp.linked_period)}</strong></div>
          <div className="mini"><span>Descartados</span><strong>{fmt(whatsapp.discarded_period)}</strong></div>
        </div>
      </div>

      <div className="card reveal span-6 xl-span-6 md-span-12">
        <CardHead title="Movimientos por día" sub="Gastos e ingresos registrados" />
        <BarChart labels={labels} values={series.map((s) => s.transactions)} label="movimientos" />
      </div>

      <div className="card reveal span-3 md-span-6">
        <CardHead title="Cómo registran en WhatsApp" sub="Movimientos guardados" />
        <Meters
          total={waTotal || 1}
          items={[
            { label: 'Texto', value: whatsapp.text, color: '#2DBE5A', iconBg: '#E8F8EE', icon: <Icon name="text" size={14} /> },
            { label: 'Voz', value: whatsapp.audio, color: '#3B82F6', iconBg: '#E8F0FE', icon: <Icon name="mic" size={14} /> },
            { label: 'Ticket', value: whatsapp.image, color: '#F5A524', iconBg: '#FFF4DC', icon: <Icon name="camera" size={14} /> },
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
    </div>
  );
}
