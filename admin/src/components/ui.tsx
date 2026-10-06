import { useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { AnimatedNumber } from './AnimatedNumber';
import { Sparkline } from './charts';
import { Icon } from './Icon';
import { fmtPct, initials } from '../lib/format';

export function Delta({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value == null) return <span className="delta">Nuevo</span>;
  const cls = value > 0.05 ? '' : value < -0.05 ? 'down' : 'flat';
  return (
    <span className={`delta ${cls}`}>
      {cls !== 'flat' && <Icon name={value > 0 ? 'arrowUp' : 'arrowDown'} size={12} stroke={2.6} />}
      {fmtPct(Math.abs(value))}
      {suffix}
    </span>
  );
}

type KpiProps = {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: number | null;
  foot?: ReactNode;
  hero?: boolean;
  spark?: number[];
  onClick?: () => void;
  delay?: number;
};

export function KpiCard({ label, value, format, delta, foot, hero, spark, onClick, delay = 0 }: KpiProps) {
  return (
    <div className={`card lift kpi reveal ${hero ? 'hero' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      {hero && <div className="orb" />}
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-arrow">
          <Icon name="arrowUpRight" size={16} />
        </span>
      </div>
      <div className="kpi-value">
        <AnimatedNumber value={value} format={format} delay={delay} />
      </div>
      <div className="kpi-foot">
        {delta !== undefined && <Delta value={delta} />}
        <span>{foot}</span>
      </div>
      {spark && spark.length > 1 && <Sparkline values={spark} color={hero ? 'var(--mint)' : 'var(--green)'} />}
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const btn = wrap.current?.querySelector<HTMLButtonElement>('button.on');
    if (!btn || !thumb.current) return;
    const to = { x: btn.offsetLeft - 4, width: btn.offsetWidth };
    if (first.current) {
      gsap.set(thumb.current, to);
      first.current = false;
    } else {
      gsap.to(thumb.current, { ...to, duration: 0.5, ease: 'power3.out' });
    }
  }, [value]);

  return (
    <div className="segmented" ref={wrap}>
      <span className="thumb" ref={thumb} style={{ left: 4 }} />
      {options.map((o) => (
        <button key={String(o.value)} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const AVATAR_COLORS = [
  ['#E8F8EE', '#176B35'],
  ['#E8F0FE', '#1D4FD7'],
  ['#FFF4DC', '#8A5A00'],
  ['#F3E8FF', '#6D28D9'],
  ['#FDECEC', '#B4232A'],
  ['#E0F7F4', '#0F766E'],
];

export function Avatar({ name, seed }: { name: string; seed: string }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return (
    <span className="avatar" style={{ background: bg, color: fg }}>
      {initials(name)}
    </span>
  );
}

export function Badge({ tone, children, dot }: { tone: 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'dark'; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`badge ${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function Pager({ total, limit, offset, onChange }: { total: number; limit: number; offset: number; onChange: (offset: number) => void }) {
  const from = total ? offset + 1 : 0;
  const to = Math.min(total, offset + limit);
  return (
    <div className="pager">
      <span>
        {from}–{to} de {total}
      </span>
      <div className="pager-btns">
        <button className="icon-btn" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))} aria-label="Anterior">
          <Icon name="chevronLeft" />
        </button>
        <button className="icon-btn" disabled={to >= total} onClick={() => onChange(offset + limit)} aria-label="Siguiente">
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%', r }: { h?: number; w?: number | string; r?: number }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

export function CardHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="card-head">
      <div>
        <h3 className="card-title">{title}</h3>
        {sub && <p className="card-sub">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-card reveal">
      <Icon name="alert" size={20} />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button className="btn ghost" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
