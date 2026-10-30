import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../store';

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tasks', label: 'Tasks & Checklist' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/events', label: 'Events & Rituals' },
  { to: '/shopping', label: 'Shopping List' },
  { to: '/family', label: 'Family & Clothing' },
  { to: '/gifts', label: 'Gifts & Bhaat' },
  { to: '/guests', label: 'Guests & Invitations' },
  { to: '/budget', label: 'Budget & Expenses' },
  { to: '/media', label: 'Cards, Photos & Videos' },
];

export function Layout() {
  const { saveError, loadError } = useStore();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="app">
      <div className={open ? 'scrim show' : 'scrim'} onClick={() => setOpen(false)} />
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <p className="brand-mark">ShaadiSaathi</p>
          <p className="brand-sub">Indian Wedding Planner</p>
        </div>
        <nav aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-note">
          Saved on this device only. Nothing is sent to a server, and invitations are not sent from here.
        </p>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" type="button" aria-label="Open menu" onClick={() => setOpen(true)}>
            Menu
          </button>
          <p className="topbar-title">ShaadiSaathi</p>
        </header>
        {(saveError || loadError) && (
          <div className="banner banner-warn" role="status">
            {saveError || loadError}
          </div>
        )}
        <div className="banner">
          Local demo mode. Your wedding plan stays in this browser and survives a refresh. It is not stored in a database.
        </div>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
