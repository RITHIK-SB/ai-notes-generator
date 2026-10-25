import type { NoteSettings } from '../api/client';

export interface SavedNote {
  id: string;
  title: string;
  originalContent: string;
  editedContent: string | null;
  createdAt: string;
  updatedAt: string;
  style: NoteSettings['style'];
  length: NoteSettings['length'];
  sourceFilename: string | null;
}

export interface AppSettings {
  defaultLength: NoteSettings['length'];
  defaultStyle: NoteSettings['style'];
  defaultDifficulty: NoteSettings['difficulty'];
  preferredExport: 'txt' | 'md' | 'pdf';
}
