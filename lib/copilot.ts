import { agoLabel, dueLabel, isOverdue, money } from './format';
import { HELP } from './help';
import { bestDeal, computeMetrics, pct, prioritizeTasks, STAGE_PROBABILITY } from './metrics';
import type { CrmData } from './types';

/**
 * Compact, privacy-conscious snapshot of the CRM sent to the AI model.
 * Only what is needed to answer sales questions; no emails or phone numbers.
 */
export function buildContext({ clients, tasks }: CrmData) {
  const m = computeMetrics(clients, tasks);
  const company = (id: string | null) => clients.find((c) => c.id === id)?.company ?? 'no client';
  return {
    today: new Date().toDateString(),
    metrics: {
      openPipeline: m.openValue,
      weightedForecast: Math.round(m.forecast),
      revenueWon: m.wonValue,
      winRate: pct(m.winRate),
      averageDealSize: Math.round(m.avgDeal),
      averageSalesCycleDays: m.avgCycleDays === null ? null : Math.round(m.avgCycleDays),
      salesVelocityPerDay: m.velocityPerDay === null ? null : Math.round(m.velocityPerDay),
      stageProbabilities: STAGE_PROBABILITY,
    },
    deals: clients.slice(0, 60).map((c) => ({
      company: c.company,
      contact: c.name,
      stage: c.status,
      value: c.value,
      lastActivity: agoLabel(c.updatedAt),
      notes: c.notes.slice(0, 200) || undefined,
    })),
    openTasks: prioritizeTasks(tasks)
      .slice(0, 30)
      .map((t) => ({
        title: t.title,
        client: company(t.clientId),
        due: dueLabel(t.due),
        overdue: isOverdue(t),
        priority: t.priority,
      })),
  };
}

/** Offline fallback used when no AI key is configured (or the API is unavailable). */
export function ruleBasedAnswer(question: string, { clients, tasks }: CrmData): string {
  const q = question.toLowerCase();
  const m = computeMetrics(clients, tasks);
  const company = (id: string | null) => clients.find((c) => c.id === id)?.company ?? 'no client';

  if (q.includes('prior') || q.includes('today') || q.includes('first')) {
    const list = prioritizeTasks(tasks).slice(0, 3);
    if (!list.length) return 'You have no open tasks. A good moment to review deals that have gone quiet.';
    return `Start with: ${list
      .map((t, i) => `${i + 1}) ${t.title} — ${company(t.clientId)}, ${dueLabel(t.due).toLowerCase()}${isOverdue(t) ? ', overdue' : ''}`)
      .join('; ')}.`;
  }
  if (q.includes('best') || q.includes('biggest') || q.includes('top')) {
    const b = bestDeal(clients);
    return b
      ? `${b.company} (${b.name}): ${money(b.value)} in ${b.status}. Weighted by stage probability it is worth ${money(
          b.value * STAGE_PROBABILITY[b.status],
        )}, the highest expected value in your pipeline.`
      : 'You have no open deals right now.';
  }
  if (q.includes('cold') || q.includes('risk') || q.includes('idle') || q.includes('attention')) {
    return m.stale.length
      ? `Quiet for 7+ days: ${m.stale.map((c) => `${c.company} (last activity ${agoLabel(c.updatedAt)})`).join(', ')}. Schedule a follow-up for each.`
      : 'No open deal has been idle for more than a week. Nice work.';
  }
  if (q.includes('win') || q.includes('conversion')) {
    return `${HELP['Win rate']} Right now: ${m.won.length} won and ${m.lost.length} lost, so ${pct(m.winRate)}.`;
  }
  if (q.includes('velocity')) {
    return m.velocityPerDay === null
      ? `${HELP['Sales velocity']} You need at least one won deal to calculate it.`
      : `${HELP['Sales velocity']} Yours is ${money(m.velocityPerDay)} per day.`;
  }
  if (q.includes('forecast') || q.includes('weighted')) {
    return `${HELP['Weighted forecast']} Your current forecast is ${money(m.forecast)}.`;
  }
  if (q.includes('pipeline') || q.includes('funnel')) {
    return `${HELP['Open pipeline']} Today it totals ${money(m.openValue)} across ${m.open.length} deals.`;
  }
  return 'I can help with priorities, your best deal, deals at risk, win rate, sales velocity, forecast and pipeline. Connect an AI key to ask anything.';
}
