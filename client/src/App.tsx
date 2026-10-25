import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Generate from './pages/Generate';
import SavedNotes from './pages/SavedNotes';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/notes" element={<SavedNotes />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <footer className="border-t border-gray-200 bg-white py-6">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs text-gray-500">
          AI Notes Generator - your study material is sent to the configured AI provider only when you generate notes. Saved notes stay in this browser.
        </p>
      </footer>
    </div>
  );
}
