import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

type ApiOption = {
    id: string;
    label: string;
    description?: string;
};

// This modal now exposes only the API KEY option (single source of truth for Gemini key)
const API_OPTIONS: ApiOption[] = [
    { id: 'api_key', label: 'API KEY', description: '' }
];

interface Props {
    open: boolean;
    onClose: () => void;
}

const STORAGE_KEY = 'app:geminiProvider';

export const SettingsModal: React.FC<Props> = ({ open, onClose }) => {
    const [selected, setSelected] = useState<string>('api_key');
    const [apiKey, setApiKey] = useState<string>('');

    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                // @ts-ignore
                if (window && window.electronAPI && window.electronAPI.getAppConfig) {
                    // @ts-ignore
                    const res = await window.electronAPI.getAppConfig();
                    if (res && res.success && res.config) {
                        const cfg = res.config || {};
                        setSelected(cfg.geminiProvider || localStorage.getItem(STORAGE_KEY) || 'api_key');
                        setApiKey(cfg.geminiApiKey || localStorage.getItem(STORAGE_KEY + ':key') || '');
                        return;
                    }
                }
            } catch (e) { /* ignore */ }
            try { setSelected(localStorage.getItem(STORAGE_KEY) || 'api_key'); } catch {}
            try { setApiKey(localStorage.getItem(STORAGE_KEY + ':key') || ''); } catch {}
        })();
    }, [open]);

    const save = async () => {
        try {
            const payload = { geminiProvider: selected, geminiApiKey: apiKey };
            
            if (window && window.electronAPI && window.electronAPI.setAppConfig) {
                
                await window.electronAPI.setAppConfig(payload);
            } else {
                localStorage.setItem(STORAGE_KEY, selected);
                localStorage.setItem(STORAGE_KEY + ':key', apiKey || '');
            }
           
            window.dispatchEvent(new CustomEvent('app:geminiChanged', { detail: { provider: selected, apiKey } }));
            alert('Configuración guardada.');
            onClose();
        } catch (e) {
            console.error('Fallo al guardar la configuración', e);
            alert('No se pudo guardar la configuración');
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative bg-[#0b0b0b] border border-gray-800 rounded-lg w-[540px] max-w-[95%] p-6 shadow-2xl"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Configuración</h3>
                        <p className="text-sm text-gray-400">Ajustes globales de la aplicación</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded"><X/></button>
                </div>

                <div className="mt-4">
                    <div className="space-y-2">
                        {API_OPTIONS.map(opt => (
                            <div key={opt.id} className="flex items-center gap-3">
                                <input
                                    id={`api-${opt.id}`}
                                    type="radio"
                                    name="apiProvider"
                                    checked={selected === opt.id}
                                    onChange={() => setSelected(opt.id)}
                                    className="accent-red-500"
                                />
                                <div className="flex-1">
                                    <label htmlFor={`api-${opt.id}`} className="font-medium text-white cursor-pointer">{opt.label}</label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3">
                        <label className="text-sm text-gray-300 mb-1 block">API KEY</label>
                        <div className="flex gap-2">
                            <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." type="password" className="w-full rounded-md px-3 py-2 bg-[#0f0f0f] border border-gray-700 text-gray-200" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">La clave se guarda de forma local en la configuración de la app.</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-transparent border border-gray-700 text-gray-300">Cancelar</button>
                    <button onClick={save} className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold shadow">Guardar</button>
                </div>
            </motion.div>
        </div>
    );
};

export default SettingsModal;
