'use client';
import { useState, type FormEvent } from 'react';
import { STAGES, type Stage } from '@/lib/types';
import { useCrmContext } from '../CrmContext';
import { Icon } from '../Icons';
import { Scrim } from './Scrim';

export function ClientForm({ id, onClose, onSaved }: { id?: string; onClose(): void; onSaved(id: string): void }) {
  const { data, crm, ui } = useCrmContext();
  const existing = id ? data.clients.find((c) => c.id === id) : undefined;
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    company: existing?.company ?? '',
    email: existing?.email ?? '',
    phone: existing?.phone ?? '',
    value: existing ? String(existing.value) : '',
    status: (existing?.status ?? 'Lead') as Stage,
    notes: existing?.notes ?? '',
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.company.trim()) return;
    const saved = crm.saveClient({
      id: existing?.id,
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      value: Math.max(0, Number(form.value) || 0),
      status: form.status,
      notes: form.notes.trim(),
    });
    ui.toast(existing ? 'Changes saved' : `${saved.company} added`);
    onSaved(saved.id);
  };

  return (
    <Scrim onClose={onClose} variant="modal" label={existing ? 'Edit client' : 'New client'}>
      <form onSubmit={submit}>
        <div className="modal-head">
          <h2>{existing ? 'Edit client' : 'New client'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <p className="muted small">Fields marked * are required.</p>
        <div className="form-grid">
          <label>
            Contact name*
            <input className="field" required maxLength={120} value={form.name} onChange={set('name')} autoFocus />
          </label>
          <label>
            Company*
            <input className="field" required maxLength={160} value={form.company} onChange={set('company')} />
          </label>
          <label>
            Email
            <input className="field" type="email" value={form.email} onChange={set('email')} />
          </label>
          <label>
            Phone
            <input className="field" type="tel" value={form.phone} onChange={set('phone')} />
          </label>
          <label>
            Deal value (USD)
            <input className="field" type="number" min={0} step={100} inputMode="numeric" value={form.value} onChange={set('value')} />
          </label>
          <label>
            Stage
            <select className="field" value={form.status} onChange={set('status')}>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="full">
            Notes
            <textarea className="field" rows={3} value={form.notes} onChange={set('notes')} />
          </label>
        </div>
        <button className="btn block">{existing ? 'Save changes' : 'Save client'}</button>
      </form>
    </Scrim>
  );
}
