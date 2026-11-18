
import { Field, Input, Textarea } from '../Form.jsx';

// Supported field types: text, textarea, range, select
// Select options: [{ value, label }]
// Set unique: true to prevent selecting the same option in multiple rows.

export default function ListEditor({
  items,
  onChange,
  fields,
  emptyItem,
  addLabel = 'Add item',
  disabled = false,
  itemLabel = 'Item',
}) {
  const update = (index, key, value) => {
    onChange(
      items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      )
    );
  };

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...items, { ...emptyItem }]);
  };

  const uniqueSelectField = fields.find(
    (field) => field.type === 'select' && field.unique
  );

  const canAddMore =
    !uniqueSelectField ||
    items.length < (uniqueSelectField.options || []).length;

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="text-sm text-muted">Nothing added yet.</p>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border border-line bg-surface-2/60 p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-muted">
              {itemLabel} {index + 1}
            </p>

            {!disabled && (
              <button
                type="button"
                className="text-sm text-danger hover:underline"
                onClick={() => remove(index)}
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const id = `${f.key}-${index}`;

              if (f.type === 'select') {
                const selectedElsewhere = items
                  .filter((_, i) => i !== index)
                  .map((other) => other[f.key]);

                return (
                  <div key={f.key}>
                    <Field label={f.label} htmlFor={id}>
                      <select
                        id={id}
                        disabled={disabled}
                        value={item[f.key] ?? ''}
                        onChange={(e) =>
                          update(index, f.key, e.target.value)
                        }
                        className="input w-full"
                      >
                        <option value="" disabled>
                          {f.placeholder || 'Select an option'}
                        </option>

                        {(f.options || []).map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={
                              f.unique &&
                              selectedElsewhere.includes(option.value)
                            }
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                );
              }

              return (
                <div
                  key={f.key}
                  className={f.type === 'textarea' ? 'sm:col-span-2' : ''}
                >
                  <Field label={f.label} htmlFor={id}>
                    {f.type === 'textarea' ? (
                      <Textarea
                        id={id}
                        rows={3}
                        disabled={disabled}
                        placeholder={f.placeholder}
                        maxLength={f.max}
                        value={item[f.key] ?? ''}
                        onChange={(e) =>
                          update(index, f.key, e.target.value)
                        }
                      />
                    ) : f.type === 'range' ? (
                      <div className="flex items-center gap-4">
                        <input
                          id={id}
                          type="range"
                          min="0"
                          max="100"
                          disabled={disabled}
                          value={item[f.key] ?? 50}
                          onChange={(e) =>
                            update(index, f.key, Number(e.target.value))
                          }
                          className="w-full accent-[var(--color-accent)]"
                        />

                        <span className="w-12 text-right text-sm tabular-nums">
                          {item[f.key] ?? 50}%
                        </span>
                      </div>
                    ) : (
                      <Input
                        id={id}
                        disabled={disabled}
                        placeholder={f.placeholder}
                        maxLength={f.max}
                        value={item[f.key] ?? ''}
                        onChange={(e) =>
                          update(index, f.key, e.target.value)
                        }
                      />
                    )}
                  </Field>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!disabled && (
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={add}
          disabled={!canAddMore}
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}
