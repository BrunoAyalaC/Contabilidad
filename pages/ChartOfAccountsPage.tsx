import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Loader } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Account } from '../types';
import { AccountModal } from '../components/modals/AccountModal';
import { useAccounts } from '../contexts/AccountsContext';

const ChartOfAccountsPage: React.FC = () => {
    const { accounts, addAccount, updateAccount, deleteAccount, loading } = useAccounts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchScope, setSearchScope] = useState<'all' | 'code' | 'description'>('all');

    const handleAddAccount = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleEditAccount = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };
    
    const handleDeleteAccount = (code: string) => {
        if (window.confirm(`¿Está seguro que desea eliminar la cuenta ${code}?`)) {
            deleteAccount(code);
        }
    };

    const handleSaveAccount = (account: Account) => {
        if (editingAccount) {
            updateAccount(account);
        } else {
            // Add validation for duplicate code
            if (accounts.some(acc => acc.code === account.code)) {
                alert('El código de cuenta ya existe.');
                return;
            }
            addAccount(account);
        }
        setIsModalOpen(false);
        setEditingAccount(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader className="animate-spin text-red-500" size={48} />
                <p className="ml-4 text-gray-400">Cargando Plan Contable...</p>
            </div>
        );
    }

    const filteredAccounts = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return accounts;
        return accounts.filter(acc => {
            const code = String(acc.code || '').toLowerCase();
            const desc = String(acc.description || '').toLowerCase();
            if (searchScope === 'code') return code.includes(q);
            if (searchScope === 'description') return desc.includes(q);
            return code.includes(q) || desc.includes(q);
        });
    }, [accounts, searchTerm, searchScope]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-red-500">Plan Contable General Empresarial</h2>
                    <Button onClick={handleAddAccount}><Plus size={16} /> Agregar Cuenta</Button>
                </div>

                <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2 w-full md:w-1/2">
                        <Label className="sr-only">Buscar</Label>
                        <Input placeholder="Buscar por código o descripción..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-sm text-gray-400">Alcance</Label>
                        <select value={searchScope} onChange={e => setSearchScope(e.target.value as any)} className="bg-[#0f0f0f] border border-gray-700 text-gray-200 rounded-md px-2 h-10">
                            <option value="all">Todo</option>
                            <option value="code">Código</option>
                            <option value="description">Descripción</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-[#0f0f0f] sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">Código</th>
                                <th scope="col" className="px-6 py-3">Descripción</th>
                                <th scope="col" className="px-6 py-3">Tipo</th>
                                <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.map((acc, index) => (
                                <motion.tr
                                    key={acc.code}
                                    className="border-b border-gray-800 hover:bg-gray-800/50"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.005 }}
                                >
                                    <td className="px-6 py-4 font-mono">{acc.code}</td>
                                    <td className={cn("px-6 py-4", acc.isSub && `pl-${acc.level * 4 + 6}`)}>{acc.description}</td>
                                    <td className="px-6 py-4">{acc.type}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <button onClick={() => handleEditAccount(acc)} className="text-gray-400 hover:text-red-500"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteAccount(acc.code)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <AccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAccount}
                account={editingAccount}
            />

        </motion.div>
    );
};

export default ChartOfAccountsPage;