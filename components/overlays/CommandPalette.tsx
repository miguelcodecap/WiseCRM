'use client';
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { dueLabel } from '@/lib/format';
import { SECTIONS } from '@/lib/types';
import { useCrmContext } from '../CrmContext';
import { Icon } from '../Icons';
import { Avatar, StagePill } from '../ui';
import { Scrim } from './Scrim';

type Item = { key: string; group: string; run(): void; render: ReactNode };

export function CommandPalette({ onClose }: { onClose(): void }) {
  const { data, ui } = useCrmContext();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  const items = useMemo<Item[]>(() => {
    const t = q.trim().toLowerCase();
    const clients = data.clients
      .filter((c) => `${c.name} ${c.company}`.toLowerCase().includes(t))
      .slice(0, 6)
      .map<Item>((c) => ({
        key: c.id,
        group: 'Clients',
        run: () => ui.openClient(c.id),
        render: (
          <>
            <Avatar name={c.name} />
            <div className="grow">
              <div className="t1">{c.name}</div>
              <div className="t2">{c.company}</div>
            </div>
            <StagePill stage={c.status} />
          </>
        ),
      }));
    const tasks = t
      ? data.tasks
          .filter((x) => x.title.toLowerCase().includes(t))
          .slice(0, 4)
          .map<Item>((x) => ({
            key: x.id,
            group: 'Tasks',
            run: () => (x.clientId ? ui.openClient(x.clientId) : ui.go('Activities')),
            render: (
              <div className="grow">
                <div className="t1">{x.title}</div>
                <div className="t2">{dueLabel(x.due)}</div>
              </div>
            ),
          }))
      : [];
    const sections = SECTIONS.filter((s) => s.toLowerCase().includes(t)).map<Item>((s) => ({
      key: s,
      group: 'Go to',
      run: () => ui.go(s),
      render: (
        <>
          <Icon name={s} />
          <span className="t1">{s}</span>
        </>
      ),
    }));
    return [...clients, ...tasks, ...sections];
  }, [q, data, ui]);

  const onKey = (e: KeyboardEvent) => {
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => (s + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[Math.min(sel, items.length - 1)]?.run();
    }
  };

  let lastGroup = '';
  return (
    <Scrim onClose={onClose} variant="palette" label="Search">
      <input
        className="palette-input"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setSel(0);
        }}
        onKeyDown={onKey}
        placeholder="Search clients, tasks or sections…"
        aria-label="Search"
        autoFocus
      />
      <div className="palette-results" role="listbox">
        {items.length === 0 && <div className="empty">No results.</div>}
        {items.map((it, i) => {
          const header = it.group !== lastGroup ? <div className="palette-group">{it.group}</div> : null;
          lastGroup = it.group;
          return (
            <div key={`${it.group}-${it.key}`}>
              {header}
              <button
                className={`palette-item ${i === sel ? 'sel' : ''}`}
                role="option"
                aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}
                onClick={it.run}
              >
                {it.render}
              </button>
            </div>
          );
        })}
      </div>
    </Scrim>
  );
}
