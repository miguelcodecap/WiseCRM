'use client';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/useCopilot';
import { Icon } from '../Icons';
import { OwlMark } from '../Logo';
import { PageHeader } from '../ui';

const SUGGESTIONS = [
  'What should I prioritize today?',
  'What is my best deal?',
  'Which deals are at risk?',
  'How is my sales velocity calculated?',
];

interface Props {
  messages: ChatMessage[];
  pending: boolean;
  onAsk(question: string): void;
  onClear(): void;
}

export function Copilot({ messages, pending, onAsk, onClear }: Props) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, pending]);

  const submit = (q: string) => {
    if (!q.trim() || pending) return;
    onAsk(q);
    setInput('');
  };

  return (
    <>
      <PageHeader
        title="Wise Copilot"
        subtitle="Ask about your pipeline in plain English. Answers use only your CRM data."
        action={
          messages.length > 0 && (
            <button className="ghost" onClick={onClear}>
              New chat
            </button>
          )
        }
      />
      <section className="panel chat-panel">
        <div className="chat" aria-live="polite">
          {messages.length === 0 && (
            <div className="msg-line">
              <OwlMark size={32} />
              <div className="msg assistant">
                Hi! I can tell you what to prioritize, which deal has the highest expected value, which deals are going cold, or explain any
                metric.
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="msg user">
                {m.text}
              </div>
            ) : (
              <div key={i} className="msg-line">
                <OwlMark size={32} />
                <div className="msg assistant">
                  {m.text}
                  {m.source && <span className="msg-source">{m.source === 'ai' ? 'AI answer' : 'Built-in rules'}</span>}
                </div>
              </div>
            ),
          )}
          {pending && (
            <div className="msg-line">
              <OwlMark size={32} />
              <div className="msg assistant typing" aria-label="Copilot is thinking">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => submit(s)} disabled={pending}>
              {s}
            </button>
          ))}
        </div>
        <form
          className="ask"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <input
            className="field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your deals…"
            aria-label="Ask Copilot"
            maxLength={500}
          />
          <button className="btn" disabled={pending || !input.trim()} aria-label="Send">
            <Icon name="send" size={16} />
            <span className="hide-sm">Send</span>
          </button>
        </form>
      </section>
    </>
  );
}
