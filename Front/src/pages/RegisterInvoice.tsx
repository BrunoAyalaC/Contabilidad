import React, { useState } from 'react';
import Tabs from '../../components/Tabs';
import PurchaseInvoiceForm from '../../components/PurchaseInvoiceForm';
import SalesInvoiceForm from '../../components/SalesInvoiceForm';
import JournalBook from '../../components/JournalBook';
import IncomeStatement from '../../components/IncomeStatement';
import InvoiceViewer from '../../components/InvoiceViewer';
import type { TabId, PurchaseInvoice, SalesInvoice, JournalEntry, JournalLine } from '../../types';

const RegisterInvoice: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('purchases');
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [formKey, setFormKey] = useState(Date.now());

  const tabs = [
    { id: 'purchases' as TabId, label: 'Registro de Compras' },
    { id: 'sales' as TabId, label: 'Registro de Ventas' },
    { id: 'journal' as TabId, label: 'Libro Diario' },
    { id: 'incomeStatement' as TabId, label: 'Estado de Resultados' },
  ];

  const handleAddPurchaseInvoice = (invoice: Omit<PurchaseInvoice, 'id'>) => {
    const newInvoice = { ...invoice, id: `P-${Date.now()}` };
    const updatedInvoices = [...purchaseInvoices, newInvoice].sort((a,b) => b.series.localeCompare(a.series) || b.number.localeCompare(a.number));
    setPurchaseInvoices(updatedInvoices);

    const journalLines: JournalLine[] = [
      { account: invoice.glAccount || '6011', description: 'Mercaderías', debit: invoice.subtotal, credit: 0 },
      { account: '40111', description: 'IGV - Crédito Fiscal', debit: invoice.igv, credit: 0 },
      { account: '4212', description: 'Facturas por Pagar', debit: 0, credit: invoice.total },
    ];

    const newEntry: JournalEntry = {
      id: `JE-${Date.now()}`,
      date: invoice.issueDate,
      description: `Compra a ${invoice.supplierName}`,
      sourceDocument: `${invoice.series}-${invoice.number}`,
      lines: journalLines,
    };
    setJournalEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setFormKey(Date.now());
  };

  const handleAddSalesInvoice = (invoice: Omit<SalesInvoice, 'id'>) => {
    const newInvoice = { ...invoice, id: `S-${Date.now()}` };
    const updatedInvoices = [...salesInvoices, newInvoice].sort((a,b) => b.series.localeCompare(a.series) || b.number.localeCompare(a.number));
    setSalesInvoices(updatedInvoices);

    const journalLines: JournalLine[] = [
      { account: '1212', description: 'Facturas por Cobrar', debit: invoice.total, credit: 0 },
      { account: '40111', description: 'IGV - Débito Fiscal', debit: 0, credit: invoice.igv },
      { account: invoice.glAccount || '7011', description: 'Venta de Mercaderías', debit: 0, credit: invoice.subtotal },
    ];

    const newEntry: JournalEntry = {
      id: `JE-${Date.now()}`,
      date: invoice.issueDate,
      description: `Venta a ${invoice.customerName}`,
      sourceDocument: `${invoice.series}-${invoice.number}`,
      lines: journalLines,
    };
    setJournalEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setFormKey(Date.now());
  };

  const renderContent = () => {
    const isFormTab = activeTab === 'purchases' || activeTab === 'sales';

    if (isFormTab) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          <div>
            {activeTab === 'purchases' ? (
              <PurchaseInvoiceForm key={formKey} onAddInvoice={handleAddPurchaseInvoice} />
            ) : (
              <SalesInvoiceForm key={formKey} onAddInvoice={handleAddSalesInvoice} />
            )}
          </div>
          <div>
            {activeTab === 'purchases' ? (
              <InvoiceViewer title="Compras Registradas" invoices={purchaseInvoices} />
            ) : (
              <InvoiceViewer title="Ventas Registradas" invoices={salesInvoices} />
            )}
          </div>
        </div>
      );
    }

    switch(activeTab) {
      case 'journal':
        return <JournalBook entries={journalEntries} />;
      case 'incomeStatement':
        return <IncomeStatement purchases={purchaseInvoices} sales={salesInvoices} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc', padding: 24 }}>
      <header style={{ background: '#fff', padding: '18px 24px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginLeft: 12 }}>Sistema de Facturación</h1>
          </div>
          <div style={{ textAlign: 'right', color: '#6b7280' }}>CONCAR - PERÚ</div>
        </div>
      </header>

      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}>
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default RegisterInvoice;
