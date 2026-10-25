import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import {
  ApiError, extractFile, generateNotes, getConfigStatus,
  type ConfigStatus, type GenerateMeta, type GeneratedNotes, type NoteSettings,
} from '../api/client';
import Alert from '../components/Alert';
import ConfigPanel from '../components/ConfigPanel';
import ResultView from '../components/ResultView';
import UploadArea, { type UploadedFile } from '../components/UploadArea';
import { loadSettings, addNote } from '../lib/storage';

type Tab = 'paste' | 'upload';

export default function Generate() {
  const defaults = useMemo(loadSettings, []);
  const [tab, setTab] = useState<Tab>('paste');
  const [text, setText] = useState('');
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [sourceFilename, setSourceFilename] = useState<string | null>(null);
  const [settings, setSettings] = useState<NoteSettings>({
    length: defaults.defaultLength,
    style: defaults.defaultStyle,
    difficulty: defaults.defaultDifficulty,
    instructions: '',
  });
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    notes: GeneratedNotes; meta: GenerateMeta; generatedAt: string;
  } | null>(null);
  const [edited, setEdited] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getConfigStatus().then(setConfigStatus).catch(() => setConfigStatus(null));
  }, []);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  const minChars = configStatus?.limits.minInputChars ?? 50;
  const maxFileMb = configStatus?.limits.maxFileMb ?? 10;
  const charCount = text.length;

  const handleFile = async (file: File) => {
    setError(null);
    setUploaded({ file, status: 'extracting' });
    try {
      const res = await extractFile(file);
      setText(res.text);
      setSourceFilename(file.name);
      setUploaded({
        file, status: 'extracted',
        message: `text extracted${res.pages ? ` from ${res.pages} page${res.pages === 1 ? '' : 's'}` : ''} (${res.text.length.toLocaleString()} characters)`,
      });
    } catch (err) {
      setUploaded({ file, status: 'error', message: err instanceof ApiError ? err.message : undefined });
      setError(err instanceof ApiError ? err.message : 'Text extraction failed. Try pasting the text instead.');
    }
  };

  const removeFile = () => {
    setUploaded(null);
    setSourceFilename(null);
    setText('');
  };

  const canGenerate =
    !generating &&
    charCount >= minChars &&
    uploaded?.status !== 'extracting';

  const runGeneration = async () => {
    setError(null);
    if (charCount === 0) {
      setError('No input provided. Paste your study material or upload a document first.');
      return;
    }
    if (charCount < minChars) {
      setError(`Please provide at least ${minChars} characters of study material.`);
      return;
    }
    setGenerating(true);
    try {
      const res = await generateNotes(text, settings);
      setResult({ notes: res.notes, meta: res.meta, generatedAt: new Date().toISOString() });
      setEdited(null);
      setSaved(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const saveCurrent = () => {
    if (!result) return;
    try {
      addNote({
        id: crypto.randomUUID(),
        title: result.notes.title,
        originalContent: result.notes.content,
        editedContent: edited,
        createdAt: result.generatedAt,
        updatedAt: new Date().toISOString(),
        style: settings.style,
        length: settings.length,
        sourceFilename,
      });
      setSaved(true);
    } catch {
      setError('Saving the note failed. Your browser storage may be full or disabled.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-primary-950">Generate Notes</h1>
      <p className="mt-1 text-sm text-gray-600">
        Paste your study material or upload a document, choose your settings, and generate.
      </p>

      {configStatus && !configStatus.aiConfigured && (
        <div className="mt-4">
          <Alert kind="info">
            <strong>AI provider not configured.</strong> The app is fully built, but note generation needs an API key on the server.
            Set <code className="rounded bg-white/70 px-1">AI_API_KEY</code> (and optionally <code className="rounded bg-white/70 px-1">AI_PROVIDER</code> and <code className="rounded bg-white/70 px-1">AI_MODEL</code>) in <code className="rounded bg-white/70 px-1">server/.env</code> - see <code className="rounded bg-white/70 px-1">server/.env.example</code> - then restart the server. Everything else works today.
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5" aria-labelledby="input-heading">
            <div className="flex items-center justify-between">
              <h2 id="input-heading" className="text-base font-bold text-gray-900">Study material</h2>
              <div role="tablist" aria-label="Input method" className="flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
                {(['paste', 'upload'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 transition ${tab === t ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t === 'paste' ? 'Paste Text' : 'Upload Document'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {tab === 'paste' ? (
                <div>
                  <label htmlFor="material" className="sr-only">Paste your study material</label>
                  <textarea
                    id="material"
                    rows={12}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setSourceFilename(null);
                    }}
                    placeholder="Paste your study material here..."
                    className="input-field resize-y"
                    disabled={generating}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span aria-live="polite">
                      {charCount.toLocaleString()} characters
                      {charCount > 0 && charCount < minChars ? ` - at least ${minChars} needed` : ''}
                    </span>
                    <button
                      type="button"
                      className="font-medium text-primary-600 hover:text-primary-700 disabled:opacity-40"
                      onClick={() => { setText(''); setSourceFilename(null); }}
                      disabled={charCount === 0 || generating}
                    >
                      Clear text
                    </button>
                  </div>
                </div>
              ) : (
                <UploadArea
                  uploaded={uploaded}
                  onSelect={handleFile}
                  onRemove={removeFile}
                  maxFileMb={maxFileMb}
                  disabled={generating}
                />
              )}
              {tab === 'upload' && uploaded?.status === 'extracted' && (
                <p className="mt-2 text-xs text-gray-500">
                  Extracted text is loaded. Switch to <button type="button" className="font-medium text-primary-600 underline" onClick={() => setTab('paste')}>Paste Text</button> to review it before generating.
                </p>
              )}
            </div>
          </section>

          {error && <Alert kind="error" onDismiss={() => setError(null)}>{error}</Alert>}

          <button
            type="button"
            className="btn-primary w-full !py-3.5 text-base"
            disabled={!canGenerate}
            onClick={runGeneration}
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Analyzing your study material...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden />
                Generate My Notes
              </>
            )}
          </button>
          <div aria-live="polite" className="sr-only">
            {generating ? 'Analyzing your study material...' : ''}
          </div>
        </div>

        <div className="space-y-6">
          <ConfigPanel settings={settings} onChange={setSettings} disabled={generating} />
          <section className="card p-5 text-sm text-gray-600">
            <h2 className="text-base font-bold text-gray-900">Privacy note</h2>
            <p className="mt-2">
              When you generate notes, your study material is sent to the configured AI provider
              ({configStatus?.provider === 'anthropic' ? 'Anthropic' : 'the configured OpenAI-compatible API'}).
              Uploaded documents are processed in memory and never stored on the server.
            </p>
          </section>
        </div>
      </div>

      {result && (
        <div ref={resultRef} className="mt-8">
          <ResultView
            notes={result.notes}
            meta={result.meta}
            settings={settings}
            generatedAt={result.generatedAt}
            edited={edited}
            onEditChange={setEdited}
            onRegenerate={runGeneration}
            onSave={saveCurrent}
            saved={saved}
          />
          <p className="mt-4 text-center text-sm text-gray-500">
            View your saved notes on the <Link to="/notes" className="font-medium text-primary-600 underline">My Notes</Link> page.
          </p>
        </div>
      )}
    </div>
  );
}
