'use client';
import { agoLabel, money } from '@/lib/format';
import { computeMetrics, pct, prioritizeTasks } from '@/lib/metrics';
import { useCrmContext } from '../CrmContext';
import { ForecastMosaic } from '../ForecastMosaic';
import { Icon } from '../Icons';
import { OwlMark } from '../Logo';
import { Avatar, Empty, HelpButton, StagePill, TaskRow } from '../ui';

const SUGGESTIONS = ['What should I prioritize today?', 'What is my best deal?', 'Which deals are at risk?'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Dashboard() {
  const { data, ui, crm, mode } = useCrmContext();
  const m = computeMetrics(data.clients, data.tasks);
  const focus = prioritizeTasks(data.tasks).slice(0, 5);

  if (!data.clients.length) {
    return (
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow light">Welcome to WiseCRM</span>
          <h1 className="display">Your workspace is ready. Let&apos;s add your first deal.</h1>
          <div className="hero-actions">
            <button className="btn accent" onClick={() => ui.editClient()}>
              <Icon name="plus" size={16} /> Add a client
            </button>
            {mode === 'live' && (
              <button className="ghost on-dark" onClick={crm.loadSampleData}>
                Load sample data
              </button>
            )}
          </div>
        </div>
        <OwlMark size={140} />
      </section>
    );
  }

  const ledger = [
    { label: 'Revenue won', value: money(m.wonValue), note: `${m.won.length} deals closed` },
    { label: 'Win rate', value: pct(m.winRate), note: `${m.won.length} won · ${m.lost.length} lost` },
    { label: 'Average deal size', value: money(m.avgDeal), note: 'across won deals' },
    {
      label: 'Sales velocity',
      value: m.velocityPerDay === null ? '—' : money(m.velocityPerDay),
      note: 'expected revenue per day',
    },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow light">
            {greeting()} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <h1 className="display">
            Your pipeline is worth <em>{money(m.openValue)}</em>. Realistically, <mark>{money(m.forecast)}</mark>.
          </h1>
          <p className="hero-sub">
            That&apos;s the weighted forecast: each open deal multiplied by its odds of closing.{' '}
            <button className="link light" onClick={() => ui.openHelp('Weighted forecast')}>
              How it works
            </button>
          </p>
          <div className="hero-chips">
            <button className={`hero-chip ${m.overdue.length ? 'alert' : ''}`} onClick={() => ui.go('Activities')}>
              {m.overdue.length ? `${m.overdue.length} overdue ${m.overdue.length > 1 ? 'tasks' : 'task'}` : 'No overdue tasks'}
            </button>
            <button className={`hero-chip ${m.stale.length ? 'warn' : ''}`} onClick={() => ui.openHelp('Needs attention')}>
              {m.stale.length ? `${m.stale.length} ${m.stale.length > 1 ? 'deals' : 'deal'} going cold` : 'No cold deals'}
            </button>
            <button className="hero-chip" onClick={() => ui.go('Pipeline')}>
              {m.open.length} open deals →
            </button>
          </div>
        </div>
        <ForecastMosaic clients={data.clients} onSelect={() => ui.go('Pipeline')} />
      </section>

      <section className="ledger" aria-label="Key metrics">
        {ledger.map((k) => (
          <div className="ledger-item" key={k.label}>
            <div className="ledger-label">
              {k.label}
              <HelpButton topic={k.label} />
            </div>
            <div className="figure">{k.value}</div>
            <div className="ledger-note">{k.note}</div>
          </div>
        ))}
      </section>

      <div className="grid two-col">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Today&apos;s focus</h2>
              <div className="muted small">Overdue first, then by priority</div>
            </div>
            <button className="link" onClick={() => ui.newTask()}>
              + New task
            </button>
          </div>
          {focus.length ? focus.map((t) => <TaskRow key={t.id} task={t} />) : <Empty>All your tasks are done. Nice.</Empty>}
          <button className="link see-all" onClick={() => ui.go('Activities')}>
            See all activities →
          </button>
        </section>

        <div className="stack">
          <section className="panel owl-card">
            <div className="owl-card-head">
              <OwlMark size={44} />
              <div>
                <h2>Ask Wise Copilot</h2>
                <div className="muted small">Answers from your own data</div>
              </div>
            </div>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion" onClick={() => ui.askCopilot(s)}>
                {s}
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Going cold</h2>
              <HelpButton topic="Needs attention" />
            </div>
            {m.stale.length ? (
              m.stale.map((c) => (
                <button className="row clickable" key={c.id} onClick={() => ui.openClient(c.id)}>
                  <Avatar name={c.name} />
                  <div className="grow">
                    <div className="t1">{c.company}</div>
                    <div className="t2">Last activity {agoLabel(c.updatedAt)}</div>
                  </div>
                  <StagePill stage={c.status} />
                </button>
              ))
            ) : (
              <Empty>No open deal has been quiet for more than a week.</Empty>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
