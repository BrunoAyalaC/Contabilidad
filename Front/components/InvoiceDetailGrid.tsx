import React from 'react';
import type { InvoiceLineItem } from '../types';
import Button from './ui/Button';

interface InvoiceDetailGridProps {
  items: InvoiceLineItem[];
  setItems: React.Dispatch<React.SetStateAction<InvoiceLineItem[]>>;
  currency: 'PEN' | 'USD';
}

const InvoiceDetailGrid: React.FC<InvoiceDetailGridProps> = ({ items, setItems, currency }) => {
    
  const handleItemChange = (index: number, field: keyof Omit<InvoiceLineItem, 'id' | 'total'>, value: string) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'quantity' || field === 'unitPrice') {
      const numericValue = parseFloat(value);
      item[field] = isNaN(numericValue) ? 0 : numericValue;
    } else {
      item[field] = value;
    }
    
    item.total = item.quantity * item.unitPrice;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
        setItems(prev => prev.filter(item => item.id !== id));
    } else {
        alert('La factura debe tener al menos una línea de detalle.');
    }
  };

  const formatCurrency = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const inputClasses = "w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-2";

  return (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider w-2/5">Descripción</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Cantidad</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">P. Unitario ({currency})</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Total ({currency})</th>
                    <th scope="col" className="relative px-4 py-3"><span className="sr-only">Eliminar</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                    <tr key={item.id}>
                        <td className="px-4 py-2 whitespace-nowrap">
                            <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                className={inputClasses}
                                placeholder="Producto o Servicio"
                                required
                            />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                className={`${inputClasses} text-right`}
                                step="1"
                                min="0"
                                required
                            />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                            <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                className={`${inputClasses} text-right`}
                                step="0.01"
                                min="0"
                                required
                            />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                            <input
                                type="text"
                                value={formatCurrency(item.total)}
                                readOnly
                                disabled
                                className={`${inputClasses} text-right bg-gray-100`}
                            />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-800 disabled:text-gray-300 transition-colors"
                                disabled={items.length <= 1}
                                title="Eliminar fila"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        <div className="mt-4">
            <Button type="button" variant="secondary" onClick={handleAddItem}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Añadir Fila
            </Button>
        </div>
    </div>
  );
};

export default InvoiceDetailGrid;