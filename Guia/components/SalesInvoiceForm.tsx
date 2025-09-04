import React, { useState, useEffect, useCallback } from 'react';
import type { SalesInvoice, InvoiceLineItem } from '../types';
import { DOCUMENT_TYPES, CURRENCIES } from '../constants';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import InvoiceDetailGrid from './InvoiceDetailGrid';

interface SalesInvoiceFormProps {
  onAddInvoice: (invoice: Omit<SalesInvoice, 'id'>) => void;
}

const initialFormData: Omit<SalesInvoice, 'id' | 'items'> = {
  documentType: '01',
  series: '',
  number: '',
  customerRuc: '',
  customerName: '',
  issueDate: new Date().toISOString().split('T')[0],
  currency: 'PEN',
  subtotal: 0,
  igv: 0,
  total: 0,
  description: '',
  glAccount: '7011',
  costCenter: '',
};

const initialItems: InvoiceLineItem[] = [
    { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 }
];

const IGV_RATE = 0.18;

const SalesInvoiceForm: React.FC<SalesInvoiceFormProps> = ({ onAddInvoice }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [items, setItems] = useState<InvoiceLineItem[]>(initialItems);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const igv = subtotal * IGV_RATE;
    const total = subtotal + igv;
    setFormData(prev => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      igv: parseFloat(igv.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    }));
  }, [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
        alert('Por favor, complete todos los campos de detalle del producto/servicio.');
        return;
    }
    onAddInvoice({ ...formData, items });
    alert('Factura de Venta registrada y asiento contable creado.');
    // The form will be reset via the key prop in App.tsx
  };
  
  const handleReset = () => {
    setFormData(initialFormData);
    setItems(initialItems);
  };

  return (
    <Card title="Registrar Factura de Venta" description="Complete los datos del comprobante de venta.">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Select name="documentType" label="Tipo de Documento" value={formData.documentType} onChange={handleInputChange} options={DOCUMENT_TYPES} />
          <Input name="series" label="Serie" placeholder="F001" value={formData.series} onChange={handleInputChange} required />
          <Input name="number" label="Número" placeholder="000123" value={formData.number} onChange={handleInputChange} required />
        </div>

        <div className="border-t border-gray-200 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Input name="customerRuc" label="RUC Cliente" placeholder="12345678901" value={formData.customerRuc} onChange={handleInputChange} required maxLength={11} />
          <Input name="customerName" label="Razón Social Cliente" placeholder="Nombre del Cliente S.A.C." value={formData.customerName} onChange={handleInputChange} required />
        </div>

        <div className="border-t border-gray-200 pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Input name="issueDate" label="Fecha de Emisión" type="date" value={formData.issueDate} onChange={handleInputChange} required />
          <Select name="currency" label="Moneda" value={formData.currency} onChange={handleInputChange} options={CURRENCIES} />
        </div>
        
        <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detalle de la Factura</h3>
            <InvoiceDetailGrid items={items} setItems={setItems} currency={formData.currency as 'PEN' | 'USD'} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <Input name="subtotal" label="Valor de Venta" type="number" step="0.01" placeholder="0.00" value={String(formData.subtotal)} readOnly disabled />
          <Input name="igv" label={`IGV (${IGV_RATE * 100}%)`} type="number" value={String(formData.igv)} readOnly disabled />
          <Input name="total" label="Precio de Venta" type="number" value={String(formData.total)} readOnly disabled />
        </div>
        
        <div className="border-t border-gray-200 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input name="glAccount" label="Cuenta Contable (Ingreso)" placeholder="7011" value={formData.glAccount} onChange={handleInputChange} />
            <Input name="costCenter" label="Centro de Costo" placeholder="2101" value={formData.costCenter} onChange={handleInputChange} />
        </div>

        <div className="border-t border-gray-200 pt-8">
            <label htmlFor="description" className="block text-base font-medium text-gray-700 mb-2">Descripción / Glosa</label>
            <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base" placeholder="Por la venta de mercadería..."></textarea>
        </div>

        <div className="flex justify-end space-x-4 border-t border-gray-200 pt-8">
          <Button type="button" variant="secondary" onClick={handleReset}>Limpiar</Button>
          <Button type="submit" variant="primary">Registrar Venta</Button>
        </div>
      </form>
    </Card>
  );
};

export default SalesInvoiceForm;