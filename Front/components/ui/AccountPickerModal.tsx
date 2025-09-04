import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

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
  isOpen: boolean;
  onClose: () => void;
  onSelect: (a: Account) => void;
  token?: string | null;
}

const AccountPickerModal: React.FC<Props> = ({ isOpen, onClose, onSelect, token }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQ('');
    setResults([]);
    setSelectedIndex(0);
    // focus handled by parent or consumer when opening
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      const term = q.trim();
      if (!term) { setResults([]); return; }
      setLoading(true);
      const cancel = axios.CancelToken.source();
      axios.get(`/api/Accounting/accounts?q=${encodeURIComponent(term)}&limit=50`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cancelToken: cancel.token })
        .then(r => {
          const data = (r.data && (r.data.items || r.data)) || [];
          setResults(data);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
      return () => cancel.cancel();
    }, 200);
    return () => clearTimeout(id);
  }, [q, isOpen, token]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(results.length - 1, i + 1));
      scrollToSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(0, i - 1));
      scrollToSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollToSelected = () => {
    try {
      if (!listRef.current) return;
      const child = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (child) child.scrollIntoView({ block: 'nearest' });
    } catch { }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full z-10 p-4" role="dialog" aria-modal="true" aria-label="Buscar cuenta contable">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Buscar cuenta contable</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Cerrar</button>
        </div>
        <div>
          <input autoFocus onKeyDown={handleKeyDown} value={q} onChange={e => setQ(e.target.value)} placeholder="Escribe código o nombre y presiona Enter para seleccionar" className="w-full border rounded px-3 py-2 mb-3" />
          {loading && <div className="text-sm text-gray-500 mb-2">Buscando...</div>}
          <div ref={listRef} className="max-h-64 overflow-auto border rounded">
            {results.length === 0 && !loading && <div className="p-3 text-gray-500">No se encontraron cuentas.</div>}
            {results.map((r, idx) => {
              const code = r.AccountCode ?? r.Codigo ?? (r as any).code ?? '';
              const name = r.AccountName ?? r.Nombre ?? (r as any).name ?? '';
              const desc = r.Description ?? r.Descripcion ?? (r as any).description ?? r.desc ?? '';
              const isSel = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  tabIndex={-1}
                  onClick={() => onSelect(r)}
                  className={`px-3 py-2 cursor-pointer border border-transparent ${isSel ? 'border-2 border-green-500 rounded' : 'hover:border-green-500'}`}
                >
                  <div className="font-medium">{code} — {name}</div>
                  {desc && <div className="text-sm text-gray-500">{desc}</div>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 border rounded mr-2">Cancelar</button>
            <button onClick={() => { if (results[selectedIndex]) onSelect(results[selectedIndex]); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Seleccionar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPickerModal;
