import React, { useState } from 'react';
import Tabs from './components/Tabs';
import PurchaseInvoiceForm from './components/PurchaseInvoiceForm';
import SalesInvoiceForm from './components/SalesInvoiceForm';
import JournalBook from './components/JournalBook';
import IncomeStatement from './components/IncomeStatement';
import InvoiceViewer from './components/InvoiceViewer';
import type { TabId, PurchaseInvoice, SalesInvoice, JournalEntry, JournalLine, AnyInvoice } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('purchases');
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  
  // State to force re-render of forms after submission
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
    setFormKey(Date.now()); // Reset form
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
    setFormKey(Date.now()); // Reset form
  };


  const Header: React.FC = () => (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-4xl font-bold text-gray-900 ml-4">
              Sistema de Facturación
            </h1>
        </div>
        <div className="text-right">
            <p className="text-base text-gray-500">CONCAR - PERÚ</p>
        </div>
      </div>
    </header>
  );

  const renderContent = () => {
    const isFormTab = activeTab === 'purchases' || activeTab === 'sales';

    if (isFormTab) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3">
            {activeTab === 'purchases' ? (
              <PurchaseInvoiceForm key={formKey} onAddInvoice={handleAddPurchaseInvoice} />
            ) : (
              <SalesInvoiceForm key={formKey} onAddInvoice={handleAddSalesInvoice} />
            )}
          </div>
          <div className="lg:col-span-2">
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
  }

  return (
    <div className="min-h-screen bg-indigo-50 text-gray-800">
      <Header />
      <main>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-gray-500 text-base">
        <p>&copy; {new Date().getFullYear()} Sistema de Facturación. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default App;