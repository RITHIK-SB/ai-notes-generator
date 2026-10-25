import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getConfigStatus, type ConfigStatus } from '../api/client';
import Alert from '../components/Alert';
import { clearNotes, loadSettings, saveSettings } from '../lib/storage';
import type { AppSettings } from '../lib/types';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    getConfigStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    setFeedback({ kind: 'success', text: 'Settings saved. They apply the next time you open the generator.' });
  };

  const clearHistory = () => {
    if (!window.confirm('Delete ALL saved notes from this browser? This cannot be undone.')) return;
    clearNotes();
    setFeedback({ kind: 'info', text: 'Local note history cleared.' });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-primary-950">Settings</h1>

      {feedback && (
        <div className="mt-4"><Alert kind={feedback.kind} onDismiss={() => setFeedback(null)}>{feedback.text}</Alert></div>
      )}

      <section className="card mt-6 p-5" aria-labelledby="defaults-heading">
        <h2 id="defaults-heading" className="text-base font-bold text-gray-900">Generation defaults</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="def-length" className="text-sm font-semibold text-gray-700">Default note length</label>
            <select id="def-length" className="input-field mt-1.5" value={settings.defaultLength}
              onChange={(e) => update('defaultLength', e.target.value as AppSettings['defaultLength'])}>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
          <div>
            <label htmlFor="def-style" className="text-sm font-semibold text-gray-700">Default note style</label>
            <select id="def-style" className="input-field mt-1.5" value={settings.defaultStyle}
              onChange={(e) => update('defaultStyle', e.target.value as AppSettings['defaultStyle'])}>
              <option value="bullet_points">Bullet Points</option>
              <option value="headings">Headings & Subheadings</option>
              <option value="qa">Question & Answer</option>
              <option value="exam_revision">Exam Revision Notes</option>
            </select>
          </div>
          <div>
            <label htmlFor="def-difficulty" className="text-sm font-semibold text-gray-700">Default difficulty level</label>
            <select id="def-difficulty" className="input-field mt-1.5" value={settings.defaultDifficulty}
              onChange={(e) => update('defaultDifficulty', e.target.value as AppSettings['defaultDifficulty'])}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label htmlFor="def-export" className="text-sm font-semibold text-gray-700">Preferred export format</label>
            <select id="def-export" className="input-field mt-1.5" value={settings.preferredExport}
              onChange={(e) => update('preferredExport', e.target.value as AppSettings['preferredExport'])}>
              <option value="md">Markdown (.md)</option>
              <option value="txt">Plain text (.txt)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card mt-6 p-5" aria-labelledby="ai-heading">
        <h2 id="ai-heading" className="text-base font-bold text-gray-900">AI provider status</h2>
        {status ? (
          <div className="mt-3 text-sm text-gray-600">
            {status.aiConfigured ? (
              <p>
                Configured - provider: <strong>{status.provider}</strong>, model: <strong>{status.model}</strong>.
              </p>
            ) : (
              <p>
                Not configured. Set <code className="rounded bg-gray-100 px-1">AI_API_KEY</code> in <code className="rounded bg-gray-100 px-1">server/.env</code> (see <code className="rounded bg-gray-100 px-1">server/.env.example</code>) and restart the server to enable generation.
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Limits: {status.limits.maxFileMb} MB max file, {status.limits.minInputChars} characters minimum input, {status.limits.maxTotalChars.toLocaleString()} characters maximum input.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-600">Could not reach the server to read the provider status. Make sure the backend is running.</p>
        )}
      </section>

      <section className="card mt-6 p-5" aria-labelledby="storage-heading">
        <h2 id="storage-heading" className="text-base font-bold text-gray-900">Local storage</h2>
        <p className="mt-2 text-sm text-gray-600">
          Saved notes and settings are stored in this browser only. Clearing browser data removes them.
        </p>
        <button type="button" className="btn-secondary mt-4 !text-red-600 hover:!bg-red-50" onClick={clearHistory}>
          <Trash2 className="h-4 w-4" aria-hidden /> Clear local history
        </button>
      </section>
    </div>
  );
}
