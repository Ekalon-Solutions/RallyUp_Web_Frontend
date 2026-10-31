"use client"

import type { ReactNode } from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { cn } from "@/lib/utils"

// ─── Formatting ───────────────────────────────────────────────────────────────

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n || 0)
export const inrShort = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}k` : `₹${Math.round(n)}`
export const num = (n: number) => (n || 0).toLocaleString("en-IN")
export const pct = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(1)}%`

// ─── Month buckets ────────────────────────────────────────────────────────────

export const MONTHS_BACK = 12

/** Last N calendar months, oldest first: [{ key: "2026-03", label: "Mar" }] */
export function monthBuckets(n = MONTHS_BACK) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-IN", { month: "short" }),
    }
  })
}
export const monthKey = (iso?: string | null) => (iso ? String(iso).slice(0, 7) : "")

// ─── Shared chart styling ─────────────────────────────────────────────────────

const AXIS = { tick: { fill: "var(--ra-mid)", fontSize: 11 }, axisLine: false, tickLine: false } as const
const TOOLTIP = {
  contentStyle: { background: "var(--ra-bg)", border: "1px solid var(--ra-line)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "var(--ra-ink)", fontWeight: 600 },
  cursor: { fill: "var(--ra-line)" },
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

export interface Kpi {
  label: string
  value: string
  sub?: string
  /** Red treatment — the "needs attention" metric */
  alert?: boolean
}

export function KpiStrip({ kpis, loading }: { kpis: Kpi[]; loading?: boolean }) {
  return (
    <div className={cn("relative z-10 grid grid-cols-2 border-y border-[var(--ra-line)]", kpis.length > 2 ? "lg:grid-cols-4" : "lg:grid-cols-2")}>
      {kpis.map((k, i) => (
        <div key={k.label} className={cn("py-5 px-1 sm:px-5 first:pl-0 border-[var(--ra-line)]", i > 0 && "lg:border-l", i % 2 === 1 && "border-l")}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--ra-mid)]">{k.label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-32 animate-pulse rounded bg-[var(--ra-line)]" />
          ) : (
            <p className={cn("mt-1.5 text-2xl sm:text-[28px] font-black tracking-tight tabular-nums", k.alert ? "text-[var(--ra-accent)]" : "text-[var(--ra-ink)]")}>
              {k.value}
            </p>
          )}
          {k.sub && <p className={cn("mt-1 text-xs", k.alert ? "text-[var(--ra-accent)]" : "text-[var(--ra-mid)]")}>{k.sub}</p>}
        </div>
      ))}
    </div>
  )
}

// ─── Section frame (title + legend + body) ───────────────────────────────────

export function ChartSection({
  title, subtitle, legend, children, aside,
}: { title: string; subtitle?: string; legend?: { label: string; color: string }[]; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className={cn("grid gap-8", aside && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-black tracking-tight text-[var(--ra-ink)]">{title}</h3>
            {subtitle && <p className="text-xs text-[var(--ra-mid)] mt-0.5">{subtitle}</p>}
          </div>
          {legend && (
            <div className="flex flex-wrap gap-4 text-xs text-[var(--ra-mid)]">
              {legend.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {children}
      </div>
      {aside}
    </div>
  )
}

// ─── Side panel: labelled horizontal bars ─────────────────────────────────────

export interface BarItem { label: string; value: number; display: string; note?: string; alert?: boolean }

export function BarList({ title, meta, items, empty = "No data yet" }: { title: string; meta?: string; items: BarItem[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="relative z-10">
      <div className="flex items-baseline justify-between gap-2 border-b border-[var(--ra-line)] pb-2 mb-3">
        <h4 className="text-sm font-bold text-[var(--ra-ink)]">{title}</h4>
        {meta && <span className="text-[11px] text-[var(--ra-mid)]">{meta}</span>}
      </div>
      {items.length === 0 && <p className="text-xs text-[var(--ra-mid)]">{empty}</p>}
      <div className="space-y-3.5">
        {items.map((it) => (
          <div key={it.label}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold text-[var(--ra-ink)] truncate">{it.label}</span>
              <span className={cn("tabular-nums shrink-0", it.alert ? "text-[var(--ra-accent)]" : "text-[var(--ra-mid)]")}>{it.display}</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-[var(--ra-line)]">
              <div className="h-1 rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: it.alert ? "var(--ra-accent)" : "var(--ra-ink)" }} />
            </div>
            {it.note && <p className="mt-1 text-[11px] text-[var(--ra-mid)]">{it.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Charts ───────────────────────────────────────────────────────────────────

type Row = Record<string, string | number>
export interface Series { key: string; label: string; color: string }

/** Stacked monthly bars; first series sits at the bottom. Total labelled on top. */
export function StackedBars({ data, series, format = num }: { data: Row[]; series: Series[]; format?: (n: number) => string }) {
  const withTotal = data.map((d) => ({ ...d, __total: series.reduce((s, x) => s + (Number(d[x.key]) || 0), 0) }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={withTotal} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--ra-line)" />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis hide />
        <Tooltip {...TOOLTIP} formatter={(v: number, name) => [format(v), series.find((s) => s.key === name)?.label ?? name]} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} maxBarSize={44}>
            {i === series.length - 1 && (
              <LabelList dataKey="__total" position="top" formatter={(v: number) => (v ? format(v) : "")} style={{ fill: "var(--ra-mid)", fontSize: 10 }} />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TrendLines({ data, series, area }: { data: Row[]; series: Series[]; area?: boolean }) {
  // An array, not a Fragment: recharts only finds axes/grid among direct children.
  const common = [
    <CartesianGrid key="grid" vertical={false} stroke="var(--ra-line)" />,
    <XAxis key="x" dataKey="label" {...AXIS} />,
    <YAxis key="y" {...AXIS} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />,
    <Tooltip key="tip" {...TOOLTIP} cursor={{ stroke: "var(--ra-line)" }} formatter={(v: number, name) => [num(v), series.find((s) => s.key === name)?.label ?? name]} />,
  ]
  return (
    <ResponsiveContainer width="100%" height={260}>
      {area ? (
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          {common}
          {series.map((s, i) => (
            <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={i === 0 ? 0.18 : 0.08} dot={{ r: 2.5, fill: s.color }} />
          ))}
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          {common}
          {series.map((s, i) => (
            <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} strokeDasharray={i === 2 ? "4 3" : undefined} dot={{ r: 3, fill: "var(--ra-bg)", stroke: s.color, strokeWidth: 2 }} />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}

export function Donut({ items, centerLabel }: { items: { label: string; value: number; color: string }[]; centerLabel: string }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={total ? items : [{ label: "none", value: 1, color: "var(--ra-line)" }]} dataKey="value" innerRadius={52} outerRadius={72} stroke="none" startAngle={90} endAngle={-270}>
              {(total ? items : [{ color: "var(--ra-line)" }]).map((it, i) => <Cell key={i} fill={it.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black tabular-nums text-[var(--ra-ink)]">{num(total)}</span>
          <span className="text-[10px] uppercase tracking-wide text-[var(--ra-mid)]">{centerLabel}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 divide-y divide-[var(--ra-line)]">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 py-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: it.color }} />
            <span className="flex-1 truncate text-[var(--ra-ink)]">{it.label}</span>
            <span className="tabular-nums font-semibold text-[var(--ra-ink)]">{num(it.value)}</span>
            <span className="w-14 text-right tabular-nums text-xs text-[var(--ra-mid)]">{total ? pct((it.value / total) * 100) : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** 7 × 24 grid; grid[day][hour] where day 0 = Monday. */
export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat())
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {grid.map((row, d) => (
          <div key={d} className="flex items-center gap-[3px] mb-[3px]">
            <span className="w-9 shrink-0 text-[11px] text-[var(--ra-mid)]">{DAYS[d]}</span>
            {row.map((v, h) => (
              <div
                key={h}
                title={`${DAYS[d]} ${String(h).padStart(2, "0")}:00 — ${v} action${v === 1 ? "" : "s"}`}
                className="h-6 flex-1 rounded-[3px]"
                style={{ background: v ? "var(--ra-ink)" : "var(--ra-line)", opacity: v ? 0.15 + 0.85 * (v / max) : 1 }}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-[3px] pl-9 mt-1">
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="flex-1 text-center text-[10px] text-[var(--ra-mid)]">{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
