'use client';
import { useMemo, useState } from 'react';
import { money } from '@/lib/format';
import { STAGES, type Stage } from '@/lib/types';
import { useCrmContext } from '../CrmContext';
import { Icon } from '../Icons';
import { Avatar, Empty, PageHeader, StagePill } from '../ui';

type SortKey = 'value' | 'name' | 'company';

export function Clients() {
  const { data, ui } = useCrmContext();
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<Stage | 'All'>('All');
  const [sort, setSort] = useState<SortKey>('value');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.clients
      .filter((c) => (stage === 'All' || c.status === stage) && `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q))
      .sort((a, b) => (sort === 'value' ? b.value - a.value : a[sort].localeCompare(b[sort])));
  }, [data.clients, query, stage, sort]);

  const SortHeader = ({ k, children, className }: { k: SortKey; children: string; className?: string }) => (
    <th className={className} aria-sort={sort === k ? 'descending' : undefined}>
      <button onClick={() => setSort(k)}>
        {children}
        {sort === k ? ' ↓' : ''}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${data.clients.length} contacts · open a record to see details, tasks and history`}
        action={
          <button className="btn" onClick={() => ui.editClient()}>
            <Icon name="plus" size={16} /> New client
          </button>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <input
            className="field filter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, company or email"
            aria-label="Filter clients"
          />
          <div className="chips" role="group" aria-label="Filter by stage">
            {(['All', ...STAGES] as const).map((s) => (
              <button key={s} className={`chip ${stage === s ? 'on' : ''}`} onClick={() => setStage(s)} aria-pressed={stage === s}>
                {s} {s === 'All' ? data.clients.length : data.clients.filter((c) => c.status === s).length}
              </button>
            ))}
          </div>
        </div>

        {list.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortHeader k="name">Contact</SortHeader>
                  <SortHeader k="company" className="hide-sm">
                    Company
                  </SortHeader>
                  <th className="hide-sm">Email</th>
                  <th>Stage</th>
                  <SortHeader k="value" className="num">
                    Value
                  </SortHeader>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} onClick={() => ui.openClient(c.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && ui.openClient(c.id)}>
                    <td>
                      <div className="who">
                        <Avatar name={c.name} />
                        <div>
                          <div className="t1">{c.name}</div>
                          <div className="t2 show-sm">{c.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hide-sm">{c.company}</td>
                    <td className="hide-sm muted">{c.email}</td>
                    <td>
                      <StagePill stage={c.status} />
                    </td>
                    <td className="num strong">{money(c.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            No clients match.{' '}
            <button
              className="link"
              onClick={() => {
                setQuery('');
                setStage('All');
              }}
            >
              Clear filters
            </button>
          </Empty>
        )}
      </section>
    </>
  );
}
