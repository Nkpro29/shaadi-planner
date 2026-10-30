import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type InputHTMLAttributes,
} from 'react';

type Ask = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
};

const ConfirmContext = createContext<{ ask: (ask: Ask) => void } | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [ask, setAsk] = useState<Ask | null>(null);
  return (
    <ConfirmContext.Provider value={{ ask: setAsk }}>
      {children}
      {ask && (
        <div className="modal-back" role="presentation" onMouseDown={() => { ask.resolve(false); setAsk(null); }}>
          <div
            className="modal modal-narrow"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-body">
              <h2 id="confirm-title">{ask.title}</h2>
              <p className="muted">{ask.message}</p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" type="button" onClick={() => { ask.resolve(false); setAsk(null); }}>
                Cancel
              </button>
              <button
                className={ask.danger ? 'btn btn-danger' : 'btn btn-primary'}
                type="button"
                onClick={() => { ask.resolve(true); setAsk(null); }}
              >
                {ask.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return (options: Omit<Ask, 'resolve'>) =>
    new Promise<boolean>((resolve) => ctx.ask({ ...options, resolve }));
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="modal-back" role="presentation" onMouseDown={onClose}>
      <div
        className={wide ? 'modal modal-wide' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
      {hint && <small className="hint">{hint}</small>}
    </label>
  );
}

const FieldIdContext = createContext<string | undefined>(undefined);

function useFieldId(id?: string) {
  const fromContext = useContext(FieldIdContext);
  return id ?? fromContext;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const id = useFieldId(props.id);
  return <input id={id} {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useFieldId(props.id);
  return <textarea id={id} rows={props.rows ?? 3} {...props} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useFieldId(props.id);
  return <select id={id} {...props} />;
}

export function PageHeader({
  title,
  lede,
  actions,
}: {
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}

export function DemoBadge({ show }: { show?: boolean }) {
  if (!show) return null;
  return <span className="badge badge-demo">Sample</span>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function toneFor(status: string): string {
  if (['Completed', 'Purchased', 'Delivered', 'Given', 'Ready', 'Approved', 'Attending', 'Done', 'Confirmed'].includes(status)) {
    return 'good';
  }
  if (['Urgent', 'Overdue', 'Cancelled', 'Not Attending'].includes(status)) return 'bad';
  if (['In Progress', 'Waiting', 'Shortlisted', 'Review', 'Packaging Pending', 'Maybe', 'High'].includes(status)) {
    return 'warn';
  }
  if (['Planning', 'To Buy', 'To Decide', 'Not Started', 'Not Sent', 'Awaiting'].includes(status)) return 'soft';
  return 'neutral';
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      className="search"
      type="search"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder}
    />
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="form-error" role="alert">{message}</p>;
}

export function submitForm(event: FormEvent) {
  event.preventDefault();
}

export function CheckList({
  options,
  selected,
  onChange,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (!options.length) return <p className="muted">Nothing to choose yet.</p>;
  return (
    <div className="check-list">
      {options.map((option) => {
        const on = selected.includes(option.id);
        return (
          <label key={option.id} className={on ? 'check on' : 'check'}>
            <input
              type="checkbox"
              checked={on}
              onChange={() =>
                onChange(on ? selected.filter((id) => id !== option.id) : [...selected, option.id])
              }
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
