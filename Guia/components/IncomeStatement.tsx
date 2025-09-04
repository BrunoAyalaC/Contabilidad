import React from 'react';
import type { PurchaseInvoice, SalesInvoice } from '../types';
import Card from './ui/Card';

interface IncomeStatementProps {
  purchases: PurchaseInvoice[];
  sales: SalesInvoice[];
}

const IncomeStatement: React.FC<IncomeStatementProps> = ({ purchases, sales }) => {
  const totalSales = sales.reduce((sum, invoice) => sum + invoice.subtotal, 0);
  const totalPurchases = purchases.reduce((sum, invoice) => sum + invoice.subtotal, 0);
  const grossProfit = totalSales - totalPurchases;

  const formatCurrency = (amount: number, currency: string = 'S/') => {
    return `${currency} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card title="Estado de Resultados" description="Resumen financiero basado en los comprobantes registrados.">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <p className="text-lg font-medium text-gray-700">Ingresos por Ventas (Subtotal)</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(totalSales)}</p>
        </div>
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <p className="text-lg font-medium text-gray-700">(-) Costo de Compras (Subtotal)</p>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(totalPurchases)}</p>
        </div>
        <div className="border-t-2 border-gray-300 pt-6">
          <div className={`flex justify-between items-center p-4 rounded-lg ${grossProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="text-xl font-bold text-gray-900">Utilidad Bruta</p>
            <p className={`text-xl font-bold ${grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(grossProfit)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default IncomeStatement;
