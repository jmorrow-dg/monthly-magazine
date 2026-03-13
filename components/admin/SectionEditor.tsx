'use client';

import { useState } from 'react';
import ContentIndicator from '@/components/admin/ContentIndicator';
import { CONTENT_LIMITS } from '@/lib/constants/content-limits';

type ArrayItem = Record<string, unknown>;

type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'string-array';
  options?: string[];
  placeholder?: string;
};

type SectionEditorProps = {
  sectionKey: string;
  label: string;
  items: ArrayItem[];
  fields: FieldDef[];
  onChange: (items: ArrayItem[]) => void;
};

export default function SectionEditor({ sectionKey, label, items, fields, onChange }: SectionEditorProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function addItem() {
    const newItem: ArrayItem = {};
    fields.forEach((f) => {
      if (f.type === 'string-array') {
        newItem[f.key] = [];
      } else if (f.type === 'select') {
        newItem[f.key] = f.options?.[0] || '';
      } else {
        newItem[f.key] = '';
      }
    });
    onChange([...items, newItem]);
    setExpanded(items.length);
  }

  function updateItem(index: number, key: string, value: unknown) {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  }

  function removeItem(index: number) {
    const itemLabel = (items[index]?.[fields[0]?.key] as string) || `Item ${index + 1}`;
    if (!confirm(`Remove "${itemLabel}"? This cannot be undone.`)) return;
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
    setExpanded(null);
  }

  return (
    <div className="mb-6" data-section={sectionKey}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">{label}</h3>
        <button
          onClick={addItem}
          className="text-[11px] text-[#B8860B] hover:text-[#D4A843] font-medium transition-colors"
        >
          + Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-[#666666] text-sm py-4">No items yet. Click &quot;+ Add Item&quot; to start.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="bg-[#1C1C1C] border border-[#333333] rounded-lg overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpanded(expanded === index ? null : index)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#222222] transition-colors"
              >
                <span className="text-sm text-white">
                  {(item[fields[0]?.key] as string) || `Item ${index + 1}`}
                </span>
                <span className="text-xs text-[#666666]">{expanded === index ? 'Collapse' : 'Expand'}</span>
              </button>

              {/* Fields */}
              {expanded === index && (
                <div className="px-4 pb-4 space-y-3 border-t border-[#333333] pt-3">
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-[10px] text-[#888888] uppercase tracking-wider mb-1">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <>
                          <textarea
                            value={(item[field.key] as string) || ''}
                            onChange={(e) => updateItem(index, field.key, e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-[#222222] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] resize-y"
                          />
                          {CONTENT_LIMITS[sectionKey]?.[field.key] && (
                            <ContentIndicator
                              value={(item[field.key] as string) || ''}
                              limit={CONTENT_LIMITS[sectionKey][field.key]}
                            />
                          )}
                        </>
                      ) : field.type === 'select' ? (
                        <select
                          value={(item[field.key] as string) || ''}
                          onChange={(e) => updateItem(index, field.key, e.target.value)}
                          className="w-full px-3 py-2 bg-[#222222] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'string-array' ? (
                        <StringArrayEditor
                          values={(item[field.key] as string[]) || []}
                          onChange={(arr) => updateItem(index, field.key, arr)}
                          placeholder={field.placeholder || 'Add entry...'}
                        />
                      ) : (
                        <>
                          <input
                            type="text"
                            value={(item[field.key] as string) || ''}
                            onChange={(e) => updateItem(index, field.key, e.target.value)}
                            className="w-full px-3 py-2 bg-[#222222] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
                          />
                          {CONTENT_LIMITS[sectionKey]?.[field.key] && (
                            <ContentIndicator
                              value={(item[field.key] as string) || ''}
                              limit={CONTENT_LIMITS[sectionKey][field.key]}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => removeItem(index)}
                    className="text-[11px] text-[#C0392B] hover:text-red-400 font-medium transition-colors"
                  >
                    Remove Item
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline sub-component for editing an array of strings (e.g. playbook steps, sector tags). */
function StringArrayEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (arr: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  function addEntry() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft('');
  }

  function removeEntry(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function updateEntry(index: number, value: string) {
    const updated = [...values];
    updated[index] = value;
    onChange(updated);
  }

  return (
    <div className="space-y-1.5">
      {values.map((val, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-[#666666] w-5 text-right flex-shrink-0">{i + 1}.</span>
          <input
            type="text"
            value={val}
            onChange={(e) => updateEntry(i, e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#222222] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
          />
          <button
            onClick={() => removeEntry(i)}
            className="text-[#C0392B] hover:text-red-400 text-xs px-1.5 transition-colors flex-shrink-0"
            title="Remove"
          >
            &times;
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="w-5 flex-shrink-0" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEntry(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 bg-[#222222] border border-[#333333] border-dashed rounded text-white text-sm focus:outline-none focus:border-[#B8860B] placeholder-[#555555]"
        />
        <button
          onClick={addEntry}
          disabled={!draft.trim()}
          className="text-[11px] text-[#B8860B] hover:text-[#D4A843] font-medium disabled:opacity-30 transition-colors flex-shrink-0"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
