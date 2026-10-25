import type { NoteSettings } from '../api/client';

const LENGTHS: { value: NoteSettings['length']; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'detailed', label: 'Detailed' },
];
const STYLES: { value: NoteSettings['style']; label: string }[] = [
  { value: 'bullet_points', label: 'Bullet Points' },
  { value: 'headings', label: 'Headings & Subheadings' },
  { value: 'qa', label: 'Question & Answer' },
  { value: 'exam_revision', label: 'Exam Revision Notes' },
];
const DIFFICULTIES: { value: NoteSettings['difficulty']; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

function OptionGroup<T extends string>({
  legend, options, value, onChange, name,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-700">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition ${
              value === opt.value
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function ConfigPanel({
  settings,
  onChange,
  disabled,
}: {
  settings: NoteSettings;
  onChange: (s: NoteSettings) => void;
  disabled: boolean;
}) {
  return (
    <section className="card p-5" aria-labelledby="config-heading">
      <h2 id="config-heading" className="text-base font-bold text-gray-900">
        Note configuration
      </h2>
      <div className="mt-4 space-y-5">
        <OptionGroup legend="Note length" name="length" options={LENGTHS} value={settings.length}
          onChange={(v) => onChange({ ...settings, length: v })} />
        <OptionGroup legend="Note style" name="style" options={STYLES} value={settings.style}
          onChange={(v) => onChange({ ...settings, style: v })} />
        <OptionGroup legend="Difficulty level" name="difficulty" options={DIFFICULTIES} value={settings.difficulty}
          onChange={(v) => onChange({ ...settings, difficulty: v })} />
        <div>
          <label htmlFor="instructions" className="text-sm font-semibold text-gray-700">
            Additional instructions <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="instructions"
            rows={3}
            maxLength={1000}
            disabled={disabled}
            value={settings.instructions}
            onChange={(e) => onChange({ ...settings, instructions: e.target.value })}
            placeholder="e.g. Focus on definitions, include important formulas, highlight key concepts..."
            className="input-field mt-2 resize-y"
          />
        </div>
      </div>
    </section>
  );
}
