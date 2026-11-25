'use client';
import { agoLabel, money } from '@/lib/format';
import { STAGE_PROBABILITY } from '@/lib/metrics';
import { STAGES, type Stage } from '@/lib/types';
import { useCrmContext } from '../CrmContext';
import { Icon } from '../Icons';
import { Avatar, Empty, TaskRow } from '../ui';
import { Scrim } from './Scrim';

export function ClientDrawer({ id, onClose }: { id: string; onClose(): void }) {
  const { data, crm, ui } = useCrmContext();
  const c = data.clients.find((x) => x.id === id);
  if (!c) return null;
  const tasks = data.tasks.filter((t) => t.clientId === id);

  const changeStage = (stage: Stage) => {
    const previous = crm.setStage(c.id, stage);
    if (previous) ui.toast(`${c.company} → ${stage}`, () => crm.setStage(c.id, previous));
  };

  const remove = () => {
    const undo = crm.deleteClient(c.id);
    onClose();
    ui.toast(`${c.company} deleted`, undo);
  };

  return (
    <Scrim onClose={onClose} variant="drawer" label={`${c.name}, ${c.company}`}>
      <div className="drawer-head">
        <div className="who">
          <Avatar name={c.name} size={44} />
          <div>
            <div className="t1 big">{c.name}</div>
            <div className="t2">{c.company}</div>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <dl className="facts">
        <dt>Stage</dt>
        <dd>
          <select className="field compact" value={c.status} onChange={(e) => changeStage(e.target.value as Stage)} aria-label="Stage">
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </dd>
        <dt>Value</dt>
        <dd className="strong">{money(c.value)}</dd>
        <dt>Probability</dt>
        <dd>
          {Math.round(STAGE_PROBABILITY[c.status] * 100)}% · expected {money(c.value * STAGE_PROBABILITY[c.status])}
        </dd>
        <dt>Email</dt>
        <dd>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : '—'}</dd>
        <dt>Phone</dt>
        <dd>{c.phone || '—'}</dd>
        <dt>Created</dt>
        <dd>{agoLabel(c.createdAt)}</dd>
        <dt>Last activity</dt>
        <dd>{agoLabel(c.updatedAt)}</dd>
      </dl>

      {c.notes && (
        <div className="tip">
          <b>Notes</b>
          {c.notes}
        </div>
      )}

      <div className="panel-head spaced">
        <h2>Tasks ({tasks.length})</h2>
        <button className="link" onClick={() => ui.newTask(c.id)}>
          + Add task
        </button>
      </div>
      {tasks.length ? tasks.map((t) => <TaskRow key={t.id} task={t} showClient={false} />) : <Empty>No tasks for this client yet.</Empty>}

      <div className="drawer-actions">
        <button className="ghost" onClick={() => ui.editClient(c.id)}>
          Edit details
        </button>
        <button className="ghost danger" onClick={remove}>
          <Icon name="trash" size={16} /> Delete
        </button>
      </div>
    </Scrim>
  );
}
