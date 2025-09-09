
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { Account } from '../../types';
// initialAccounts removed; we'll fetch from PCGE via electronAPI
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

interface AccountSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (account: Account) => void;
}

export const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [offset, setOffset] = React.useState(0);
    const [total, setTotal] = React.useState<number | null>(null);

    const limit = 50;

    // Debounced search
    React.useEffect(() => {
        const t = setTimeout(() => {
            setOffset(0);
            fetchAccounts(searchTerm, 0);
        }, 200);
        return () => clearTimeout(t);
    }, [searchTerm]);

    React.useEffect(() => {
        // initial load
        fetchAccounts('', 0);
    }, []);

    async function fetchAccounts(q, off = 0, append = false) {
        setLoading(true);
        try {
            const res = await (window as any).electronAPI.getAccounts(q || '', limit, off);
            if (res && res.success) {
                setTotal(res.total ?? null);
                if (append) setAccounts(prev => [...prev, ...(res.accounts || [])]);
                else setAccounts(res.accounts || []);
            }
        } catch (e) {
            // noop
        } finally {
            setLoading(false);
        }
    }

    const handleSelectAccount = (account: Account) => {
        onSelect(account);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="bg-[#1a1a1a] border border-red-600/30 rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h2 className="text-lg font-bold text-red-500">Seleccionar Cuenta Contable</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-4 border-b border-gray-800">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                                <Input
                                    type="text"
                                    placeholder="Buscar por código o descripción..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                           {loading && (
                               <div className="p-3 text-sm text-gray-400">Cargando cuentas...</div>
                           )}
                           <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-[#0f0f0f] sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Código</th>
                                        <th scope="col" className="px-6 py-3">Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map(acc => (
                                        <tr
                                            key={acc.code}
                                            className="border-b border-gray-800 hover:bg-red-500/10 cursor-pointer"
                                            onClick={() => handleSelectAccount(acc)}
                                        >
                                            <td className="px-6 py-3 font-mono">{acc.code}</td>
                                            <td className={cn("px-6 py-3", acc.isSub && `pl-${acc.level * 4 + 2}`)}>{acc.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-3 border-t border-gray-800 flex items-center justify-between">
                                <div className="text-xs text-gray-400">{total !== null ? `${Math.min(offset + accounts.length, total)} de ${total}` : ''}</div>
                                <div>
                                    {total !== null && offset + accounts.length < total && (
                                        <button
                                            className="text-xs text-red-400 hover:underline"
                                            onClick={() => {
                                                const newOffset = offset + limit;
                                                setOffset(newOffset);
                                                fetchAccounts(searchTerm, newOffset, true);
                                            }}
                                            disabled={loading}
                                        >Cargar más</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
