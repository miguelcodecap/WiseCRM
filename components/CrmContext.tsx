'use client';
import { createContext, useContext } from 'react';
import type { Crm } from '@/lib/useCrm';
import type { CrmData, Section } from '@/lib/types';

export interface Ui {
  go(section: Section): void;
  openClient(id: string): void;
  openHelp(topic: string): void;
  editClient(id?: string): void;
  newTask(clientId?: string): void;
  toast(message: string, undo?: () => void): void;
  askCopilot(question: string): void;
}

export interface CrmContextValue {
  crm: Crm;
  data: CrmData;
  ui: Ui;
  mode: 'demo' | 'live';
}

export const CrmContext = createContext<CrmContextValue | null>(null);

export function useCrmContext() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrmContext must be used inside <CrmContext.Provider>');
  return ctx;
}
