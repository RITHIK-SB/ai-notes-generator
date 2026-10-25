import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type Kind = 'error' | 'success' | 'info';

const styles: Record<Kind, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-primary-200 bg-primary-50 text-primary-800',
};

const icons: Record<Kind, typeof Info> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export default function Alert({
  kind,
  children,
  onDismiss,
}: {
  kind: Kind;
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const Icon = icons[kind];
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[kind]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded p-0.5 hover:bg-black/5">
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
