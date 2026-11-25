'use client';
import { useState, type FormEvent } from 'react';
import { dayOffset } from '@/lib/format';
import { PRIORITIES, type Priority } from '@/lib/types';
import { useCrmContext } from '../CrmContext';
import { Icon } from '../Icons';
import { Scrim } from './Scrim';

export function TaskForm({ clientId, onClose }: { clientId?: string; onClose(): void }) {
  const { data, crm, ui } = useCrmContext();
  const [title, setTitle] = useState('');
  const [client, setClient] = useState(clientId ?? '');
  const [due, setDue] = useState(dayOffset(1));
  const [priority, setPriority] = useState<Priority>('Medium');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    crm.saveTask({ title: title.trim(), clientId: client || null, due: due || null, priority, done: false });
    ui.toast('Task created');
    onClose();
  };

  return (
    <Scrim onClose={onClose} variant="modal" label="New task">
      <form onSubmit={submit}>
        <div className="modal-head">
          <h2>New task</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="form-grid">
          <label className="full">
            What needs to be done?*
            <input
              className="field"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Send revised proposal"
              autoFocus
            />
          </label>
          <label className="full">
            Client
            <select className="field" value={client} onChange={(e) => setClient(e.target.value)}>
              <option value="">No client</option>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} · {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input className="field" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
          <label>
            Priority
            <select className="field" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn block">Create task</button>
      </form>
    </Scrim>
  );
}
