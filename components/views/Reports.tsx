'use client';
import { compactMoney, money } from '@/lib/format';
import { computeMetrics, monthlyWonRevenue, pct, STAGE_COLOR, STAGE_PROBABILITY } from '@/lib/metrics';
import { useCrmContext } from '../CrmContext';
import { HelpButton, PageHeader } from '../ui';

export function Reports() {
  const { data, ui } = useCrmContext();
  const m = computeMetrics(data.clients, data.tasks);
  const months = monthlyWonRevenue(data.clients);
  const maxMonth = Math.max(1, ...months.map((x) => x.value));
  const top = [...m.open].sort((a, b) => b.value * STAGE_PROBABILITY[b.status] - a.value * STAGE_PROBABILITY[a.status]).slice(0, 5);
  const done = data.tasks.filter((t) => t.done).length;

  const kpis = [
    { label: 'Sales velocity', value: m.velocityPerDay === null ? '—' : `${money(m.velocityPerDay)}/day` },
    { label: 'Win rate', value: pct(m.winRate) },
    { label: 'Average deal size', value: money(m.avgDeal) },
    { label: 'Sales cycle', value: m.avgCycleDays === null ? '—' : `${Math.round(m.avgCycleDays)} days` },
  ];

  return (
    <>
      <PageHeader title="Reports" subtitle="Calculated live from your data. Tap any ? to see the formula behind a metric." />

      <section className="ledger" aria-label="Key metrics">
        {kpis.map((k) => (
          <div className="ledger-item" key={k.label}>
            <div className="ledger-label">
              {k.label}
              <HelpButton topic={k.label} />
            </div>
            <div className="figure">{k.value}</div>
          </div>
        ))}
      </section>

      {m.velocityPerDay !== null && m.avgCycleDays !== null && m.winRate !== null && (
        <section className="formula">
          <h2>How your sales velocity is built</h2>
          <div className="equation">
            <span>
              <b>{m.open.length}</b>
              <small>open deals</small>
            </span>
            <i>×</i>
            <span>
              <b>{pct(m.winRate)}</b>
              <small>win rate</small>
            </span>
            <i>×</i>
            <span>
              <b>{money(m.avgDeal)}</b>
              <small>avg deal</small>
            </span>
            <i>÷</i>
            <span>
              <b>{Math.round(m.avgCycleDays)}d</b>
              <small>sales cycle</small>
            </span>
            <i>=</i>
            <span className="result">
              <b>{money(m.velocityPerDay)}</b>
              <small>per day</small>
            </span>
          </div>
          <p className="muted small">Raise any of the first three, or shorten the cycle, and velocity goes up.</p>
        </section>
      )}

      <div className="grid two-col">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Revenue won by month</h2>
              <div className="muted small">Last 6 months, by close date</div>
            </div>
          </div>
          <div className="columns-chart" role="img" aria-label="Revenue won per month">
            {months.map((x) => (
              <div className="col" key={x.key}>
                <b>{x.value ? compactMoney(x.value) : '—'}</b>
                <i style={{ height: `${(x.value / maxMonth) * 78}%` }} />
                <span>{x.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Forecast by stage</h2>
            <HelpButton topic="Weighted forecast" />
          </div>
          <table className="plain">
            <thead>
              <tr>
                <th>Stage</th>
                <th className="num">Pipeline</th>
                <th className="num">Prob.</th>
                <th className="num">Weighted</th>
              </tr>
            </thead>
            <tbody>
              {m.byStage
                .filter((s) => s.stage !== 'Won' && s.stage !== 'Lost')
                .map((s) => (
                  <tr key={s.stage}>
                    <td>
                      <span style={{ color: STAGE_COLOR[s.stage] }}>●</span> {s.stage}
                    </td>
                    <td className="num">{money(s.value)}</td>
                    <td className="num muted">{Math.round(STAGE_PROBABILITY[s.stage] * 100)}%</td>
                    <td className="num strong">{money(s.value * STAGE_PROBABILITY[s.stage])}</td>
                  </tr>
                ))}
              <tr className="total">
                <td>Total</td>
                <td className="num">{money(m.openValue)}</td>
                <td />
                <td className="num strong">{money(m.forecast)}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="spaced">Highest expected value</h2>
          {top.map((c, i) => (
            <button className="row clickable" key={c.id} onClick={() => ui.openClient(c.id)}>
              <b className="rank">{i + 1}</b>
              <div className="grow">
                <div className="t1">{c.company}</div>
                <div className="t2">
                  {c.status} · {money(c.value)} × {Math.round(STAGE_PROBABILITY[c.status] * 100)}%
                </div>
              </div>
              <b className="num">{money(c.value * STAGE_PROBABILITY[c.status])}</b>
            </button>
          ))}
        </section>
      </div>

      <p className="note">
        {done} of {data.tasks.length} tasks completed. No date filter: every record is included.
      </p>
    </>
  );
}
