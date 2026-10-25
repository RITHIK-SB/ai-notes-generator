import type { AppSettings, SavedNote } from './types';

const NOTES_KEY = 'ai-notes-generator:notes';
const SETTINGS_KEY = 'ai-notes-generator:settings';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultLength: 'medium',
  defaultStyle: 'bullet_points',
  defaultDifficulty: 'intermediate',
  preferredExport: 'md',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadNotes(): SavedNote[] {
  const notes = readJson<SavedNote[]>(NOTES_KEY, []);
  return Array.isArray(notes) ? notes : [];
}

export function saveNotes(notes: SavedNote[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function addNote(note: SavedNote): SavedNote[] {
  const notes = [note, ...loadNotes()];
  saveNotes(notes);
  return notes;
}

export function updateNote(id: string, patch: Partial<SavedNote>): SavedNote[] {
  const notes = loadNotes().map((n) =>
    n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
  );
  saveNotes(notes);
  return notes;
}

export function deleteNote(id: string): SavedNote[] {
  const notes = loadNotes().filter((n) => n.id !== id);
  saveNotes(notes);
  return notes;
}

export function clearNotes(): void {
  localStorage.removeItem(NOTES_KEY);
}

export function loadSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
