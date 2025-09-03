import { Fragment, useMemo, useState } from "react";
import {
    Combobox,
    ComboboxInput,
    ComboboxButton,
    ComboboxOptions,
    ComboboxOption,
  } from "@headlessui/react";

type Item = { value: string; label: string; description?: string };

export default function ComboBox({
  value,
  onChange,
  items,
  placeholder = "Select an option",
  label,
  disabled,
  loading,
  name,
  required,
}: {
    value?: string;                        // <- string
    onChange: (val: string) => void;       // <- string
    items: Item[];                         // <- string
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    loading?: boolean;
    name: string;
    required?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  }, [items, query]);

  const selected = items.find(i => String(i.value) === String(value));

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>}

      {/* input ẩn để form submit (giữ nguyên FormData) */}
      <input type="hidden" name={name} value={value ?? ""} required={required} />

      <Combobox value={value} onChange={onChange} disabled={disabled}>
  <div className="relative">
    <div className={`relative w-full cursor-default overflow-hidden rounded-[14px] border ${disabled ? "bg-gray-100" : "bg-white"} border-gray-200 text-left focus-within:ring-4 focus-within:ring-emerald-500/20 focus-within:border-emerald-500`}>
      <ComboboxInput
        className="w-full h-12 pl-4 pr-10 text-[#1c1c1c] placeholder:text-gray-400 focus:outline-none"
        displayValue={() => selected ? selected.label : ""}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={loading ? "Loading..." : placeholder}
        readOnly={loading}
      />
      <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
      </ComboboxButton>
    </div>

    <ComboboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 shadow-[0_12px_40px_rgba(0,0,0,.12)] ring-1 ring-black/5 focus:outline-none">
      {loading ? (
        <div className="px-4 py-2 text-sm text-gray-500">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-2 text-sm text-gray-500">Không có kết quả</div>
      ) : (
        filtered.map((item) => (
          <ComboboxOption
            key={item.value}
            value={item.value}
            className={({ active }) =>
              `cursor-pointer select-none px-4 py-2 ${active ? "bg-emerald-50 text-emerald-800" : "text-[#1c1c1c]"}`
            }
          >
            <div className="font-medium">{item.label}</div>
            {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
          </ComboboxOption>
        ))
      )}
    </ComboboxOptions>
  </div>
</Combobox>
    </div>
  );
}
