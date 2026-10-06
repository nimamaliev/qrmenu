"use client";

import { useEffect, useMemo, useState } from "react";
import CountUp from "@/components/react-bits/CountUp/CountUp";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Status = "free" | "ordered" | "waiting" | "bill";
type MenuKey = keyof Dictionary["menu"];

const PRICES: Record<MenuKey, number> = {
  margherita: 11.5,
  diavola: 13,
  quattro: 14,
  funghi: 12.5,
  lemonade: 4.5,
  water: 3,
  espresso: 2.8,
  tiramisu: 7,
};

/** Illustrative data only; the real numbers live in the product. */
const TABLES: { id: number; seats: number; status: Status; minutes?: number; waiter?: string; items?: [MenuKey, number][] }[] = [
  { id: 1, seats: 2, status: "free" },
  { id: 2, seats: 4, status: "ordered", minutes: 6, waiter: "Anna", items: [["margherita", 2], ["lemonade", 2]] },
  { id: 3, seats: 4, status: "waiting", minutes: 21, waiter: "Marco", items: [["diavola", 1], ["quattro", 1], ["water", 2]] },
  { id: 4, seats: 2, status: "bill", minutes: 48, waiter: "Anna", items: [["funghi", 1], ["tiramisu", 1], ["espresso", 2]] },
  { id: 5, seats: 6, status: "free" },
  { id: 6, seats: 2, status: "ordered", minutes: 3, waiter: "Lena", items: [["margherita", 1], ["water", 1]] },
  { id: 7, seats: 4, status: "ordered", minutes: 12, waiter: "Marco", items: [["diavola", 2], ["funghi", 1], ["lemonade", 3]] },
  { id: 8, seats: 4, status: "free" },
  { id: 9, seats: 6, status: "waiting", minutes: 18, waiter: "Lena", items: [["quattro", 2], ["margherita", 2], ["water", 4]] },
  { id: 10, seats: 4, status: "bill", minutes: 55, waiter: "Marco", items: [["diavola", 2], ["tiramisu", 2], ["espresso", 2]] },
  { id: 11, seats: 2, status: "ordered", minutes: 9, waiter: "Anna", items: [["funghi", 1], ["lemonade", 1]] },
  { id: 12, seats: 2, status: "free" },
];

const TOP_DISHES: [MenuKey, number][] = [
  ["margherita", 412],
  ["diavola", 356],
  ["quattro", 281],
  ["funghi", 235],
];

const HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const ORDERS_PER_HOUR = [6, 14, 22, 18, 9, 7, 10, 19, 31, 36, 28, 17, 8];

const STATUS_STYLE: Record<Status, { dot: string; ring: string; text: string }> = {
  free: { dot: "bg-neutral-500", ring: "border-line", text: "text-muted" },
  ordered: { dot: "bg-sky-400", ring: "border-sky-400/40", text: "text-sky-700" },
  waiting: { dot: "bg-amber-400", ring: "border-amber-400/50", text: "text-amber-700" },
  bill: { dot: "bg-violet-400", ring: "border-violet-400/50", text: "text-violet-700" },
};

function StatusIcon({ status }: { status: Status }) {
  const common = { viewBox: "0 0 16 16", className: "h-3.5 w-3.5", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": true } as const;
  if (status === "free") return <svg {...common}><circle cx="8" cy="8" r="5.5" /></svg>;
  if (status === "ordered") return <svg {...common}><path d="M3 8.5l3 3 7-7" /></svg>;
  if (status === "waiting") return <svg {...common}><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.2l2 1.3" /></svg>;
  return <svg {...common}><rect x="3.5" y="2.5" width="9" height="11" rx="1" /><path d="M6 6h4M6 9h4" /></svg>;
}

/** Ticks on its own so the rest of the dashboard doesn't re-render every second. */
function Elapsed({ minutes }: { minutes: number }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [minutes]);
  const total = minutes * 60 + seconds;
  return (
    <span className="tabular-nums">
      {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}
    </span>
  );
}

export default function OwnerDashboard({ lang, owners, menu }: { lang: Locale; owners: Dictionary["owners"]; menu: Dictionary["menu"] }) {
  const [selected, setSelected] = useState(3);
  const [hoverHour, setHoverHour] = useState<number | null>(null);

  const fmt = useMemo(() => {
    const money = new Intl.NumberFormat(lang, { style: "currency", currency: "EUR" });
    const moneyRound = new Intl.NumberFormat(lang, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
    const num = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
    return { money: (n: number) => money.format(n), moneyRound: (n: number) => moneyRound.format(n), num: (n: number) => num.format(n) };
  }, [lang]);

  const table = TABLES.find((t) => t.id === selected)!;
  const bill = (table.items ?? []).reduce((sum, [key, qty]) => sum + PRICES[key] * qty, 0);
  const maxDish = TOP_DISHES[0][1];
  const maxHour = Math.max(...ORDERS_PER_HOUR);
  const peakIndex = ORDERS_PER_HOUR.indexOf(maxHour);
  const shownHour = hoverHour ?? peakIndex;

  const kpis = [
    { label: owners.kpis.revenue, value: 2846, format: fmt.moneyRound },
    { label: owners.kpis.orders, value: 132, format: fmt.num },
    { label: owners.kpis.avgWait, value: 11, format: fmt.num },
    { label: owners.kpis.views3d, value: 1284, format: fmt.num },
  ];

  return (
    <div className="reveal rounded-3xl border border-line bg-surface p-3 shadow-[0_40px_120px_-40px_rgba(255,106,61,0.25)] sm:p-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          {owners.live} · Demo Restaurant
        </p>
        <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">{owners.sampleData}</span>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-surface-2 p-4">
            <p className="text-xs text-muted sm:text-sm">{k.label}</p>
            <p className="mt-1 text-2xl font-medium sm:text-3xl">
              <CountUp to={k.value} duration={1.6} format={k.format} />
            </p>
          </div>
        ))}
      </div>

      {/* Floor plan + selected table */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{owners.floor.title}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {(Object.keys(STATUS_STYLE) as Status[]).map((st) => (
                <li key={st} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[st].dot}`} />
                  {owners.floor.statuses[st]}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {TABLES.map((t) => {
              const st = STATUS_STYLE[t.status];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  aria-pressed={t.id === selected}
                  className={`flex min-h-24 flex-col justify-between rounded-2xl border bg-bg/40 p-3 text-left transition hover:bg-bg/80 aria-pressed:border-accent aria-pressed:bg-accent/10 ${st.ring}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-display tracking-display text-lg font-medium">{t.id}</span>
                    <span className="text-[11px] text-muted">
                      {t.seats} {owners.floor.seats}
                    </span>
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${st.text}`}>
                    <StatusIcon status={t.status} />
                    <span className="truncate">{owners.floor.statuses[t.status]}</span>
                  </span>
                  {t.minutes !== undefined && <span className="text-[11px] text-muted tabular-nums">{t.minutes} min</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4" aria-live="polite">
          <p className="flex items-center justify-between">
            <span className="font-display tracking-display text-xl font-medium">
              {owners.floor.table} {table.id}
            </span>
            <span className={`flex items-center gap-1.5 text-sm ${STATUS_STYLE[table.status].text}`}>
              <StatusIcon status={table.status} />
              {owners.floor.statuses[table.status]}
            </span>
          </p>
          {table.items ? (
            <>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-bg/40 p-3">
                  <dt className="text-xs text-muted">{owners.panel.waiting}</dt>
                  <dd className="mt-1 text-lg font-medium">
                    <Elapsed key={table.id} minutes={table.minutes ?? 0} />
                  </dd>
                </div>
                <div className="rounded-xl bg-bg/40 p-3">
                  <dt className="text-xs text-muted">{owners.panel.waiter}</dt>
                  <dd className="mt-1 text-lg font-medium">{table.waiter}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted uppercase tracking-wider">{owners.panel.order}</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {table.items.map(([key, qty]) => (
                  <li key={key} className="flex justify-between gap-3">
                    <span>
                      {qty}× {menu[key]}
                    </span>
                    <span className="text-muted tabular-nums">{fmt.money(PRICES[key] * qty)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex justify-between border-t border-line pt-3 font-medium">
                {owners.panel.bill}
                <span className="tabular-nums">{fmt.money(bill)}</span>
              </p>
            </>
          ) : (
            <p className="mt-10 text-center text-muted">{owners.panel.empty}</p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <figure className="rounded-2xl bg-surface-2 p-4">
          <figcaption>
            <p className="font-medium">{owners.charts.topDishes}</p>
            <p className="text-xs text-muted">{owners.charts.topDishesSub}</p>
          </figcaption>
          <ul className="mt-4 space-y-3" aria-hidden="true">
            {TOP_DISHES.map(([key, views]) => (
              <li key={key} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm">
                <span className="truncate text-muted">{menu[key]}</span>
                <span className="flex items-center gap-2">
                  <span className="h-4 rounded-r-[4px] bg-accent" style={{ width: `${(views / maxDish) * 78}%` }} />
                  <span className="text-xs tabular-nums">{fmt.num(views)}</span>
                </span>
              </li>
            ))}
          </ul>
          <table className="sr-only">
            <tbody>
              {TOP_DISHES.map(([key, views]) => (
                <tr key={key}>
                  <th scope="row">{menu[key]}</th>
                  <td>{views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>

        <figure className="rounded-2xl bg-surface-2 p-4">
          <figcaption className="flex items-start justify-between gap-3">
            <span>
              <span className="block font-medium">{owners.charts.peakHours}</span>
              <span className="block text-xs text-muted">{owners.charts.peakHoursSub}</span>
            </span>
            <span className="text-right text-xs text-muted" aria-hidden="true">
              {hoverHour === null && <span className="mr-1 text-accent">{owners.charts.peak}</span>}
              <span className="text-text tabular-nums">
                {HOURS[shownHour]}:00 · {ORDERS_PER_HOUR[shownHour]} {owners.charts.orders}
              </span>
            </span>
          </figcaption>
          <div className="mt-4 flex h-28 items-end gap-[2px]" aria-hidden="true" onMouseLeave={() => setHoverHour(null)}>
            {ORDERS_PER_HOUR.map((v, i) => (
              <span key={i} className="flex h-full flex-1 items-end" onMouseEnter={() => setHoverHour(i)}>
                <span
                  className={`w-full max-w-6 rounded-t-[4px] transition-colors ${i === shownHour ? "bg-accent" : "bg-accent/45"}`}
                  style={{ height: `${(v / maxHour) * 100}%` }}
                />
              </span>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted tabular-nums" aria-hidden="true">
            <span>{HOURS[0]}:00</span>
            <span>{HOURS[HOURS.length - 1]}:00</span>
          </div>
          <table className="sr-only">
            <tbody>
              {HOURS.map((h, i) => (
                <tr key={h}>
                  <th scope="row">{h}:00</th>
                  <td>{ORDERS_PER_HOUR[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </div>
    </div>
  );
}
