export const STAGES = ['Lead', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const;
export type Stage = (typeof STAGES)[number];

export const OPEN_STAGES: Stage[] = ['Lead', 'Proposal', 'Negotiation'];

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: Stage;
  value: number;
  notes: string;
  /** ISO timestamps */
  createdAt: string;
  updatedAt: string;
  /** Set when the deal moves to Won or Lost; used for sales-cycle metrics. */
  closedAt: string | null;
}

export interface Task {
  id: string;
  title: string;
  clientId: string | null;
  /** Local calendar day, YYYY-MM-DD */
  due: string | null;
  done: boolean;
  priority: Priority;
}

export interface CrmData {
  clients: Client[];
  tasks: Task[];
}

export const SECTIONS = ['Dashboard', 'Clients', 'Pipeline', 'Activities', 'Reports', 'Copilot'] as const;
export type Section = (typeof SECTIONS)[number];
