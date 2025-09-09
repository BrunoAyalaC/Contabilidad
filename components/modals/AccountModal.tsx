import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Account } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Account) => void;
    account: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave, account }) => {
    const [formData, setFormData] = useState<Omit<Account, 'level' | 'isSub'>>({
        code: '',
        description: '',
        type: 'Activo',
    });

    useEffect(() => {
        if (account) {
            setFormData({
                code: account.code,
                description: account.description,
                type: account.type,
            });
        } else {
            setFormData({ code: '', description: '', type: 'Activo' });
        }
    }, [account, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const level = formData.code.replace(/\s/g, '').length;
        onSave({ ...formData, level, isSub: level > 1 });
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
                        className="bg-[#1a1a1a] border border-red-600/30 rounded-lg shadow-xl w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h2 className="text-lg font-bold text-red-500">{account ? 'Editar Cuenta' : 'Agregar Cuenta'}</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <Label htmlFor="code">Código</Label>
                                    <Input id="code" name="code" value={formData.code} onChange={handleChange} required disabled={!!account} />
                                </div>
                                <div>
                                    <Label htmlFor="description">Descripción</Label>
                                    <Input id="description" name="description" value={formData.description} onChange={handleChange} required />
                                </div>
                                <div>
                                    <Label htmlFor="type">Tipo</Label>
                                    <select id="type" name="type" value={formData.type} onChange={handleChange} className="bg-[#0f0f0f] border border-gray-700 text-gray-200 rounded-md px-3 h-10 w-full">
                                        <option>Activo</option>
                                        <option>Pasivo</option>
                                        <option>Patrimonio</option>
                                        <option>Ingreso</option>
                                        <option>Gasto</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end p-4 bg-black/30 border-t border-gray-800 rounded-b-lg">
                                <Button type="submit">Guardar Cambios</Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
