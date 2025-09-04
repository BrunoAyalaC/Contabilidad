import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AccountPickerModal from './AccountPickerModal';

interface Account {
  Codigo?: string;
  Nombre?: string;
  AccountCode?: string;
  AccountName?: string;
  Descripcion?: string;
  Description?: string;
  desc?: string;
}

interface Props {
  name: string;
  value: string; // stored code
  onChange: (value: string) => void; // receives the code
  token?: string | null;
}

// Autocomplete with optional modal picker (open on Enter)
const AccountCombo: React.FC<Props> = ({ name, value, onChange, token }) => {
  const [q, setQ] = useState('');
  const [options, setOptions] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Account | null>(null);

  // simple debounce for inline suggestions
  useEffect(() => {
    const id = setTimeout(() => {
      const term = q.trim();
      if (!term) { setOptions([]); return; }
      setLoading(true);
      const cancel = axios.CancelToken.source();
      axios.get(`/api/Accounting/accounts?q=${encodeURIComponent(term)}&limit=10`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cancelToken: cancel.token })
        .then(r => {
          const data = (r.data && (r.data.items || r.data)) || [];
          setOptions(data);
        })
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
      return () => cancel.cancel();
    }, 300);
    return () => clearTimeout(id);
  }, [q, token]);

  const concatDisplay = (a: Account) => {
    const code = a.AccountCode ?? a.Codigo ?? (a as any).code ?? '';
    const name = a.AccountName ?? a.Nombre ?? (a as any).name ?? '';
  const desc = a.Description ?? a.Descripcion ?? (a as any).description ?? a.desc ?? '';
    return `${code}${name ? ' — ' + name : ''}${desc ? ' — ' + desc : ''}`.trim();
  };

  const pick = (a: Account) => {
    const code = a.AccountCode ?? a.Codigo ?? (a as any).code ?? '';
    setSelected(a);
    onChange(String(code));
    setQ('');
    setOptions([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowModal(true);
    }
  };

  const handleModalSelect = (a: Account) => {
    pick(a);
    setShowModal(false);
  };

  return (
    <div>
      <label htmlFor={name} className="block text-base font-medium text-gray-700 mb-2">Cuenta Contable</label>
      <div className="relative">
        {/* If user is typing (q) show q, otherwise show selected display or placeholder */}
        <input id={name} name={name} value={q.length > 0 ? q : (selected ? concatDisplay(selected) : '')} onChange={e => { setQ(e.target.value); if (selected) setSelected(null); }} onKeyDown={onKeyDown} placeholder={(selected ? concatDisplay(selected) : value) || 'Buscar cuenta por código o nombre (Enter para abrir buscador)'} className="block w-full rounded-lg border-gray-300 py-2 pl-4 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" />
        { loading && <div className="absolute right-2 top-2 text-sm text-gray-500">Cargando...</div> }
        { selected && (
          <button type="button" aria-label="Limpiar cuenta seleccionada" onClick={() => { setSelected(null); onChange(''); }} className="absolute right-2 top-2 text-sm text-red-500">X</button>
        )}
      </div>
      { options.length > 0 && (
        <div className="mt-1 max-h-48 overflow-auto border rounded bg-white shadow z-10">
          {options.map((o, idx) => {
            const code = o.AccountCode ?? o.Codigo ?? (o as any).code ?? '';
            const nameLabel = o.AccountName ?? o.Nombre ?? (o as any).name ?? '';
            const desc = o.Description ?? o.Descripcion ?? (o as any).description ?? o.desc ?? '';
            const isChosen = String(code) === String(value);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => pick(o)}
                className={`w-full text-left px-3 py-2 border border-transparent ${isChosen ? 'border-2 border-green-500 rounded' : 'hover:border-green-500'} focus:border-green-500`}
              >
                <div className="font-medium">{code} — {nameLabel}</div>
                {desc && <div className="text-sm text-gray-500">{desc}</div>}
              </button>
            );
          })}
        </div>
      )}
      {/* Hidden value field to keep the selected code in the form */}
      <input type="hidden" name={name} value={value} />

      <AccountPickerModal isOpen={showModal} onClose={() => setShowModal(false)} onSelect={handleModalSelect} token={token} />
    </div>
  );
};

export default AccountCombo;
