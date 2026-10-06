import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from './lib/supabase';
import { checkIsAdmin, fetchDashboard } from './lib/api';
import { useReveal } from './lib/motion';
import type { Dashboard } from './lib/types';
import { fmtDate } from './lib/format';
import { Sidebar, Topbar, type PageId } from './components/Shell';
import { ErrorCard, Segmented } from './components/ui';
import { Login } from './pages/Login';
import { Overview, OverviewSkeleton } from './pages/Overview';
import { Users } from './pages/Users';
import { Subscriptions } from './pages/Subscriptions';
import { Activity } from './pages/Activity';

type Auth = { status: 'loading' } | { status: 'out'; error?: string } | { status: 'in'; email: string };

const PAGES: Record<PageId, { title: string; sub: (days: number) => string }> = {
  overview: { title: 'Resumen', sub: (d) => `Así va MONI en los últimos ${d} días` },
  users: { title: 'Usuarios', sub: () => 'Todas las cuentas creadas en la app' },
  subscriptions: { title: 'Suscripciones', sub: () => 'Premium vendido por App Store y Google Play' },
  activity: { title: 'Actividad', sub: () => 'Uso diario de la app y del bot de WhatsApp' },
};

const RANGES = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
];

function pageFromHash(): PageId {
  const h = window.location.hash.replace('#/', '') as PageId;
  return h in PAGES ? h : 'overview';
}

export default function App() {
  const [auth, setAuth] = useState<Auth>({ status: 'loading' });

  const verify = useCallback(async (email: string | undefined) => {
    try {
      if (await checkIsAdmin()) {
        setAuth({ status: 'in', email: email ?? 'admin@moni.app' });
      } else {
        await supabase.auth.signOut();
        setAuth({ status: 'out', error: 'Esta cuenta no es administradora. Pide que la agreguen a admin_users.' });
      }
    } catch (e) {
      setAuth({ status: 'out', error: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) verify(data.session.user.email);
      else setAuth({ status: 'out' });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) verify(session.user.email);
      if (event === 'SIGNED_OUT') setAuth((a) => (a.status === 'out' ? a : { status: 'out' }));
    });
    return () => sub.subscription.unsubscribe();
  }, [verify]);

  if (auth.status === 'loading') return null;

  if (auth.status === 'out') return <Login error={auth.error} />;

  return <Panel email={auth.email} onLogout={() => supabase.auth.signOut()} />;
}

function Panel({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (p: PageId) => {
    window.location.hash = `/${p}`;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let alive = true;
    setRefreshing(true);
    setError(null);
    fetchDashboard(days)
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setRefreshing(false));
    return () => {
      alive = false;
    };
  }, [days, refreshKey]);

  const onSearch = (q: string) => {
    setSearch(q);
    if (q && page !== 'users') navigate('users');
  };

  const meta = PAGES[page];

  return (
    <div className="shell">
      <Sidebar
        page={page}
        onNavigate={navigate}
        onLogout={onLogout}
        premiumCount={data?.users.premium}
        whatsappLinked={data?.users.whatsapp_linked}
        totalUsers={data?.users.total}
      />
      <main className="main">
        <Topbar search={search} onSearch={onSearch} onRefresh={() => setRefreshKey((k) => k + 1)} refreshing={refreshing} email={email} />

        <PageView key={`${page}-${data ? 'ready' : 'loading'}`}>
          <div className="page-head reveal">
            <div>
              <h1 className="page-title">{meta.title}</h1>
              <p className="page-sub">
                {meta.sub(days)}
                {data && ` · actualizado ${fmtDate(data.generated_at)}`}
              </p>
            </div>
            {page !== 'users' && <Segmented options={RANGES} value={days} onChange={setDays} />}
          </div>

          {error && <ErrorCard message={error} onRetry={() => setRefreshKey((k) => k + 1)} />}

          {!data ? (
            !error && <OverviewSkeleton />
          ) : page === 'overview' ? (
            <Overview data={data} onNavigate={navigate} refreshKey={refreshKey} />
          ) : page === 'users' ? (
            <Users data={data} search={search} refreshKey={refreshKey} />
          ) : page === 'subscriptions' ? (
            <Subscriptions data={data} refreshKey={refreshKey} />
          ) : (
            <Activity data={data} />
          )}
        </PageView>
      </main>
    </div>
  );
}

function PageView({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {children}
    </div>
  );
}
