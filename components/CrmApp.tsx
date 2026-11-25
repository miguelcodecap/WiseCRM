'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DemoRepo, ensureOrganization, SupabaseRepo, type Repo } from '@/lib/repo';
import { supabase } from '@/lib/supabase';
import { SECTIONS, type Section } from '@/lib/types';
import { useCopilot } from '@/lib/useCopilot';
import { useCrm } from '@/lib/useCrm';
import { AuthScreen } from './AuthScreen';
import { CrmContext, type Ui } from './CrmContext';
import { ClientDrawer } from './overlays/ClientDrawer';
import { ClientForm } from './overlays/ClientForm';
import { CommandPalette } from './overlays/CommandPalette';
import { HelpDrawer } from './overlays/HelpDrawer';
import { TaskForm } from './overlays/TaskForm';
import { Shell } from './Shell';
import { Toast, type ToastState } from './Toast';
import { Activities } from './views/Activities';
import { Clients } from './views/Clients';
import { Copilot } from './views/Copilot';
import { Dashboard } from './views/Dashboard';
import { Pipeline } from './views/Pipeline';
import { Reports } from './views/Reports';

type Overlay =
  | { kind: 'client'; id: string }
  | { kind: 'clientForm'; id?: string }
  | { kind: 'taskForm'; clientId?: string }
  | { kind: 'help'; topic: string }
  | { kind: 'palette' }
  | null;

type Phase = 'loading' | 'auth' | 'app';

const sectionFromHash = (): Section => {
  const h = typeof window === 'undefined' ? '' : window.location.hash.slice(1).toLowerCase();
  return SECTIONS.find((s) => s.toLowerCase() === h) ?? 'Dashboard';
};

export default function CrmApp() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [repo, setRepo] = useState<Repo | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const startingFor = useRef<string | null>(null);

  const crm = useCrm(repo);
  const dataRef = useRef(crm.data);
  dataRef.current = crm.data;
  const copilot = useCopilot(useCallback(() => dataRef.current, []));

  const [section, setSection] = useState<Section>('Dashboard');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* ---------------------------------------------------------- session ---- */

  const startDemo = useCallback(() => {
    setRepo(new DemoRepo());
    setUserEmail(null);
    setPhase('app');
  }, []);

  const startLive = useCallback(async (user: { id: string; email?: string | null }) => {
    if (!supabase || startingFor.current === user.id) return;
    startingFor.current = user.id;
    try {
      const orgId = await ensureOrganization(supabase, `${user.email?.split('@')[0] ?? 'My'}'s workspace`);
      setRepo(new SupabaseRepo(supabase, orgId));
      setUserEmail(user.email ?? null);
      setPhase('app');
    } catch (e) {
      startingFor.current = null;
      setBootError(e instanceof Error ? e.message : 'Could not open your workspace');
      setPhase('auth');
    }
  }, []);

  useEffect(() => {
    setSection(sectionFromHash());
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener('hashchange', onHash);

    // "?demo" in the URL opens the sandbox directly: handy for portfolio links.
    const wantsDemo = new URLSearchParams(window.location.search).has('demo');
    if (!supabase) {
      startDemo();
      return () => window.removeEventListener('hashchange', onHash);
    }

    if (wantsDemo) startDemo();
    else
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) void startLive(data.session.user);
        else setPhase('auth');
      });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) void startLive(session.user);
      if (event === 'SIGNED_OUT') {
        startingFor.current = null;
        setRepo(null);
        setPhase('auth');
      }
    });
    return () => {
      window.removeEventListener('hashchange', onHash);
      sub.subscription.unsubscribe();
    };
  }, [startDemo, startLive]);

  const exit = async () => {
    copilot.clear();
    setOverlay(null);
    if (repo?.kind === 'live' && supabase) await supabase.auth.signOut();
    else {
      setRepo(null);
      setPhase('auth');
    }
  };

  /* --------------------------------------------------------------- ui ---- */

  const go = useCallback((s: Section) => {
    setOverlay(null);
    setSection(s);
    if (window.location.hash.slice(1) !== s.toLowerCase()) history.replaceState(null, '', `#${s.toLowerCase()}`);
    window.scrollTo(0, 0);
  }, []);

  const ask = copilot.ask;
  const ui = useMemo<Ui>(
    () => ({
      go,
      openClient: (id) => setOverlay({ kind: 'client', id }),
      openHelp: (topic) => setOverlay({ kind: 'help', topic }),
      editClient: (id) => setOverlay({ kind: 'clientForm', id }),
      newTask: (clientId) => setOverlay({ kind: 'taskForm', clientId }),
      toast: (message, undo) => setToast({ id: Date.now(), message, undo }),
      askCopilot: (q) => {
        go('Copilot');
        void ask(q);
      },
    }),
    [go, ask],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (phase === 'app') setOverlay({ kind: 'palette' });
      } else if (e.key === 'Escape') {
        setOverlay(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const closeToast = useCallback(() => setToast(null), []);

  /* ----------------------------------------------------------- render ---- */

  if (phase === 'auth')
    return (
      <>
        {bootError && <div className="banner error">{bootError}</div>}
        <AuthScreen onDemo={startDemo} />
      </>
    );

  if (phase === 'loading' || !crm.data) {
    return (
      <div className="loading" aria-busy="true">
        <div className="spinner" />
        {crm.error && <p className="muted">{crm.error}</p>}
      </div>
    );
  }

  const data = crm.data;
  const mode = repo?.kind ?? 'demo';
  const views: Record<Section, ReactNode> = {
    Dashboard: <Dashboard />,
    Clients: <Clients />,
    Pipeline: <Pipeline />,
    Activities: <Activities />,
    Reports: <Reports />,
    Copilot: <Copilot messages={copilot.messages} pending={copilot.pending} onAsk={copilot.ask} onClear={copilot.clear} />,
  };

  return (
    <CrmContext.Provider value={{ crm, data, ui, mode }}>
      <Shell
        section={section}
        onNavigate={go}
        openTasks={data.tasks.filter((t) => !t.done).length}
        mode={mode}
        userEmail={userEmail}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onSearch={() => setOverlay({ kind: 'palette' })}
        onResetDemo={
          repo instanceof DemoRepo
            ? () => {
                crm.setData(repo.reset());
                copilot.clear();
                ui.toast('Sample data restored');
              }
            : undefined
        }
        onExit={supabase ? exit : undefined}
      >
        {crm.error && (
          <div className="banner error" role="alert">
            {crm.error}
            <button className="link" onClick={crm.clearError}>
              Dismiss
            </button>
          </div>
        )}
        {views[section]}
      </Shell>

      {overlay?.kind === 'client' && <ClientDrawer id={overlay.id} onClose={() => setOverlay(null)} />}
      {overlay?.kind === 'clientForm' && (
        <ClientForm
          id={overlay.id}
          onClose={() => setOverlay(overlay.id ? { kind: 'client', id: overlay.id } : null)}
          onSaved={(id) => setOverlay({ kind: 'client', id })}
        />
      )}
      {overlay?.kind === 'taskForm' && (
        <TaskForm
          clientId={overlay.clientId}
          onClose={() => setOverlay(overlay.clientId ? { kind: 'client', id: overlay.clientId } : null)}
        />
      )}
      {overlay?.kind === 'help' && <HelpDrawer topic={overlay.topic} onClose={() => setOverlay(null)} />}
      {overlay?.kind === 'palette' && <CommandPalette onClose={() => setOverlay(null)} />}
      <Toast toast={toast} onDone={closeToast} />
    </CrmContext.Provider>
  );
}
