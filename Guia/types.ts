export type TabId = 'purchases' | 'sales' | 'journal' | 'incomeStatement';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BaseInvoice {
  id: string;
  documentType: string;
  series: string;
  number: string;
  issueDate: string;
  currency: 'PEN' | 'USD';
  items: InvoiceLineItem[];
  subtotal: number;
  igv: number;
  total: number;
  description: string;
  glAccount: string;
  costCenter: string;
}

export interface PurchaseInvoice extends BaseInvoice {
  supplierRuc: string;
  supplierName: string;
  dueDate: string;
  hasDetraccion: boolean;
  detraccionAmount: number;
}

export interface SalesInvoice extends BaseInvoice {
  customerRuc: string;
  customerName: string;
}

export type AnyInvoice = PurchaseInvoice | SalesInvoice;

export interface JournalLine {
  account: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: JournalLine[];
  sourceDocument: string;
}