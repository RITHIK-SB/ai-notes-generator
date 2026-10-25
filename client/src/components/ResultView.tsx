import { useState } from 'react';
import { Check, Copy, Download, Pencil, RefreshCw, Save } from 'lucide-react';
import type { GenerateMeta, GeneratedNotes, NoteSettings } from '../api/client';
import { downloadMd, downloadPdf, downloadTxt } from '../lib/export';
import { formatDateTime } from '../lib/format';
import MarkdownView from './MarkdownView';
import Alert from './Alert';

const STYLE_LABELS: Record<NoteSettings['style'], string> = {
  bullet_points: 'Bullet Points',
  headings: 'Headings & Subheadings',
  qa: 'Question & Answer',
  exam_revision: 'Exam Revision',
};
const LENGTH_LABELS: Record<NoteSettings['length'], string> = {
  short: 'Short', medium: 'Medium', detailed: 'Detailed',
};

export default function ResultView({
  notes, meta, settings, generatedAt, edited, onEditChange, onRegenerate, onSave, saved,
}: {
  notes: GeneratedNotes;
  meta: GenerateMeta;
  settings: NoteSettings;
  generatedAt: string;
  edited: string | null;
  onEditChange: (v: string | null) => void;
  onRegenerate: () => void;
  onSave: () => void;
  saved: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const displayContent = edited ?? notes.content;
  const hasEdits = edited !== null && edited !== notes.content;

  const copyNotes = async () => {
    try {
      await navigator.clipboard.writeText(`# ${notes.title}\n\n${displayContent}`);
      setFeedback({ kind: 'success', text: 'Notes copied to clipboard.' });
    } catch {
      setFeedback({ kind: 'error', text: 'Copy failed. Your browser may have blocked clipboard access - select the text and copy manually.' });
    }
  };

  const doDownload = (kind: 'txt' | 'md' | 'pdf') => {
    try {
      const fn = kind === 'txt' ? downloadTxt : kind === 'md' ? downloadMd : downloadPdf;
      const name = fn(notes.title, displayContent);
      setFeedback({ kind: 'success', text: `Downloaded ${name}` });
    } catch {
      setFeedback({ kind: 'error', text: 'The download failed. Please try a different format.' });
    }
  };

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="result-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="result-heading" className="text-xl font-bold text-primary-950">{notes.title}</h2>
          <p className="mt-1 text-xs text-gray-500">
            Generated {formatDateTime(generatedAt)} - {STYLE_LABELS[settings.style]} - {LENGTH_LABELS[settings.length]}
            {meta.model ? ` - ${meta.model}` : ''}
            {meta.chunked ? ` - processed in ${meta.chunks} parts` : ''}
            {hasEdits ? ' - edited by you' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={copyNotes}>
            <Copy className="h-4 w-4" aria-hidden /> Copy Notes
          </button>
          <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => doDownload('md')}>
            <Download className="h-4 w-4" aria-hidden /> .md
          </button>
          <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => doDownload('txt')}>
            <Download className="h-4 w-4" aria-hidden /> .txt
          </button>
          <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => doDownload('pdf')}>
            <Download className="h-4 w-4" aria-hidden /> .pdf
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mt-4">
          <Alert kind={feedback.kind} onDismiss={() => setFeedback(null)}>{feedback.text}</Alert>
        </div>
      )}

      <div className="mt-5">
        {editing ? (
          <div>
            <label htmlFor="notes-editor" className="text-sm font-semibold text-gray-700">
              Edit notes (Markdown)
            </label>
            <textarea
              id="notes-editor"
              rows={18}
              className="input-field mt-2 resize-y font-mono text-[13px]"
              value={displayContent}
              onChange={(e) => onEditChange(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary !px-3 !py-2 text-xs" onClick={() => setEditing(false)}>
                <Check className="h-4 w-4" aria-hidden /> Done editing
              </button>
              {hasEdits && (
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-2 text-xs"
                  onClick={() => {
                    if (window.confirm('Discard your edits and restore the original AI-generated notes?')) {
                      onEditChange(null);
                      setEditing(false);
                    }
                  }}
                >
                  Revert to original
                </button>
              )}
            </div>
          </div>
        ) : (
          <MarkdownView content={displayContent} />
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          className="btn-secondary !px-3 !py-2 text-xs"
          onClick={() => {
            if (hasEdits && !window.confirm('Regenerating will keep your edits on screen, but the new AI output will replace the original. Continue?')) return;
            onRegenerate();
          }}
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> Generate Again
        </button>
        <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => setEditing((v) => !v)}>
          <Pencil className="h-4 w-4" aria-hidden /> {editing ? 'Preview' : 'Edit Notes'}
        </button>
        <button type="button" className="btn-primary !px-3 !py-2 text-xs" onClick={onSave} disabled={saved}>
          <Save className="h-4 w-4" aria-hidden /> {saved ? 'Saved' : 'Save Notes'}
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Saved notes are stored in this browser's local storage. They stay on this device and are lost if browser data is cleared.
      </p>
    </section>
  );
}
