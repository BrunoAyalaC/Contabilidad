import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useClient } from '../contexts/ClientContext';
import { Landmark, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { BankAccount } from '../types';
import { cn } from '../lib/utils';

const BankAccountCard: React.FC<{ account: BankAccount }> = ({ account }) => {
    return (
        <Card className="bg-[#0f0f0f] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <Landmark className="text-red-500" />
                    <h3 className="text-lg font-bold">{account.bankName} - {account.currency}</h3>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                    {account.currency === 'PEN' ? 'S/' : '$'}{account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-400 font-mono">{account.accountNumber}</p>
                <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-gray-300">Últimas Transacciones:</h4>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-700 text-left text-gray-400">
                                <th className="py-2">Fecha</th>
                                <th className="py-2">Descripción</th>
                                <th className="py-2">Amarre Contable</th>
                                <th className="py-2 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {account.transactions.slice(0, 5).map(tx => (
                                <tr key={tx.id} className="border-b border-gray-800 last:border-0">
                                    <td className="py-2">{tx.date}</td>
                                    <td className="py-2">{tx.description}</td>
                                    <td className="py-2 font-mono text-xs">
                                        <span className="text-green-400">{tx.accountingLink.split('/')[0]?.trim()}</span>
                                        <span className="text-gray-500 mx-1">/</span>
                                        <span className="text-red-400">{tx.accountingLink.split('/')[1]?.trim()}</span>
                                    </td>
                                    <td className={cn("py-2 text-right font-semibold flex items-center justify-end gap-2", tx.amount > 0 ? 'text-green-400' : 'text-red-400')}>
                                        {tx.amount > 0 ? <ArrowDownCircle size={14}/> : <ArrowUpCircle size={14}/>}
                                        {Math.abs(tx.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const BanksPage: React.FC = () => {
    const { selectedClient } = useClient();

    if (!selectedClient) {
        return <div className="text-center text-gray-400">Seleccione un cliente para ver la información bancaria.</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div>
                 <h2 className="text-xl font-bold text-red-500">Gestión Bancaria: {selectedClient.name}</h2>
                 <p className="text-sm text-gray-400">Resumen de cuentas y transacciones.</p>
            </div>
            {selectedClient.bankAccounts.length > 0 ? (
                selectedClient.bankAccounts.map(account => (
                    <BankAccountCard key={account.id} account={account} />
                ))
            ) : (
                <p className="text-center text-gray-500">Este cliente no tiene cuentas bancarias registradas.</p>
            )}
        </motion.div>
    );
};

export default BanksPage;