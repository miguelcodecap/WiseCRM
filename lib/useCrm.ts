'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { uid } from './format';
import type { Repo } from './repo';
import { makeSampleData } from './seed';
import { OPEN_STAGES, type Client, type CrmData, type Stage, type Task } from './types';

const now = () => new Date().toISOString();

/**
 * All CRM state and mutations. Updates are optimistic: the UI changes instantly,
 * the repo persists in the background, and on failure we report the error and reload.
 */
export function useCrm(repo: Repo | null) {
  const [data, setData] = useState<CrmData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<CrmData | null>(null);
  dataRef.current = data;

  const reload = useCallback(async () => {
    if (!repo) return;
    try {
      setData(await repo.load());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load data');
    }
  }, [repo]);

  useEffect(() => {
    setData(null);
    void reload();
  }, [reload]);

  const persist = useCallback(
    (op: () => Promise<void>) => {
      op().catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not save changes');
        void reload();
      });
    },
    [reload],
  );

  const mutate = (fn: (d: CrmData) => CrmData) => setData((d) => (d ? fn(d) : d));

  const replace = <T extends { id: string }>(list: T[], item: T) =>
    list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

  const saveClient = (input: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'closedAt'> & { id?: string }) => {
    const prev = input.id ? dataRef.current?.clients.find((c) => c.id === input.id) : undefined;
    const closing = !OPEN_STAGES.includes(input.status);
    const client: Client = {
      ...input,
      id: input.id ?? uid(),
      createdAt: prev?.createdAt ?? now(),
      updatedAt: now(),
      closedAt: closing ? (prev?.closedAt && prev.status === input.status ? prev.closedAt : now()) : null,
    };
    mutate((d) => ({ ...d, clients: replace(d.clients, client) }));
    persist(() => repo!.saveClient(client));
    return client;
  };

  const setStage = (id: string, status: Stage) => {
    const c = dataRef.current?.clients.find((x) => x.id === id);
    if (!c || c.status === status) return null;
    const previous = c.status;
    saveClient({ ...c, status });
    return previous;
  };

  /** Deletes a client and its tasks. Returns a function that restores them (for "Undo"). */
  const deleteClient = (id: string) => {
    const d = dataRef.current;
    const client = d?.clients.find((c) => c.id === id);
    if (!d || !client) return () => {};
    const tasks = d.tasks.filter((t) => t.clientId === id);
    mutate((x) => ({ clients: x.clients.filter((c) => c.id !== id), tasks: x.tasks.filter((t) => t.clientId !== id) }));
    persist(async () => {
      for (const t of tasks) await repo!.deleteTask(t.id);
      await repo!.deleteClient(id);
    });
    return () => {
      mutate((x) => ({ clients: [client, ...x.clients], tasks: [...tasks, ...x.tasks] }));
      persist(() => repo!.bulkInsert({ clients: [client], tasks }));
    };
  };

  const saveTask = (input: Omit<Task, 'id'> & { id?: string }) => {
    const task: Task = { ...input, id: input.id ?? uid() };
    mutate((d) => ({ ...d, tasks: replace(d.tasks, task) }));
    persist(() => repo!.saveTask(task));
    // Working on a deal's task counts as activity on that deal.
    const c = task.clientId ? dataRef.current?.clients.find((x) => x.id === task.clientId) : undefined;
    if (c) {
      const touched = { ...c, updatedAt: now() };
      mutate((d) => ({ ...d, clients: replace(d.clients, touched) }));
      persist(() => repo!.saveClient(touched));
    }
    return task;
  };

  const toggleTask = (id: string) => {
    const t = dataRef.current?.tasks.find((x) => x.id === id);
    if (t) saveTask({ ...t, done: !t.done });
  };

  const deleteTask = (id: string) => {
    const t = dataRef.current?.tasks.find((x) => x.id === id);
    if (!t) return () => {};
    mutate((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
    persist(() => repo!.deleteTask(id));
    return () => {
      mutate((d) => ({ ...d, tasks: [t, ...d.tasks] }));
      persist(() => repo!.bulkInsert({ clients: [], tasks: [t] }));
    };
  };

  /** Adds the fictional sample dataset (used by new live accounts with an empty CRM). */
  const loadSampleData = () => {
    const sample = makeSampleData();
    mutate((d) => ({ clients: [...sample.clients, ...d.clients], tasks: [...sample.tasks, ...d.tasks] }));
    persist(() => repo!.bulkInsert(sample));
  };

  return {
    data,
    error,
    clearError: () => setError(null),
    reload,
    setData,
    saveClient,
    setStage,
    deleteClient,
    saveTask,
    toggleTask,
    deleteTask,
    loadSampleData,
  };
}

export type Crm = ReturnType<typeof useCrm>;
