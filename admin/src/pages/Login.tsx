import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { Icon, MoniMark } from '../components/Icon';
import { reducedMotion } from '../lib/motion';

type Props = { error?: string | null };

export function Login({ error: externalError }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.login-art', { scale: 0.96, opacity: 0, duration: 1 })
        .from('.login-art h1, .login-art p', { y: 30, opacity: 0, duration: 0.9, stagger: 0.12 }, '-=0.5')
        .from('.float-card', { y: 40, opacity: 0, scale: 0.9, duration: 0.9, stagger: 0.12 }, '-=0.7')
        .from('.login-form > *', { y: 18, opacity: 0, duration: 0.7, stagger: 0.06 }, '-=0.9');
      if (!reducedMotion) {
        gsap.utils.toArray<HTMLElement>('.float-card').forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? 12 : -12, duration: 3 + i * 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 });
        });
      }
    }, ref);
    return () => ctx.revert();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : err.message);
  };

  const shownError = error ?? externalError;

  return (
    <div className="login" ref={ref}>
      <section className="login-art">
        <div className="brand" style={{ padding: 0, position: 'relative' }}>
          <span className="brand-mark"><MoniMark /></span>
          <div className="brand-name" style={{ color: '#fff' }}>MONI</div>
        </div>

        <div className="float-card" style={{ top: '18%', right: '10%' }}>
          <span style={{ opacity: 0.7 }}>Usuarios</span>
          <strong>Cuentas creadas</strong>
          <span style={{ color: 'var(--mint)', fontWeight: 700 }}>▲ Crecimiento diario</span>
        </div>
        <div className="float-card" style={{ top: '40%', right: '30%' }}>
          <span style={{ opacity: 0.7 }}>Premium</span>
          <strong>Suscripciones</strong>
        </div>
        <div className="float-card" style={{ top: '30%', left: '9%', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.14)' }}>
            <Icon name="chat" size={16} />
          </span>
          <div>
            <span style={{ opacity: 0.7 }}>WhatsApp</span>
            <strong style={{ fontSize: 18 }}>Bot conectado</strong>
          </div>
        </div>

        <h1>Todo MONI, en un solo vistazo.</h1>
        <p>Cuentas creadas, suscripciones, uso del bot de WhatsApp y actividad diaria, en tiempo real.</p>
      </section>

      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <span className="brand-mark" style={{ width: 48, height: 48, borderRadius: 16 }}><MoniMark size={24} /></span>
          <h2>Bienvenido de vuelta</h2>
          <p className="form-note" style={{ marginTop: -6 }}>Entra con tu cuenta de MONI. Solo las cuentas de administrador pueden ver el panel.</p>

          {!supabaseConfigured && (
            <div className="form-error">
              Falta configurar <b>VITE_SUPABASE_URL</b> y <b>VITE_SUPABASE_ANON_KEY</b> en <code>admin/.env</code>.
            </div>
          )}

          <label className="field">
            Correo
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required />
          </label>
          <label className="field">
            Contraseña
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>

          {shownError && <div className="form-error">{shownError}</div>}

          <button className="btn primary" type="submit" disabled={loading || !supabaseConfigured}>
            {loading ? 'Entrando…' : 'Entrar al panel'}
            {!loading && <Icon name="arrowUpRight" size={16} />}
          </button>
        </form>
      </section>
    </div>
  );
}
