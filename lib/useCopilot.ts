'use client';
import { useCallback, useState } from 'react';
import { buildContext, ruleBasedAnswer } from './copilot';
import type { CrmData } from './types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  source?: 'ai' | 'rules';
}

/** Asks the AI endpoint; falls back to local rules when it is not configured or fails. */
export function useCopilot(getData: () => CrmData | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      const data = getData();
      if (!q || !data) return;
      setMessages((m) => [...m, { role: 'user', text: q }]);
      setPending(true);
      let reply: ChatMessage;
      try {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ question: q, context: buildContext(data) }),
        });
        const json = (await res.json().catch(() => ({}))) as { answer?: string };
        reply = res.ok && json.answer
          ? { role: 'assistant', text: json.answer, source: 'ai' }
          : { role: 'assistant', text: ruleBasedAnswer(q, data), source: 'rules' };
      } catch {
        reply = { role: 'assistant', text: ruleBasedAnswer(q, data), source: 'rules' };
      }
      setMessages((m) => [...m, reply]);
      setPending(false);
    },
    [getData],
  );

  return { messages, pending, ask, clear: () => setMessages([]) };
}
