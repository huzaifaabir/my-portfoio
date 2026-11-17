// Form building blocks so every admin form looks and behaves the same way

export function Field({ label, htmlFor, error, help, required, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="text-accent"> *</span>}
        </label>
      )}
      {children}
      {help && !error && <p className="help">{help}</p>}
      {error && <p role="alert" className="error-text">{error}</p>}
    </div>
  );
}

export function Input({ invalid, className = '', ...props }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`input ${invalid ? 'border-danger focus:border-danger' : ''} ${className}`}
    />
  );
}

export function Textarea({ invalid, className = '', rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      aria-invalid={invalid || undefined}
      className={`input resize-y ${invalid ? 'border-danger' : ''} ${className}`}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return <select {...props} className={`input appearance-none pr-10 ${className}`}>{children}</select>;
}

// Checkbox with a label to the right
export function Toggle({ label, checked, onChange, disabled, id }) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-center gap-3 text-sm ${disabled ? 'opacity-60' : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-accent)]"
      />
      {label}
    </label>
  );
}
