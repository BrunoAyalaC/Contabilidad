import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { SalesInvoice, InvoiceLineItem } from '../types';
import { DOCUMENT_TYPES, CURRENCIES } from '../constants';
import Card from './ui/Card';
import Input from './ui/Input';
import AccountCombo from './ui/AccountCombo';
import Select from './ui/Select';
import Button from './ui/Button';
import InvoiceDetailGrid from './InvoiceDetailGrid';
import OcrModal from './OcrModal';

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
  const [isOcrOpen, setIsOcrOpen] = useState(false);

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

  const applyParsedData = (parsed: any) => {
    const read = (obj: any, ...keys: string[]) => {
      for (const k of keys) {
        if (obj && typeof obj[k] !== 'undefined' && obj[k] !== null) return obj[k];
      }
      return undefined;
    };

    try { console.debug('SalesInvoiceForm.applyParsedData -> parsed:', parsed); } catch {}

    const mapped: Partial<typeof initialFormData> = {};

    const ruc = read(parsed, 'customerRuc', 'supplierRuc', 'ruc', 'Ruc');
    if (ruc) mapped.customerRuc = String(ruc);

    const name = read(parsed, 'customerName', 'supplierName', 'name', 'razonSocial');
    if (name) mapped.customerName = String(name);

    const issue = read(parsed, 'issueDate', 'invoiceDate', 'invoice_date', 'InvoiceDate');
    if (issue) mapped.issueDate = String(issue).split('T')[0];

    const currency = read(parsed, 'currency', 'moneda', 'Currency');
    if (currency) mapped.currency = String(currency).toUpperCase() === 'USD' ? 'USD' : 'PEN';

    if (parsed) {
      const sourceItems = parsed.items || parsed.Items || parsed.LineItems || parsed.lineItems || parsed.line_items || null;
      if (Array.isArray(sourceItems)) {
        const parsedItems = sourceItems.map((it: any, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          description: it.description || it.desc || it.name || it.Description || '',
          quantity: Number(it.quantity || it.qty || it.Quantity || 1),
          unitPrice: Number(it.unitPrice || it.price || it.valor || it.UnitPrice || 0),
          total: Number(it.total || it.amount || it.Total || 0)
        }));
        setItems(parsedItems.length ? parsedItems : initialItems);
      }
    }

    setFormData(prev => ({ ...prev, ...mapped }));

    (async () => {
      try {
        const nameCandidate = mapped.customerName || parsed?.partyName || parsed?.PartyName || parsed?.name || parsed?.razonSocial;
        if (!nameCandidate) return;
        const resp = await axios.get(`/api/Accounting/accounts?q=${encodeURIComponent(String(nameCandidate))}&limit=5`);
        const items = (resp.data && (resp.data.items || resp.data)) || [];
        if (Array.isArray(items) && items.length > 0) {
          const first = items[0] as any;
          const code = first.AccountCode ?? first.Codigo ?? first.code ?? first.Code ?? first.Code;
          if (code) setFormData(prev => ({ ...prev, glAccount: String(code) }));
        }
      } catch (e) {
        // ignore lookup errors
      }
    })();
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
            <AccountCombo name="glAccount" value={formData.glAccount} onChange={(v) => setFormData(prev => ({ ...prev, glAccount: v }))} />
            <Input name="costCenter" label="Centro de Costo" placeholder="2101" value={formData.costCenter} onChange={handleInputChange} />
        </div>

        <div className="border-t border-gray-200 pt-8">
            <label htmlFor="description" className="block text-base font-medium text-gray-700 mb-2">Descripción / Glosa</label>
            <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base" placeholder="Por la venta de mercadería..."></textarea>
        </div>

        <div className="flex justify-end space-x-4 border-t border-gray-200 pt-8">
          <Button type="button" variant="secondary" onClick={() => setIsOcrOpen(true)}>Subir PDF (OCR)</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>Limpiar</Button>
          <Button type="submit" variant="primary">Registrar Venta</Button>
        </div>
      </form>
      <OcrModal isOpen={isOcrOpen} onClose={() => setIsOcrOpen(false)} onApply={applyParsedData} />
    </Card>
  );
};

export default SalesInvoiceForm;