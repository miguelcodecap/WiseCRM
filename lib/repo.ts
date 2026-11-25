import type { SupabaseClient } from '@supabase/supabase-js';
import { makeSampleData } from './seed';
import type { Client, CrmData, Task } from './types';

/**
 * Storage abstraction. The UI talks only to this interface, so the same screens
 * work against the browser (demo) or Supabase (real accounts).
 */
export interface Repo {
  kind: 'demo' | 'live';
  load(): Promise<CrmData>;
  saveClient(c: Client): Promise<void>;
  deleteClient(id: string): Promise<void>;
  saveTask(t: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  /** Insert many records at once (sample data, undo). */
  bulkInsert(data: CrmData): Promise<void>;
}

/* ---------------------------------------------------------------- Demo ---- */

const KEY = 'wisecrm:demo:v2';

function read(): CrmData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CrmData) : null;
  } catch {
    return null;
  }
}

/** Browser-only sandbox with sample data. Nothing leaves the visitor's device. */
export class DemoRepo implements Repo {
  kind = 'demo' as const;
  private data: CrmData = { clients: [], tasks: [] };

  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage may be unavailable (private mode); the demo still works in memory */
    }
  }

  async load() {
    this.data = read() ?? makeSampleData();
    this.persist();
    return structuredClone(this.data);
  }

  reset() {
    this.data = makeSampleData();
    this.persist();
    return structuredClone(this.data);
  }

  private upsert<T extends { id: string }>(list: T[], item: T) {
    const i = list.findIndex((x) => x.id === item.id);
    if (i === -1) list.unshift(item);
    else list[i] = item;
  }

  async saveClient(c: Client) {
    this.upsert(this.data.clients, c);
    this.persist();
  }
  async deleteClient(id: string) {
    this.data.clients = this.data.clients.filter((c) => c.id !== id);
    this.persist();
  }
  async saveTask(t: Task) {
    this.upsert(this.data.tasks, t);
    this.persist();
  }
  async deleteTask(id: string) {
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.persist();
  }
  async bulkInsert(d: CrmData) {
    d.clients.forEach((c) => this.upsert(this.data.clients, c));
    d.tasks.forEach((t) => this.upsert(this.data.tasks, t));
    this.persist();
  }
}

/* ------------------------------------------------------------ Supabase ---- */

type ClientRow = {
  id: string;
  organization_id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  status: Client['status'];
  value: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

type TaskRow = {
  id: string;
  organization_id: string;
  title: string;
  client_id: string | null;
  due_date: string | null;
  done: boolean;
  priority: Task['priority'];
};

const fromClientRow = (r: ClientRow): Client => ({
  id: r.id,
  name: r.name,
  company: r.company,
  email: r.email ?? '',
  phone: r.phone ?? '',
  status: r.status,
  value: Number(r.value),
  notes: r.notes ?? '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  closedAt: r.closed_at,
});

const fromTaskRow = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  clientId: r.client_id,
  due: r.due_date,
  done: r.done,
  priority: r.priority,
});

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Real, multi-user storage. Row Level Security limits every query to the user's organization. */
export class SupabaseRepo implements Repo {
  kind = 'live' as const;
  constructor(
    private db: SupabaseClient,
    private orgId: string,
  ) {}

  private clientRow = (c: Client): ClientRow => ({
    id: c.id,
    organization_id: this.orgId,
    name: c.name,
    company: c.company,
    email: c.email || null,
    phone: c.phone || null,
    status: c.status,
    value: c.value,
    notes: c.notes || null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    closed_at: c.closedAt,
  });

  private taskRow = (t: Task): TaskRow => ({
    id: t.id,
    organization_id: this.orgId,
    title: t.title,
    client_id: t.clientId,
    due_date: t.due,
    done: t.done,
    priority: t.priority,
  });

  async load() {
    const [c, t] = await Promise.all([
      this.db.from('clients').select('*').eq('organization_id', this.orgId).order('created_at', { ascending: false }),
      this.db.from('tasks').select('*').eq('organization_id', this.orgId).order('due_date', { ascending: true }),
    ]);
    check(c.error);
    check(t.error);
    return {
      clients: ((c.data ?? []) as ClientRow[]).map(fromClientRow),
      tasks: ((t.data ?? []) as TaskRow[]).map(fromTaskRow),
    };
  }

  async saveClient(c: Client) {
    check((await this.db.from('clients').upsert(this.clientRow(c))).error);
  }
  async deleteClient(id: string) {
    check((await this.db.from('clients').delete().eq('id', id)).error);
  }
  async saveTask(t: Task) {
    check((await this.db.from('tasks').upsert(this.taskRow(t))).error);
  }
  async deleteTask(id: string) {
    check((await this.db.from('tasks').delete().eq('id', id)).error);
  }
  async bulkInsert(d: CrmData) {
    if (d.clients.length) check((await this.db.from('clients').upsert(d.clients.map(this.clientRow))).error);
    if (d.tasks.length) check((await this.db.from('tasks').upsert(d.tasks.map(this.taskRow))).error);
  }
}

/**
 * Returns the user's organization, creating one on first sign-in.
 * Creation goes through a SECURITY DEFINER function so users can never
 * add themselves to someone else's organization.
 */
export async function ensureOrganization(db: SupabaseClient, fallbackName: string): Promise<string> {
  const { data, error } = await db.from('memberships').select('organization_id').limit(1);
  check(error);
  if (data && data.length) return data[0].organization_id as string;
  const created = await db.rpc('create_organization', { org_name: fallbackName });
  check(created.error);
  return created.data as string;
}
