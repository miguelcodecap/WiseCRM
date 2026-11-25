'use client';
import type { ReactNode } from 'react';
import { avatarColor, dueLabel, initials, isOverdue } from '@/lib/format';
import type { Priority, Stage, Task } from '@/lib/types';
import { useCrmContext } from './CrmContext';
import { Icon } from './Icons';

export function StagePill({ stage }: { stage: Stage }) {
  return <span className={`pill stage-${stage}`}>{stage}</span>;
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return <span className={`pill prio-${priority}`}>{priority}</span>;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="avatar-ini" style={{ background: avatarColor(name), width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </span>
  );
}

export function HelpButton({ topic }: { topic: string }) {
  const { ui } = useCrmContext();
  return (
    <button className="icon-btn small" onClick={() => ui.openHelp(topic)} aria-label={`Explain ${topic}`}>
      <Icon name="help" size={15} />
    </button>
  );
}

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function TaskRow({ task, showClient = true, onDelete }: { task: Task; showClient?: boolean; onDelete?: () => void }) {
  const { data, crm, ui } = useCrmContext();
  const client = data.clients.find((c) => c.id === task.clientId);
  const late = isOverdue(task);
  const toggle = () => {
    crm.toggleTask(task.id);
    if (!task.done) ui.toast('Task completed', () => crm.toggleTask(task.id));
  };
  return (
    <div className={`row task ${task.done ? 'done' : ''}`}>
      <button className={`check ${task.done ? 'on' : ''}`} onClick={toggle} aria-label={task.done ? 'Reopen task' : 'Complete task'}>
        {task.done && <Icon name="check" size={15} />}
      </button>
      <div className="grow">
        <div className="t1">{task.title}</div>
        <div className="t2">
          {showClient && (
            <>
              {client ? (
                <button className="inline-link" onClick={() => ui.openClient(client.id)}>
                  {client.company}
                </button>
              ) : (
                'No client'
              )}
              {' · '}
            </>
          )}
          <span className={late ? 'overdue' : ''}>
            {dueLabel(task.due)}
            {late && ' · overdue'}
          </span>
        </div>
      </div>
      <PriorityPill priority={task.priority} />
      {onDelete && (
        <button className="icon-btn" onClick={onDelete} aria-label="Delete task">
          <Icon name="trash" size={16} />
        </button>
      )}
    </div>
  );
}
