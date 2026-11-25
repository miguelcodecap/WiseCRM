'use client';
import { useState } from 'react';
import { isOverdue } from '@/lib/format';
import { useCrmContext } from '../CrmContext';
import { Icon } from '../Icons';
import { Empty, PageHeader, TaskRow } from '../ui';

const FILTERS = ['Open', 'Overdue', 'Completed', 'All'] as const;
type Filter = (typeof FILTERS)[number];

export function Activities() {
  const { data, crm, ui } = useCrmContext();
  const [filter, setFilter] = useState<Filter>('Open');

  const matches = {
    Open: (t: (typeof data.tasks)[number]) => !t.done,
    Overdue: isOverdue,
    Completed: (t: (typeof data.tasks)[number]) => t.done,
    All: () => true,
  } satisfies Record<Filter, (t: (typeof data.tasks)[number]) => boolean>;

  const list = data.tasks
    .filter(matches[filter])
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? '9999').localeCompare(b.due ?? '9999'));

  return (
    <>
      <PageHeader
        title="Activities"
        subtitle="Your follow-ups with due dates and priority. Overdue ones are flagged in red."
        action={
          <button className="btn" onClick={() => ui.newTask()}>
            <Icon name="plus" size={16} /> New task
          </button>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <div className="chips" role="group" aria-label="Filter tasks">
            {FILTERS.map((f) => (
              <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)} aria-pressed={filter === f}>
                {f} {data.tasks.filter(matches[f]).length}
              </button>
            ))}
          </div>
        </div>
        {list.length ? (
          list.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onDelete={() => {
                const undo = crm.deleteTask(t.id);
                ui.toast('Task deleted', undo);
              }}
            />
          ))
        ) : (
          <Empty>No tasks in this view.</Empty>
        )}
      </section>
    </>
  );
}
