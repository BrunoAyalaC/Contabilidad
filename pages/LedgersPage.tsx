import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { useClient } from '../contexts/ClientContext';
import { useAccounts } from '../contexts/AccountsContext';
import { Client } from '../types';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' } },
};

const LedgerCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <motion.div variants={itemVariants}>
        <Card className="p-6">
            <h2 className="text-xl font-bold text-red-500 mb-4">{title}</h2>
            <div className="overflow-x-auto">{children}</div>
        </Card>
    </motion.div>
);

const SimpleLedgerTable: React.FC<{ data: any[], total: string }> = ({ data, total }) => (
    <table className="w-full text-sm">
        <thead>
            <tr className="border-b border-gray-700 text-left">
                <th className="p-2">Fecha</th>
                <th className="p-2">Comprobante</th>
                <th className="p-2 text-right">Monto</th>
            </tr>
        </thead>
        <tbody>
            {data.map((row, i) => (
                <tr key={i} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                    <td className="p-2">{row.date}</td>
                    <td className="p-2 font-mono">{row.doc}</td>
                    <td className="p-2 text-right">{row.amount}</td>
                </tr>
            ))}
        </tbody>
        <tfoot>
            <tr className="font-bold bg-[#0f0f0f]">
                <td className="p-2" colSpan={2}>Total</td>
                <td className="p-2 text-right">{total}</td>
            </tr>
        </tfoot>
    </table>
);

const GeneralLedgerTable: React.FC<{ data: any[] }> = ({ data }) => (
    <table className="w-full text-sm">
        <thead>
            <tr className="border-b border-gray-700 text-left">
                <th className="p-2">Cuenta</th>
                <th className="p-2">Descripción</th>
                <th className="p-2 text-right">Debe</th>
                <th className="p-2 text-right">Haber</th>
                <th className="p-2 text-right">Saldo</th>
            </tr>
        </thead>
        <tbody>
            {data.map((row, i) => (
                <tr key={i} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                    <td className="p-2 font-mono">{row.account}</td>
                    <td className="p-2">{row.desc}</td>
                    <td className="p-2 text-right text-green-400/80">{row.debit}</td>
                    <td className="p-2 text-right text-red-400/80">{row.credit}</td>
                    <td className={`p-2 text-right font-bold ${row.balanceRaw >= 0 ? 'text-green-400' : 'text-red-400'}`}>{row.balance}</td>
                </tr>
            ))}
        </tbody>
    </table>
);


const LedgersPage: React.FC = () => {
    const { selectedClient } = useClient();
    const { getAccountByCode } = useAccounts(); // Usar el contexto de cuentas

    if (!selectedClient) {
        return <div className="text-center text-gray-400">Seleccione un cliente para ver los libros contables.</div>;
    }

    const salesData = {
        items: selectedClient.invoices.map(inv => ({
            date: inv.date,
            doc: `${inv.series}-${inv.number}`,
            amount: `S/ ${inv.total.toFixed(2)}`
        })),
        total: `S/ ${selectedClient.invoices.reduce((acc, inv) => acc + inv.total, 0).toFixed(2)}`
    };

    const purchasesData = {
        items: selectedClient.purchases.map(pur => ({
            date: pur.date,
            doc: `${pur.series}-${pur.number}`,
            amount: `S/ ${pur.total.toFixed(2)}`
        })),
        total: `S/ ${selectedClient.purchases.reduce((acc, pur) => acc + pur.total, 0).toFixed(2)}`
    };

    const calculateGeneralLedger = (client: Client) => {
        const ledger: { [key: string]: { debit: number, credit: number } } = {};
        
        const addToLedger = (code: string, debit: number, credit: number) => {
            if (!ledger[code]) ledger[code] = { debit: 0, credit: 0 };
            ledger[code].debit += debit;
            ledger[code].credit += credit;
        };

        // Process Sales
        client.invoices.forEach(inv => {
            addToLedger('1212', inv.total, 0);
            addToLedger('40111', 0, inv.igv);
            addToLedger('701', 0, inv.subtotal);
        });

        // Process Purchases
        client.purchases.forEach(pur => {
            // Naturaleza
            addToLedger('601', pur.subtotal, 0);
            addToLedger('40111', pur.igv, 0);
            addToLedger('4212', 0, pur.total);
            // Destino
            addToLedger('201', pur.subtotal, 0);
            addToLedger('611', 0, pur.subtotal);
        });

        // Process Bank Transactions
        client.bankAccounts.forEach(acc => {
            acc.transactions.forEach(tx => {
                if (tx.accountingLink.includes('1212')) { // Cobro de factura
                    addToLedger('1041', tx.amount, 0);
                    addToLedger('1212', 0, tx.amount);
                } else if (tx.accountingLink.includes('4212')) { // Pago a proveedor
                    addToLedger('4212', Math.abs(tx.amount), 0);
                    addToLedger('1041', 0, Math.abs(tx.amount));
                }
            });
        });

        return Object.keys(ledger)
            .sort()
            .map(code => {
                const accountInfo = getAccountByCode(code); // Usar la función del contexto
                const { debit, credit } = ledger[code];
                const balance = debit - credit;
                
                // For account types 'Pasivo', 'Patrimonio', 'Ingreso', the natural balance is credit, so we invert the sign for display logic.
                const naturalCreditAccounts = ['Pasivo', 'Patrimonio', 'Ingreso'];
                const balanceRaw = naturalCreditAccounts.includes(accountInfo?.type || '') ? -balance : balance;

                return {
                    account: code,
                    desc: accountInfo ? accountInfo.description : 'Cuenta Desconocida',
                    debit: `S/ ${debit.toFixed(2)}`,
                    credit: `S/ ${credit.toFixed(2)}`,
                    balance: `S/ ${balance.toFixed(2)}`,
                    balanceRaw
                };
            });
    };

    const generalData = calculateGeneralLedger(selectedClient);
    
    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LedgerCard title="Libro de Ventas">
                    <SimpleLedgerTable data={salesData.items} total={salesData.total} />
                </LedgerCard>
                <LedgerCard title="Libro de Compras">
                     <SimpleLedgerTable data={purchasesData.items} total={purchasesData.total} />
                </LedgerCard>
            </div>
            <LedgerCard title="Libro Mayor">
                <GeneralLedgerTable data={generalData} />
            </LedgerCard>
        </motion.div>
    );
};

export default LedgersPage;