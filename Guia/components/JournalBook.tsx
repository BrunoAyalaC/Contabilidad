import React from 'react';
import type { JournalEntry } from '../types';
import Card from './ui/Card';

interface JournalBookProps {
  entries: JournalEntry[];
}

const JournalBook: React.FC<JournalBookProps> = ({ entries }) => {
  const formatCurrency = (amount: number) => {
    return amount > 0 ? amount.toFixed(2) : '';
  };

  return (
    <Card title="Libro Diario Simplificado" description="Asientos contables generados automáticamente por las operaciones de compra y venta.">
      <div className="overflow-x-auto">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No hay asientos contables</h3>
            <p className="mt-1 text-base text-gray-500">Registre una factura de compra o venta para empezar.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Documento</th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Cuenta</th>
                <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Debe</th>
                <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Haber</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry, entryIndex) => (
                <React.Fragment key={entry.id}>
                  <tr className="bg-indigo-50">
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-indigo-800">{new Date(entry.date + 'T00:00:00').toLocaleDateString('es-PE')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-indigo-800" colSpan={3}>{entry.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium text-indigo-800">{formatCurrency(entry.lines.reduce((sum, line) => sum + line.debit, 0))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium text-indigo-800">{formatCurrency(entry.lines.reduce((sum, line) => sum + line.credit, 0))}</td>
                  </tr>
                  {entry.lines.map((line, lineIndex) => (
                    <tr key={`${entry.id}-${lineIndex}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500"></td>
                      <td className="pl-12 pr-6 py-4 whitespace-nowrap text-base text-gray-700">{line.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">{entry.sourceDocument}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">{line.account}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-base text-gray-900">{formatCurrency(line.debit)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-base text-gray-900">{formatCurrency(line.credit)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export default JournalBook;
