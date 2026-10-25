import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BookOpenText, Menu, X } from 'lucide-react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/generate', label: 'Generate Notes' },
  { to: '/notes', label: 'My Notes' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-primary-800">
          <BookOpenText className="h-6 w-6 text-primary-600" aria-hidden />
          <span className="text-lg">AI Notes Generator</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/generate" className="btn-primary ml-3">
            Start Generating
          </Link>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/generate" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
            Start Generating
          </Link>
        </div>
      )}
    </header>
  );
}
