import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { UserRow } from '../lib/types';
import { fmt, fmtDate, platformLabel, productLabel, timeAgo } from '../lib/format';
import { Avatar, Badge, Skeleton } from './ui';
import { Icon } from './Icon';

export function UsersTable({ rows, loading, compact }: { rows: UserRow[]; loading: boolean; compact?: boolean }) {
  const body = useRef<HTMLTableSectionElement>(null);

  useLayoutEffect(() => {
    if (!body.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.from('tr', { opacity: 0, x: -12, duration: 0.5, ease: 'power2.out', stagger: 0.035, clearProps: 'all' });
    }, body);
    return () => ctx.revert();
  }, [rows, loading]);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Plan</th>
            <th>WhatsApp</th>
            <th>Movimientos</th>
            <th>Última actividad</th>
            {!compact && <th>Registro</th>}
          </tr>
        </thead>
        <tbody ref={body}>
          {loading
            ? Array.from({ length: compact ? 5 : 8 }, (_, i) => (
                <tr key={i}>
                  <td colSpan={compact ? 5 : 6}>
                    <Skeleton h={28} />
                  </td>
                </tr>
              ))
            : rows.map((u) => {
                const inactive = !u.last_tx_at || Date.now() - Date.parse(u.last_tx_at) > 30 * 86_400_000;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="person">
                        <Avatar name={u.full_name || u.email || '?'} seed={u.id} />
                        <div>
                          <div className="person-name">{u.full_name || 'Sin nombre'}</div>
                          <div className="person-mail">{u.email ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.premium ? (
                        <Badge tone="dark">
                          <Icon name="crown" size={12} stroke={2.4} />
                          Premium{u.product_id ? ` · ${productLabel(u.product_id)}` : ''}
                          {u.platform ? ` · ${platformLabel(u.platform)}` : ''}
                        </Badge>
                      ) : (
                        <Badge tone="gray">Gratis</Badge>
                      )}
                    </td>
                    <td>
                      {u.whatsapp_linked_at ? (
                        <Badge tone="green" dot>
                          Vinculado
                        </Badge>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="num">{fmt(u.tx_count)}</td>
                    <td>
                      <span className={inactive ? 'muted' : ''}>{timeAgo(u.last_tx_at)}</span>
                    </td>
                    {!compact && <td className="muted">{fmtDate(u.created_at)}</td>}
                  </tr>
                );
              })}
        </tbody>
      </table>
      {!loading && !rows.length && <div className="empty">No hay usuarios que coincidan.</div>}
    </div>
  );
}
