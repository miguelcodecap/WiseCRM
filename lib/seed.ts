import { dayOffset, daysAgoISO, uid } from './format';
import type { Client, CrmData, Priority, Stage, Task } from './types';

type SeedClient = [name: string, company: string, status: Stage, value: number, createdAgo: number, closedAgo: number | null, updatedAgo: number, notes?: string, phone?: string];

const CLIENTS: SeedClient[] = [
  ['Emily Carter', 'Northstar Capital', 'Negotiation', 12500, 34, null, 2, 'Asked for a proposal with a volume discount.', '+1 (415) 555-0134'],
  ['Kenji Watanabe', 'Vertex Studio', 'Proposal', 8400, 21, null, 6, 'Prefers short calls before 10 a.m. Tokyo time.'],
  ['Amara Okafor', 'BluePeak Group', 'Lead', 5200, 4, null, 1, 'Referred by Emily Carter.'],
  ['Lucas Martin', 'Orion Labs', 'Won', 9600, 70, 41, 41, 'Annual contract signed.', '+33 1 55 50 01 77'],
  ['Sofía Ramírez', 'Andes Logistics', 'Negotiation', 18300, 48, null, 12, 'Final decision rests with the board.', '+51 987 210 334'],
  ['Jake Thompson', 'Pacific Retail', 'Proposal', 6700, 15, null, 3],
  ['Priya Raman', 'Nimbus Health', 'Won', 14200, 95, 52, 52, 'Champion inside the company; open to a case study.'],
  ['Lars Johansson', 'Nordlys Energy', 'Lost', 7800, 80, 33, 33, 'Chose a cheaper local vendor.'],
  ['Fatima Al-Sayed', 'Mistral Foods', 'Lead', 4100, 1, null, 0],
  ['Marcus Johnson', 'Altura Mining', 'Won', 21500, 150, 104, 104, 'Expansion opportunity next fiscal year.', '+1 (303) 555-0190'],
  ['Ana Ferreira', 'Lumen Education', 'Won', 6900, 60, 18, 18],
  ['Daniel Kim', 'Quantia Fintech', 'Lost', 11200, 120, 75, 75, 'Budget frozen after their funding round slipped.'],
  ['Olivia Bennett', 'Sierra Coffee Co.', 'Won', 5400, 40, 9, 9],
  ['Tomasz Nowak', 'Cobalt Security', 'Proposal', 9900, 26, null, 9],
];

type SeedTask = [title: string, clientIndex: number | null, dueOffset: number | null, priority: Priority, done?: boolean];

const TASKS: SeedTask[] = [
  ['Confirm sales proposal', 0, 0, 'High'],
  ['Follow up on the proposal sent', 1, -1, 'High'],
  ['Prepare discovery meeting', 2, 1, 'Medium'],
  ['Send industry case study', 4, 2, 'Medium'],
  ['Welcome call', 3, -4, 'Low', true],
  ['Review pricing objections', 5, 3, 'Low'],
  ['Book a demo with the security team', 13, -2, 'Medium'],
  ['Quarterly business review', 9, 6, 'Low'],
];

const email = (name: string, company: string) =>
  `${name.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}@${company
    .toLowerCase()
    .replace(/[^a-z]/g, '')}.example`;

/** Fictional sample data with dates relative to today, so the demo always looks current. */
export function makeSampleData(): CrmData {
  const clients: Client[] = CLIENTS.map(([name, company, status, value, createdAgo, closedAgo, updatedAgo, notes = '', phone = '']) => ({
    id: uid(),
    name,
    company,
    email: email(name, company),
    phone,
    status,
    value,
    notes,
    createdAt: daysAgoISO(createdAgo),
    updatedAt: daysAgoISO(updatedAgo),
    closedAt: closedAgo === null ? null : daysAgoISO(closedAgo),
  }));

  const tasks: Task[] = TASKS.map(([title, ci, due, priority, done = false]) => ({
    id: uid(),
    title,
    clientId: ci === null ? null : clients[ci].id,
    due: due === null ? null : dayOffset(due),
    done,
    priority,
  }));

  return { clients, tasks };
}
