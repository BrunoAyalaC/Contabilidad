import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { useClient } from '../contexts/ClientContext';

const IncomeStatementPage: React.FC = () => {
    const { selectedClient } = useClient();

    if (!selectedClient) {
        return <div className="text-center text-gray-400">Seleccione un cliente para ver el estado de resultados.</div>;
    }

    const totalSales = selectedClient.invoices.reduce((acc, inv) => acc + inv.subtotal, 0);
    // Simplified cost of sales - assuming 60% of sales value
    const costOfSales = totalSales * 0.6;
    const grossProfit = totalSales - costOfSales;
    // Simplified expenses
    const adminExpenses = totalSales * 0.15;
    const sellingExpenses = totalSales * 0.1;
    const operatingProfit = grossProfit - adminExpenses - sellingExpenses;
    const incomeTax = operatingProfit > 0 ? operatingProfit * 0.295 : 0;
    const netProfit = operatingProfit - incomeTax;
    
    const statementData = [
        { desc: 'VENTAS', amount: `S/ ${totalSales.toFixed(2)}`, isBold: true },
        { desc: '(-) Costo de Ventas', amount: `S/ ${costOfSales.toFixed(2)}` },
        { desc: 'UTILIDAD BRUTA', amount: `S/ ${grossProfit.toFixed(2)}`, isBold: true, isPositive: true, isHeader: true },
        { desc: '(-) Gastos Administrativos', amount: `S/ ${adminExpenses.toFixed(2)}` },
        { desc: '(-) Gastos de Venta', amount: `S/ ${sellingExpenses.toFixed(2)}` },
        { desc: 'UTILIDAD OPERATIVA', amount: `S/ ${operatingProfit.toFixed(2)}`, isBold: true, isPositive: true, isHeader: true },
        { desc: '(-) Impuesto a la Renta (29.5%)', amount: `S/ ${incomeTax.toFixed(2)}` },
        { desc: 'UTILIDAD NETA DEL EJERCICIO', amount: `S/ ${netProfit.toFixed(2)}`, isBold: true, isFinal: true, isPositive: netProfit >= 0 },
    ];


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="p-6">
                 <h2 className="text-xl font-bold text-red-500 mb-6">Estado de Resultados: {selectedClient.name}</h2>

                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <tbody>
                            {statementData.map((row, index) => (
                                <motion.tr 
                                    key={index}
                                    className={cn(
                                        'border-b border-gray-800 last:border-0',
                                        row.isHeader && 'bg-gray-800/50',
                                        row.isFinal && (row.isPositive ? 'bg-green-600/20' : 'bg-red-600/20')
                                    )}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.08 }}
                                >
                                    <td className={cn('p-4', row.isBold && 'font-bold')}>{row.desc}</td>
                                    <td className={cn(
                                        'p-4 text-right font-mono',
                                        row.isBold && 'font-bold',
                                        row.isPositive && 'text-green-400',
                                        row.isFinal && (row.isPositive ? 'text-green-400' : 'text-red-400'),
                                        row.isFinal && 'text-lg'
                                    )}>{row.amount}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </Card>
        </motion.div>
    );
};

export default IncomeStatementPage;