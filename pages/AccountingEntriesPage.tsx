import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { useClient } from '../contexts/ClientContext';
import { Client, Invoice, Purchase, AccountingEntry, JournalEntryLine } from '../types';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring' } },
};

const AccountingEntryCard: React.FC<{ entry: AccountingEntry }> = ({ entry }) => {
    const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;
    
    const entryTypeColors = {
        simple: 'border-red-600',
        naturaleza: 'border-blue-500',
        destino: 'border-green-500',
    };

    return (
        <motion.div variants={itemVariants} className={`border-l-4 ${entryTypeColors[entry.type]} bg-[#1a1a1a] p-6 rounded-r-lg shadow-lg shadow-black/30`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">{entry.title}</h3>
                <span className="text-sm text-gray-400 font-mono">{entry.date}</span>
            </div>
            <div className="space-y-4">
                {entry.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-xs text-gray-500 block">{line.accountCode}</span>
                            <p>{line.accountDescription}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block">Debe</span>
                            <p className="text-green-400">{formatCurrency(line.debit)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block">Haber</span>
                            <p className="text-red-400">{formatCurrency(line.credit)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const AccountingEntriesPage: React.FC = () => {
    const { selectedClient } = useClient();

    const generateEntries = (client: Client | null): AccountingEntry[] => {
        if (!client) return [];

        const allEntries: AccountingEntry[] = [];

        // Sales Entries
        client.invoices.forEach((inv: Invoice) => {
            allEntries.push({
                title: `Asiento de Venta - Factura ${inv.series}-${inv.number}`,
                date: inv.date,
                type: 'simple',
                lines: [
                    { accountCode: '1212', accountDescription: 'Emitidas en cartera', debit: inv.total, credit: 0 },
                    { accountCode: '40111', accountDescription: 'IGV - Cuenta propia', debit: 0, credit: inv.igv },
                    { accountCode: '701', accountDescription: 'Mercaderías', debit: 0, credit: inv.subtotal },
                ]
            });
        });

        // Purchase Entries
        client.purchases.forEach((pur: Purchase) => {
            // Asiento por Naturaleza
            allEntries.push({
                title: `Asiento de Compra (Naturaleza) - Factura ${pur.series}-${pur.number}`,
                date: pur.date,
                type: 'naturaleza',
                lines: [
                    { accountCode: '601', accountDescription: 'Mercaderías', debit: pur.subtotal, credit: 0 },
                    { accountCode: '40111', accountDescription: 'IGV - Cuenta propia', debit: pur.igv, credit: 0 },
                    { accountCode: '4212', accountDescription: 'Emitidas', debit: 0, credit: pur.total },
                ]
            });
            // Asiento de Destino
            allEntries.push({
                title: `Asiento de Compra (Destino) - Factura ${pur.series}-${pur.number}`,
                date: pur.date,
                type: 'destino',
                lines: [
                    { accountCode: '201', accountDescription: 'Mercaderías manufacturadas', debit: pur.subtotal, credit: 0 },
                    { accountCode: '611', accountDescription: 'Mercaderías', debit: 0, credit: pur.subtotal },
                ]
            });
        });

        // Sort by date, most recent first
        return allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };
    
    const entries = generateEntries(selectedClient);

    if (!selectedClient) {
        return <div className="text-center text-gray-400">Seleccione un cliente para ver los asientos contables.</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="p-6">
                <h2 className="text-xl font-bold text-red-500 mb-6">Asientos Contables Generados: {selectedClient.name}</h2>
                {entries.length > 0 ? (
                    <motion.div
                        className="space-y-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {entries.map((entry, index) => (
                            <AccountingEntryCard key={`${entry.title}-${index}`} entry={entry} />
                        ))}
                    </motion.div>
                ) : (
                    <p className="text-gray-500">No hay asientos contables para este cliente.</p>
                )}
            </Card>
        </motion.div>
    );
};

export default AccountingEntriesPage;