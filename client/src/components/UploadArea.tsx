import { useRef, useState } from 'react';
import { FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { formatBytes } from '../lib/format';

const ACCEPT = ['.pdf', '.docx', '.txt'];

export interface UploadedFile {
  file: File;
  status: 'ready' | 'extracting' | 'extracted' | 'error';
  message?: string;
}

export default function UploadArea({
  uploaded,
  onSelect,
  onRemove,
  maxFileMb,
  disabled,
}: {
  uploaded: UploadedFile | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  maxFileMb: number;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rejectMsg, setRejectMsg] = useState<string | null>(null);

  const validateAndSelect = (file: File) => {
    setRejectMsg(null);
    const lower = file.name.toLowerCase();
    if (!ACCEPT.some((ext) => lower.endsWith(ext))) {
      setRejectMsg('Unsupported file format. Upload a PDF, DOCX, or TXT file.');
      return;
    }
    if (file.size > maxFileMb * 1024 * 1024) {
      setRejectMsg(`The file exceeds the ${maxFileMb} MB size limit.`);
      return;
    }
    onSelect(file);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a document: PDF, DOCX or TXT"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          if (file) validateAndSelect(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <UploadCloud className="h-8 w-8 text-primary-500" aria-hidden />
        <p className="mt-2 text-sm font-medium text-gray-700">
          Drag and drop a document here, or <span className="text-primary-600 underline">browse</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">PDF, DOCX, or TXT - up to {maxFileMb} MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndSelect(file);
            e.target.value = '';
          }}
        />
      </div>

      {rejectMsg && (
        <p role="alert" className="mt-2 text-sm text-red-600">{rejectMsg}</p>
      )}

      {uploaded && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{uploaded.file.name}</p>
            <p className="text-xs text-gray-500">
              {formatBytes(uploaded.file.size)}
              {uploaded.status === 'extracting' && ' - extracting text...'}
              {uploaded.status === 'extracted' && ` - ${uploaded.message ?? 'text extracted'}`}
              {uploaded.status === 'ready' && ' - ready'}
              {uploaded.status === 'error' && ' - extraction failed'}
            </p>
          </div>
          {uploaded.status === 'extracting' && (
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden />
          )}
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
