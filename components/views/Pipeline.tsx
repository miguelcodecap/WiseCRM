'use client';
import { useRef, useState } from 'react';
import { money } from '@/lib/format';
import { STAGE_COLOR, STAGE_PROBABILITY } from '@/lib/metrics';
import { STAGES, type Stage } from '@/lib/types';
import { useCrmContext } from '../CrmContext';
import { Icon } from '../Icons';
import { Avatar, PageHeader } from '../ui';

export function Pipeline() {
  const { data, crm, ui } = useCrmContext();
  const [over, setOver] = useState<Stage | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const justDragged = useRef(false);

  const move = (id: string, stage: Stage) => {
    const company = data.clients.find((c) => c.id === id)?.company;
    const previous = crm.setStage(id, stage);
    if (previous) ui.toast(`${company} → ${stage}`, () => crm.setStage(id, previous));
  };

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle="Drag a card to another column, or use its menu, to record progress."
        action={
          <button className="btn" onClick={() => ui.editClient()}>
            <Icon name="plus" size={16} /> New deal
          </button>
        }
      />
      <div className="board">
        {STAGES.map((stage) => {
          const deals = data.clients.filter((c) => c.status === stage);
          return (
            <div
              key={stage}
              className={`column ${over === stage ? 'over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData('text/plain');
                if (id) move(id, stage);
              }}
            >
              <div className="column-head">
                <div className="column-title">
                  <span className="dot" style={{ background: STAGE_COLOR[stage] }} />
                  <b>{stage}</b>
                  <span className="count-badge">{deals.length}</span>
                </div>
                <div className="figure-sm">{money(deals.reduce((a, c) => a + c.value, 0))}</div>
                <small>
                  {stage === 'Won' ? 'closed and won' : stage === 'Lost' ? 'closed, not won' : `${Math.round(STAGE_PROBABILITY[stage] * 100)}% odds of closing`}
                </small>
              </div>
              {deals.length ? (
                deals.map((c) => (
                  <article
                    key={c.id}
                    className={`deal ${dragging === c.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', c.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDragging(c.id);
                      justDragged.current = true;
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setTimeout(() => (justDragged.current = false), 50);
                    }}
                    onClick={(e) => {
                      if (justDragged.current || (e.target as HTMLElement).closest('select')) return;
                      ui.openClient(c.id);
                    }}
                  >
                    <div className="deal-top">
                      <div className="grow">
                        <div className="t1">{c.company}</div>
                        <div className="t2">{c.name}</div>
                      </div>
                      <Avatar name={c.name} size={28} />
                    </div>
                    <div className="deal-value figure-sm">{money(c.value)}</div>
                    <div className="odds" title={`${Math.round(STAGE_PROBABILITY[c.status] * 100)}% likely to close`}>
                      <i style={{ width: `${STAGE_PROBABILITY[c.status] * 100}%`, background: STAGE_COLOR[c.status] }} />
                    </div>
                    <select
                      className="field compact"
                      value={c.status}
                      onChange={(e) => move(c.id, e.target.value as Stage)}
                      aria-label={`Move ${c.company} to stage`}
                    >
                      {STAGES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </article>
                ))
              ) : (
                <div className="empty">Drop deals here</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
