import React, { useState } from 'react';
import type { AnyInvoice, SalesInvoice, PurchaseInvoice } from '../types';
import { DOCUMENT_TYPES } from '../constants';
import Card from './ui/Card';
import Button from './ui/Button';

interface InvoiceViewerProps {
  title: string;
  invoices: AnyInvoice[];
}

// Type guard to check if an invoice is a SalesInvoice
function isSalesInvoice(invoice: AnyInvoice): invoice is SalesInvoice {
  return 'customerRuc' in invoice;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between py-3 px-4 odd:bg-white even:bg-indigo-50 rounded-md">
        <dt className="text-base font-medium text-gray-600">{label}</dt>
        <dd className="text-base text-gray-900 text-right truncate">{value}</dd>
    </div>
);

const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ title, invoices }) => {
  const [selectedInvoiceIndex, setSelectedInvoiceIndex] = useState<number | null>(null);

  const handleSelectInvoice = (index: number) => {
    setSelectedInvoiceIndex(index);
  };

  const handleGoBack = () => {
    setSelectedInvoiceIndex(null);
  };
  
  const handlePrev = () => {
    if (selectedInvoiceIndex !== null && selectedInvoiceIndex > 0) {
      setSelectedInvoiceIndex(selectedInvoiceIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (selectedInvoiceIndex !== null && selectedInvoiceIndex < invoices.length - 1) {
      setSelectedInvoiceIndex(selectedInvoiceIndex + 1);
    }
  };

  const getDocumentLabel = (code: string) => {
    return DOCUMENT_TYPES.find(doc => doc.value === code)?.label.split(' - ')[1] || 'Documento';
  };
  
  const formatCurrency = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('es-PE');

  if (selectedInvoiceIndex !== null) {
    const invoice = invoices[selectedInvoiceIndex];
    const isSale = isSalesInvoice(invoice);
    const partner = isSale ? { type: 'Cliente', name: invoice.customerName, ruc: invoice.customerRuc } : { type: 'Proveedor', name: invoice.supplierName, ruc: invoice.supplierRuc };

    return (
        <Card title={`Detalle: ${invoice.series}-${invoice.number}`} description={`Factura ${selectedInvoiceIndex + 1} de ${invoices.length}`}>
            <div className="space-y-4">
                <dl className="space-y-2">
                    <DetailItem label={partner.type} value={partner.name} />
                    <DetailItem label={`RUC ${partner.type}`} value={partner.ruc} />
                    <DetailItem label="Documento" value={`${getDocumentLabel(invoice.documentType)} ${invoice.series}-${invoice.number}`} />
                    <DetailItem label="Fecha Emisión" value={formatDate(invoice.issueDate)} />
                    {!isSale && (invoice as PurchaseInvoice).dueDate && <DetailItem label="Fecha Vencimiento" value={formatDate((invoice as PurchaseInvoice).dueDate)} />}
                    <DetailItem label="Moneda" value={invoice.currency} />
                </dl>

                {invoice.items && invoice.items.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-base font-medium text-gray-800 mb-2">Detalle de Factura</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-gray-600">Descripción</th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-600">Cant.</th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-600">P.U.</th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-600">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {invoice.items.map(item => (
                              <tr key={item.id}>
                                <td className="px-4 py-2 whitespace-normal">{item.description}</td>
                                <td className="px-4 py-2 text-right">{item.quantity}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                  </div>
                )}
                
                <dl className="space-y-2 border-t pt-4 mt-4">
                    <DetailItem label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                    <DetailItem label="IGV" value={formatCurrency(invoice.igv)} />
                    <DetailItem label="Total" value={<span className="font-bold text-indigo-600 text-lg">{formatCurrency(invoice.total)}</span>} />
                    {invoice.description && <DetailItem label="Glosa" value={invoice.description} />}
                </dl>

                <div className="flex justify-between items-center border-t pt-6">
                    <Button onClick={handleGoBack} variant="secondary">Volver a la Lista</Button>
                    <div className="flex space-x-2">
                        <Button onClick={handlePrev} disabled={selectedInvoiceIndex === 0}>Anterior</Button>
                        <Button onClick={handleNext} disabled={selectedInvoiceIndex === invoices.length - 1}>Siguiente</Button>
                    </div>
                </div>
            </div>
      </Card>
    )
  }

  return (
    <Card title={title} description="Haz clic en una factura para ver el detalle.">
      <div className="overflow-x-auto">
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Sin Facturas</h3>
            <p className="mt-1 text-base text-gray-500">Aún no se han registrado facturas.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Número</th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Razón Social</th>
                <th scope="col" className="px-4 py-3 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice, index) => {
                const partnerName = isSalesInvoice(invoice) ? invoice.customerName : invoice.supplierName;
                return (
                  <tr key={invoice.id} onClick={() => handleSelectInvoice(index)} className="hover:bg-indigo-50 cursor-pointer transition-colors duration-150">
                    <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-base font-medium text-gray-900">{invoice.series}-{invoice.number}</div>
                        <div className="text-sm text-gray-500">{getDocumentLabel(invoice.documentType)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-800 truncate" style={{maxWidth: '20ch'}} title={partnerName}>{partnerName}</div>
                        <div className="text-sm text-gray-500">{formatDate(invoice.issueDate)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-base font-medium text-gray-900">{formatCurrency(invoice.total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export default InvoiceViewer;