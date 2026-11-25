'use client';
import type { ReactNode } from 'react';
import { SECTIONS, type Section } from '@/lib/types';
import { Icon } from './Icons';
import { CreatedBy } from './CreatedBy';
import { Logo } from './Logo';

interface Props {
  section: Section;
  onNavigate(s: Section): void;
  openTasks: number;
  mode: 'demo' | 'live';
  userEmail: string | null;
  menuOpen: boolean;
  setMenuOpen(open: boolean): void;
  onSearch(): void;
  onResetDemo?: () => void;
  onExit?: () => void;
  children: ReactNode;
}

export function Shell(p: Props) {
  return (
    <div className="app">
      <aside className={`sidebar ${p.menuOpen ? 'open' : ''}`}>
        <Logo />
        <div className="nav-label">Workspace</div>
        <nav aria-label="Main">
          {SECTIONS.map((s) => (
            <button
              key={s}
              className={`nav ${p.section === s ? 'on' : ''}`}
              aria-current={p.section === s ? 'page' : undefined}
              onClick={() => {
                p.onNavigate(s);
                p.setMenuOpen(false);
              }}
            >
              <Icon name={s} />
              <span>{s}</span>
              {s === 'Activities' && p.openTasks > 0 && <span className="count">{p.openTasks}</span>}
            </button>
          ))}
        </nav>
        <div className="side-card">
          {p.mode === 'demo' ? (
            <>
              <b>Demo workspace</b>
              Fictional sample data, saved only in this browser.
              {p.onResetDemo && (
                <button className="link" onClick={p.onResetDemo}>
                  Reset sample data
                </button>
              )}
              {p.onExit && (
                <button className="link" onClick={p.onExit}>
                  Sign in or create an account
                </button>
              )}
            </>
          ) : (
            <>
              <b>Signed in</b>
              <span className="truncate">{p.userEmail}</span>
              {p.onExit && (
                <button className="link with-icon" onClick={p.onExit}>
                  <Icon name="logout" size={14} /> Sign out
                </button>
              )}
            </>
          )}
        </div>
      </aside>
      {p.menuOpen && <div className="sidebar-backdrop" onClick={() => p.setMenuOpen(false)} />}

      <main>
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => p.setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={20} />
          </button>
          <button className="search" onClick={p.onSearch} aria-label="Search (Ctrl K)">
            <Icon name="search" size={17} />
            <span>Search clients, companies or tasks…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="topbar-right">
            {p.mode === 'demo' && <span className="tag">Demo workspace · fictional data</span>}
            <div className="avatar" title={p.userEmail ?? 'Demo user'}>
              {(p.userEmail ?? 'Demo')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="content">
          {p.children}
          <CreatedBy />
        </div>
      </main>
    </div>
  );
}
