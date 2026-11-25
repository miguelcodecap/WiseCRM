'use client';
import { HELP } from '@/lib/help';
import { Icon } from '../Icons';
import { Scrim } from './Scrim';

export function HelpDrawer({ topic, onClose }: { topic: string; onClose(): void }) {
  return (
    <Scrim onClose={onClose} variant="drawer" label={`About ${topic}`}>
      <div className="drawer-head">
        <span className="eyebrow">How it works</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>
      <h1 className="drawer-title">{topic}</h1>
      <p className="lead">{HELP[topic] ?? 'This feature helps you keep your sales work organized.'}</p>
      <div className="tip">
        <b>Why it matters</b>
        Good decisions need trustworthy numbers. Keep deal stages and values up to date and every metric in WiseCRM stays accurate.
      </div>
      <button className="btn" onClick={onClose}>
        Got it
      </button>
    </Scrim>
  );
}
