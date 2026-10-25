import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Download, FileText, Pencil, Search, Trash2, X } from 'lucide-react';
import Alert from '../components/Alert';
import MarkdownView from '../components/MarkdownView';
import { downloadMd, downloadPdf, downloadTxt } from '../lib/export';
import { formatDateTime } from '../lib/format';
import { deleteNote, loadNotes, updateNote } from '../lib/storage';
import type { SavedNote } from '../lib/types';

const STYLE_LABELS: Record<SavedNote['style'], string> = {
  bullet_points: 'Bullet Points', headings: 'Headings & Subheadings',
  qa: 'Question & Answer', exam_revision: 'Exam Revision',
};

export default function SavedNotes() {
  const [notes, setNotes] = useState<SavedNote[]>(loadNotes);
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [open, setOpen] = useState<SavedNote | null>(null);
  const [openEdit, setOpenEdit] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => !q || n.title.toLowerCase().includes(q))
      .sort((a, b) => (sortAsc ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  }, [notes, query, sortAsc]);

  const remove = (note: SavedNote) => {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    setNotes(deleteNote(note.id));
    if (open?.id === note.id) setOpen(null);
    setFeedback('Note deleted.');
  };

  const download = (note: SavedNote, kind: 'txt' | 'md' | 'pdf') => {
    try {
      const fn = kind === 'txt' ? downloadTxt : kind === 'md' ? downloadMd : downloadPdf;
      const name = fn(note.title, note.editedContent ?? note.originalContent);
      setFeedback(`Downloaded ${name}`);
    } catch {
      setFeedback('The download failed. Please try a different format.');
    }
  };

  const saveEdit = () => {
    if (!open || openEdit === null) return;
    setNotes(updateNote(open.id, { editedContent: openEdit }));
    setOpen({ ...open, editedContent: openEdit, updatedAt: new Date().toISOString() });
    setFeedback('Edits saved.');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-primary-950">My Notes</h1>
      <p className="mt-1 text-sm text-gray-600">
        Saved notes live in this browser's local storage and stay on this device.
      </p>

      {feedback && (
        <div className="mt-4"><Alert kind="info" onDismiss={() => setFeedback(null)}>{feedback}</Alert></div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <label htmlFor="search" className="sr-only">Search notes by title</label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title..."
            className="input-field !pl-9"
          />
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setSortAsc((v) => !v)}
          aria-label={sortAsc ? 'Sort newest first' : 'Sort oldest first'}
        >
          {sortAsc ? <ArrowUpNarrowWide className="h-4 w-4" aria-hidden /> : <ArrowDownWideNarrow className="h-4 w-4" aria-hidden />}
          {sortAsc ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-300" aria-hidden />
          <p className="mt-3 text-sm text-gray-500">
            {notes.length === 0 ? 'No saved notes yet. Generate notes and press "Save Notes" to keep them here.' : 'No notes match your search.'}
          </p>
          {notes.length === 0 && (
            <Link to="/generate" className="btn-primary mt-4">Generate Notes</Link>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((note) => (
            <li key={note.id} className="card flex flex-col p-5">
              <button type="button" onClick={() => { setOpen(note); setOpenEdit(note.editedContent); }} className="text-left">
                <h2 className="truncate text-base font-semibold text-gray-900">{note.title}</h2>
              </button>
              <p className="mt-1 text-xs text-gray-500">
                {formatDateTime(note.createdAt)} - {STYLE_LABELS[note.style]}
                {note.sourceFilename ? ` - ${note.sourceFilename}` : ''}
                {note.editedContent !== null ? ' - edited' : ''}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                <button type="button" className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => { setOpen(note); setOpenEdit(note.editedContent); }}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Open
                </button>
                <button type="button" className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => download(note, 'md')}>
                  <Download className="h-3.5 w-3.5" aria-hidden /> .md
                </button>
                <button type="button" className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => download(note, 'pdf')}>
                  <Download className="h-3.5 w-3.5" aria-hidden /> .pdf
                </button>
                <button
                  type="button"
                  className="btn-secondary !px-2.5 !py-1.5 text-xs !text-red-600 hover:!bg-red-50"
                  onClick={() => remove(note)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Saved note: ${open.title}`}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-primary-950">{open.title}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Created {formatDateTime(open.createdAt)} - updated {formatDateTime(open.updatedAt)}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="mt-5">
              {openEdit !== null ? (
                <textarea
                  rows={16}
                  className="input-field resize-y font-mono text-[13px]"
                  value={openEdit}
                  onChange={(e) => setOpenEdit(e.target.value)}
                  aria-label="Edit saved note"
                />
              ) : (
                <MarkdownView content={open.editedContent ?? open.originalContent} />
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              {openEdit !== null ? (
                <>
                  <button type="button" className="btn-primary !px-3 !py-2 text-xs" onClick={saveEdit}>Save edits</button>
                  <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => setOpenEdit(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => setOpenEdit(open.editedContent ?? open.originalContent)}>
                    <Pencil className="h-4 w-4" aria-hidden /> Edit
                  </button>
                  <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => download(open, 'md')}>
                    <Download className="h-4 w-4" aria-hidden /> .md
                  </button>
                  <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => download(open, 'txt')}>
                    <Download className="h-4 w-4" aria-hidden /> .txt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
