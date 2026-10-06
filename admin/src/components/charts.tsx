import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { fmt, shortDay } from '../lib/format';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    // clientWidth ignores the CSS scale of the card's entrance animation.
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(v: number): number {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1.2 ? 1.2 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 6 ? 6 : n <= 8 ? 8 : 10;
  return step * pow;
}

/** Catmull-Rom → cubic Bézier, control points clamped so the curve never dips past the baseline. */
function smoothPath(pts: [number, number][], minY: number, maxY: number): string {
  if (!pts.length) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  const clamp = (y: number) => Math.min(maxY, Math.max(minY, y));
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] ?? pts[i];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2] ?? pts[i + 1];
    const t = 0.17;
    d += ` C${x1 + (x2 - x0) * t},${clamp(y1 + (y2 - y0) * t)} ${x2 - (x3 - x1) * t},${clamp(y2 - (y3 - y1) * t)} ${x2},${y2}`;
  }
  return d;
}

function Tooltip({ x, y, show, children }: { x: number; y: number; show: boolean; children: ReactNode }) {
  return (
    <div className="tip" style={{ left: x, top: y, opacity: show ? 1 : 0 }}>
      {children}
    </div>
  );
}

export type Series = { key: string; label: string; color: string; values: number[]; dashed?: boolean };

export function AreaChart({ labels, series, height = 260 }: { labels: string[]; series: Series[]; height?: number }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 12, right: 8, bottom: 28, left: 40 };
  const w = Math.max(width, 200);
  const innerW = w - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length;
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const baseline = pad.top + innerH;

  const paths = useMemo(
    () =>
      series.map((s) => {
        const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
        const line = smoothPath(pts, pad.top, baseline);
        const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${baseline} L${pts[0][0]},${baseline} Z` : '';
        return { ...s, line, area };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, w, height, max],
  );

  const dataKey = series.map((s) => s.values.join(',')).join('|');

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !width) return;
    const ctx = gsap.context(() => {
      svg.querySelectorAll<SVGPathElement>('.line').forEach((p, i) => {
        const len = p.getTotalLength();
        gsap.fromTo(
          p,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', delay: 0.15 + i * 0.15, onComplete: () => {
            p.style.strokeDasharray = p.dataset.dash ?? '';
          } },
        );
      });
      gsap.fromTo('.area', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 0.5, stagger: 0.12 });
    }, svg);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, width > 0]);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 70))));

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))));
  };

  return (
    <div className="chart" ref={wrapRef}>
      {width > 0 && (
        <svg ref={svgRef} viewBox={`0 0 ${w} ${height}`} height={height}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <g className="axis">
            {ticks.map((t) => (
              <g key={t}>
                <line className="grid-line" x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} />
                <text x={pad.left - 10} y={y(t) + 4} textAnchor="end">
                  {t >= 1000 ? `${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : fmt(t)}
                </text>
              </g>
            ))}
            {labels.map((l, i) =>
              i % labelEvery === 0 || i === n - 1 ? (
                <text key={l} x={x(i)} y={height - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
                  {shortDay(l)}
                </text>
              ) : null,
            )}
          </g>
          {paths.map((p) => (
            <path key={`a-${p.key}`} className="area" d={p.area} fill={p.dashed ? 'none' : `url(#fill-${p.key})`} />
          ))}
          {paths.map((p) => (
            <path
              key={`l-${p.key}`}
              className="line"
              d={p.line}
              fill="none"
              stroke={p.color}
              strokeWidth={p.dashed ? 2 : 3}
              strokeLinecap="round"
              data-dash={p.dashed ? '5 6' : ''}
            />
          ))}
          {hover != null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={baseline} stroke="rgba(17,17,19,.18)" strokeDasharray="4 4" />
              {series.map((s) => (
                <circle key={s.key} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={5.5} fill="#fff" stroke={s.color} strokeWidth={3} />
              ))}
            </g>
          )}
          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hover != null && (
        <Tooltip x={x(hover)} y={y(Math.max(...series.map((s) => s.values[hover] ?? 0)))} show>
          <b>{shortDay(labels[hover])}</b>
          {series.map((s) => (
            <div className="row" key={s.key}>
              <i style={{ background: s.color }} />
              {fmt(s.values[hover] ?? 0)} {s.label.toLowerCase()}
            </div>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

export function BarChart({
  labels,
  values,
  height = 220,
  label,
  color = 'var(--green)',
  highlight = 'var(--forest)',
}: {
  labels: string[];
  values: number[];
  height?: number;
  label: string;
  color?: string;
  highlight?: string;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 10, bottom: 26 };
  const w = Math.max(width, 160);
  const innerH = height - pad.top - pad.bottom;
  const n = values.length;
  const max = niceMax(Math.max(1, ...values));
  const slot = w / Math.max(n, 1);
  const barW = Math.max(3, Math.min(28, slot * 0.62));
  const peak = values.indexOf(Math.max(...values));
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 64))));

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !width) return;
    const ctx = gsap.context(() => {
      // Bars live in a flipped group (y=0 is the baseline), so growing `height` alone keeps them anchored.
      svg.querySelectorAll<SVGRectElement>('rect.bar').forEach((bar, i) => {
        gsap.fromTo(
          bar,
          { attr: { height: 0 } },
          { attr: { height: Number(bar.getAttribute('height')) }, duration: 0.9, ease: 'power3.out', delay: 0.2 + i * 0.022 },
        );
      });
    }, svg);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.join(','), width > 0]);

  return (
    <div className="chart" ref={wrapRef}>
      {width > 0 && (
        <svg ref={svgRef} viewBox={`0 0 ${w} ${height}`} height={height} onMouseLeave={() => setHover(null)}>
          <g className="axis">
            {[0.5, 1].map((t) => (
              <line key={t} className="grid-line" x1={0} x2={w} y1={pad.top + innerH - t * innerH} y2={pad.top + innerH - t * innerH} />
            ))}
          </g>
          <g transform={`translate(0 ${pad.top + innerH}) scale(1 -1)`}>
          {values.map((v, i) => {
            const h = Math.max(4, (v / max) * innerH);
            const cx = slot * i + slot / 2;
            return (
              <g key={labels[i] ?? i} onMouseEnter={() => setHover(i)}>
                <rect x={slot * i} y={0} width={slot} height={innerH} fill="transparent" />
                <rect
                  className="bar"
                  x={cx - barW / 2}
                  y={0}
                  width={barW}
                  height={h}
                  rx={Math.min(8, barW / 2)}
                  fill={i === peak || i === hover ? highlight : color}
                  opacity={hover == null || hover === i ? 1 : 0.45}
                  style={{ transition: 'opacity .2s, fill .2s' }}
                />
              </g>
            );
          })}
          </g>
          <g className="axis">
            {labels.map((l, i) =>
              i % labelEvery === 0 ? (
                <text key={l} x={slot * i + slot / 2} y={height - 6} textAnchor="middle">
                  {shortDay(l)}
                </text>
              ) : null,
            )}
          </g>
        </svg>
      )}
      {hover != null && (
        <Tooltip x={slot * hover + slot / 2} y={pad.top + innerH - Math.max(4, (values[hover] / max) * innerH)} show>
          <b>{shortDay(labels[hover])}</b>
          <div className="row">
            {fmt(values[hover])} {label}
          </div>
        </Tooltip>
      )}
    </div>
  );
}

export function Sparkline({ values, color = 'var(--mint)' }: { values: number[]; color?: string }) {
  const ref = useRef<SVGPathElement>(null);
  const w = 92;
  const h = 36;
  const max = Math.max(1, ...values);
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)] as [number, number]);
  const d = smoothPath(pts, 0, h);

  useLayoutEffect(() => {
    const p = ref.current;
    if (!p) return;
    const len = p.getTotalLength();
    const tween = gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', delay: 0.4 });
    return () => {
      tween.kill();
    };
  }, [d]);

  return (
    <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path ref={ref} d={d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}

export type Slice = { label: string; value: number; color: string };

export function Donut({ slices, size = 156, thickness = 18, center }: { slices: Slice[]; size?: number; thickness?: number; center: ReactNode }) {
  const ref = useRef<SVGSVGElement>(null);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const gap = slices.filter((s) => s.value > 0).length > 1 ? 6 : 0;
  let acc = 0;
  const arcs = slices.map((s) => {
    const len = Math.max(0, (s.value / total) * c - gap);
    const arc = { ...s, len, offset: -acc };
    acc += (s.value / total) * c;
    return arc;
  });

  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const ctx = gsap.context(() => {
      svg.querySelectorAll<SVGCircleElement>('.arc').forEach((el, i) => {
        const len = Number(el.dataset.len);
        gsap.fromTo(
          el,
          { strokeDasharray: `0 ${c}` },
          { strokeDasharray: `${len} ${c}`, duration: 1.3, ease: 'power3.out', delay: 0.25 + i * 0.18 },
        );
      });
      gsap.fromTo(svg, { rotate: -90 }, { rotate: 0, duration: 1.6, ease: 'power3.out', transformOrigin: '50% 50%' });
    }, svg);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slices.map((s) => s.value).join(',')]);

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg)" strokeWidth={thickness} />
          {arcs.map((a) => (
            <circle
              key={a.label}
              className="arc"
              data-len={a.len}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={thickness}
              strokeLinecap={a.len > thickness ? 'round' : 'butt'}
              strokeDasharray={`${a.len} ${c}`}
              strokeDashoffset={a.offset - gap / 2}
            />
          ))}
        </g>
      </svg>
      <div className="donut-center">
        <div>{center}</div>
      </div>
    </div>
  );
}

export type Meter = { label: string; value: number; color: string; icon?: ReactNode; iconBg?: string; hint?: string };

export function Meters({ items, total }: { items: Meter[]; total?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const max = total ?? Math.max(1, ...items.map((i) => i.value));

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.meter-fill', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.out', stagger: 0.1, delay: 0.3 });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.value).join(',')]);

  return (
    <div className="meters" ref={ref}>
      {items.map((m) => (
        <div key={m.label}>
          <div className="meter-top">
            <span>
              {m.icon && (
                <span className="meter-icon" style={{ background: m.iconBg, color: m.color }}>
                  {m.icon}
                </span>
              )}
              {m.label}
            </span>
            <b>
              {fmt(m.value)}
              {m.hint && <small>{m.hint}</small>}
            </b>
          </div>
          <div className="meter-track">
            <div className="meter-fill" style={{ width: `${Math.max(2, (m.value / max) * 100)}%`, background: m.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
