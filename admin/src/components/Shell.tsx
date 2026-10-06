import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Icon, MoniMark, type IconName } from './Icon';
import { Avatar } from './ui';
import { AnimatedNumber } from './AnimatedNumber';
import { pct } from '../lib/format';

export type PageId = 'overview' | 'users' | 'subscriptions' | 'activity';

const NAV: { id: PageId; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Resumen', icon: 'grid' },
  { id: 'users', label: 'Usuarios', icon: 'users' },
  { id: 'subscriptions', label: 'Suscripciones', icon: 'crown' },
  { id: 'activity', label: 'Actividad', icon: 'activity' },
];

type SidebarProps = {
  page: PageId;
  onNavigate: (p: PageId) => void;
  onLogout: () => void;
  premiumCount?: number;
  whatsappLinked?: number;
  totalUsers?: number;
};

export function Sidebar({ page, onNavigate, onLogout, premiumCount, whatsappLinked, totalUsers }: SidebarProps) {
  const ref = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.brand, .nav-label, .nav-item, .side-promo, .logout', {
        x: -18,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.05,
        clearProps: 'transform,opacity',
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    const active = ref.current?.querySelector<HTMLButtonElement>(`.nav-item[data-id="${page}"]`);
    if (!active || !pill.current) return;
    const to = { y: active.offsetTop, opacity: 1 };
    if (first.current) {
      gsap.set(pill.current, to);
      first.current = false;
    } else {
      gsap.to(pill.current, { ...to, duration: 0.55, ease: 'elastic.out(1, 0.75)' });
    }
  }, [page]);

  const waShare = totalUsers ? pct(whatsappLinked ?? 0, totalUsers) : 0;

  useLayoutEffect(() => {
    const bar = ref.current?.querySelector('.side-promo .bar i');
    if (!bar) return;
    const tween = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'power3.out', delay: 0.6 });
    return () => {
      tween.kill();
    };
  }, [waShare]);

  return (
    <aside className="sidebar" ref={ref}>
      <div className="brand">
        <span className="brand-mark">
          <MoniMark />
        </span>
        <div className="brand-text">
          <div className="brand-name">MONI</div>
          <div className="brand-tag">Panel de administración</div>
        </div>
      </div>

      <div className="nav-label">Menú</div>
      <nav className="nav">
        <span className="nav-pill" ref={pill} style={{ opacity: 0, top: 0 }} />
        {NAV.map((n) => (
          <button key={n.id} data-id={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => onNavigate(n.id)} title={n.label}>
            <Icon name={n.icon} size={19} />
            <span className="label">{n.label}</span>
            {n.id === 'subscriptions' && premiumCount ? <span className="count">{premiumCount}</span> : null}
          </button>
        ))}
      </nav>

      <div className="side-promo">
        <div className="glow" />
        <div className="wa-icon">
          <Icon name="chat" size={17} />
        </div>
        <span>Vinculados a WhatsApp</span>
        <strong>
          <AnimatedNumber value={whatsappLinked ?? 0} />
        </strong>
        <span>{waShare.toFixed(0)}% de los usuarios</span>
        <div className="bar">
          <i style={{ width: `${Math.max(3, waShare)}%` }} />
        </div>
      </div>

      <button className="nav-item logout" onClick={onLogout} title="Cerrar sesión">
        <Icon name="logout" size={19} />
        <span className="label">Cerrar sesión</span>
      </button>
    </aside>
  );
}

type TopbarProps = {
  search: string;
  onSearch: (q: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  email: string;
};

export function Topbar({ search, onSearch, onRefresh, refreshing, email }: TopbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const name = email.split('@')[0] || 'Admin';

  return (
    <header className="topbar reveal">
      <label className="search">
        <Icon name="search" size={17} />
        <input ref={inputRef} placeholder="Buscar usuarios por nombre o correo" value={search} onChange={(e) => onSearch(e.target.value)} />
        <span className="kbd">Ctrl K</span>
      </label>
      <div className="top-actions">
        <button className={`icon-btn ${refreshing ? 'spinning' : ''}`} onClick={onRefresh} title="Actualizar" aria-label="Actualizar">
          <Icon name="refresh" size={18} />
        </button>
        <div className="me">
          <Avatar name={name} seed={email} />
          <div className="me-text">
            <div className="me-name">{name}</div>
            <div className="me-mail">{email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
