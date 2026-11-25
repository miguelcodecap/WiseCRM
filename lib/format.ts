import type { Task } from './types';

const DAY = 86_400_000;

export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export const compactMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD (avoids the UTC shift of toISOString). */
export const toDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const dayOffset = (offset: number) => {
  const d = startOfToday();
  d.setDate(d.getDate() + offset);
  return toDay(d);
};

export const daysAgoISO = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const parseDay = (s: string) => new Date(`${s}T00:00:00`);

/** Whole days from today to a YYYY-MM-DD date (negative = past). */
export const daysUntil = (s: string) => Math.round((parseDay(s).getTime() - startOfToday().getTime()) / DAY);

/** Whole days since an ISO timestamp. */
export const daysSince = (iso: string) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((startOfToday().getTime() - d.getTime()) / DAY));
};

export const daysBetween = (fromIso: string, toIso: string) =>
  Math.max(0, (new Date(toIso).getTime() - new Date(fromIso).getTime()) / DAY);

export function dueLabel(s: string | null) {
  if (!s) return 'No date';
  const diff = daysUntil(s);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${-diff} days ago`;
  return parseDay(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function agoLabel(iso: string) {
  const d = daysSince(iso);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}

export const isOverdue = (t: Task) => !t.done && !!t.due && daysUntil(t.due) < 0;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const AVATAR = ['#ddd0ff', '#cfe3ff', '#c9f2e1', '#ffe4a8', '#ffd3e6', '#c7f0ee', '#ffd9bf'];
export const avatarColor = (name: string) => AVATAR[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length];

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
