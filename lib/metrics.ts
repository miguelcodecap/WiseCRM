import { daysBetween, daysSince, isOverdue } from './format';
import { OPEN_STAGES, STAGES, type Client, type Stage, type Task } from './types';

/** Probability that a deal in each stage closes as won. Used for the weighted forecast. */
export const STAGE_PROBABILITY: Record<Stage, number> = {
  Lead: 0.1,
  Proposal: 0.3,
  Negotiation: 0.6,
  Won: 1,
  Lost: 0,
};

export const STAGE_COLOR: Record<Stage, string> = {
  Lead: '#4f8df5',
  Proposal: '#8b5cf6',
  Negotiation: '#f2a516',
  Won: '#1fb57f',
  Lost: '#e5534b',
};

/** Open deals with no activity for this many days are flagged as "going cold". */
export const STALE_DAYS = 7;

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 } as const;

const sum = (list: Client[]) => list.reduce((a, c) => a + c.value, 0);

export function computeMetrics(clients: Client[], tasks: Task[]) {
  const open = clients.filter((c) => OPEN_STAGES.includes(c.status));
  const won = clients.filter((c) => c.status === 'Won');
  const lost = clients.filter((c) => c.status === 'Lost');
  const closed = won.length + lost.length;

  const pending = tasks.filter((t) => !t.done);
  const overdue = tasks.filter(isOverdue);

  const openValue = sum(open);
  const wonValue = sum(won);
  const forecast = open.reduce((a, c) => a + c.value * STAGE_PROBABILITY[c.status], 0);

  /** Won ÷ (won + lost). Null until at least one deal has closed. */
  const winRate = closed ? won.length / closed : null;
  const avgDeal = won.length ? wonValue / won.length : 0;

  const cycles = won.filter((c) => c.closedAt).map((c) => daysBetween(c.createdAt, c.closedAt as string));
  const avgCycleDays = cycles.length ? cycles.reduce((a, b) => a + b, 0) / cycles.length : null;

  /**
   * Sales velocity: how much revenue the pipeline is expected to generate per day.
   * (open deals × win rate × average deal size) ÷ average sales cycle length.
   */
  const velocityPerDay =
    winRate !== null && avgCycleDays ? (open.length * winRate * avgDeal) / Math.max(1, avgCycleDays) : null;

  const stale = open
    .filter((c) => daysSince(c.updatedAt) >= STALE_DAYS)
    .sort((a, b) => daysSince(b.updatedAt) - daysSince(a.updatedAt));

  const byStage = STAGES.map((stage) => {
    const list = clients.filter((c) => c.status === stage);
    return { stage, count: list.length, value: sum(list) };
  });

  return {
    open,
    won,
    lost,
    pending,
    overdue,
    openValue,
    wonValue,
    forecast,
    winRate,
    avgDeal,
    avgCycleDays,
    velocityPerDay,
    stale,
    byStage,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;

/** Revenue won per calendar month, for the last `months` months (oldest first). */
export function monthlyWonRevenue(clients: Client[], months = 6) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      value: 0,
      deals: 0,
    };
  });
  for (const c of clients) {
    if (c.status !== 'Won' || !c.closedAt) continue;
    const d = new Date(c.closedAt);
    const bucket = buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) {
      bucket.value += c.value;
      bucket.deals += 1;
    }
  }
  return buckets;
}

/** Tasks sorted the way a salesperson should tackle them: overdue, then priority, then date. */
export function prioritizeTasks(tasks: Task[]) {
  return [...tasks]
    .filter((t) => !t.done)
    .sort(
      (a, b) =>
        Number(isOverdue(b)) - Number(isOverdue(a)) ||
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (a.due ?? '9999').localeCompare(b.due ?? '9999'),
    );
}

/** Best open deal by expected value (value × stage probability). */
export function bestDeal(clients: Client[]) {
  return [...clients]
    .filter((c) => OPEN_STAGES.includes(c.status))
    .sort((a, b) => b.value * STAGE_PROBABILITY[b.status] - a.value * STAGE_PROBABILITY[a.status])[0];
}

export const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`);
