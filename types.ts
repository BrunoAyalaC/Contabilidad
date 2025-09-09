import React from 'react';

export interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    unitMeasure?: string; // Añadido para el parser
}

export interface TaxDetails {
    detraction?: number;
    retention?: number;
    perception?: number;
}

export interface Invoice {
    id: string;
    series: string;
    number: string;
    documentType: 'Factura' | 'Boleta' | 'Nota de Crédito';
    date: string;
    dueDate: string;
    exchangeRate: number;
    gloss: string;
    items: InvoiceItem[];
    subtotal: number;
    igv: number;
    total: number;
    taxes: TaxDetails;
    type: 'venta';
}

export interface Purchase {
    id: string;
    series: string;
    number: string;
    documentType: 'Factura' | 'Recibo por Honorarios';
    provider: string;
    date: string;
    dueDate: string;
    exchangeRate: number;
    gloss: string;
    subtotal: number;
    igv: number;
    total: number;
    taxes: TaxDetails;
    type: 'compra';
}


export interface Client {
    id: number;
    name: string;
    ruc: string;
    address: string;
    status: 'Activo' | 'Inactivo';
    condition: 'Habido' | 'No Habido';
    invoices: Invoice[];
    purchases: Purchase[];
    bankAccounts: BankAccount[];
}

export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    currency: 'PEN' | 'USD';
    balance: number;
    transactions: BankTransaction[];
}

export type TransactionType = 'Depósito' | 'Retiro' | 'Pago de Factura' | 'Amortización';

export interface BankTransaction {
    id: string;
    date: string;
    type: TransactionType;
    description: string;
    amount: number;
    accountingLink: string; 
}

export interface Account {
    code: string;
    description: string;
    type: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto';
    level: number;
    isSub?: boolean;
}

// NEW / UPDATED TYPES for precise accounting
export interface JournalEntryLine {
    accountCode: string;
    accountDescription: string;
    debit: number;
    credit: number;
}

export type AccountingEntryType = 'simple' | 'naturaleza' | 'destino';

export interface AccountingEntry {
    title: string;
    date: string;
    type: AccountingEntryType;
    lines: JournalEntryLine[];
}

export interface AccountingEntryGroup {
    id: string; // Corresponds to Invoice/Purchase ID
    entries: AccountingEntry[];
}

// Tipo para la data parseada desde el PDF
export interface ParsedInvoice {
    emitter: { name: string | null; ruc: string | null; };
    receiver: { name: string | null; ruc: string | null; };
    invoiceId: string | null;
    date: string | null;
    paymentCondition: string | null;
    items: InvoiceItem[];
    subtotal: number | null;
    igv: number | null;
    total: number | null;
}

// Global electron preload APIs (minimally typed for renderer usage)
declare global {
    interface Window {
        electronProgress?: {
            subscribe: (cb: (payload: any) => void) => (() => void);
        };
    }
}

export {};

// Electron API global typing: un lugar central y permisivo para todas las páginas
declare global {
    interface ElectronAPI {
        login?: (credentials: { username?: string; password?: string }) => Promise<any>;
        register?: (credentials: { username?: string; password?: string }) => Promise<any>;
        readPdfData?: () => Promise<any>;
        consultaRuc?: (ruc: string) => Promise<any>;
        saveSunatData?: (data: any) => Promise<any>;
        getAccounts?: (query: string, limit?: number, offset?: number) => Promise<any>;
        exportToCsv?: (invoiceData: any) => Promise<any>;
        platform?: string;
        [k: string]: any;
    }

    interface Window {
        electronAPI: ElectronAPI;
    }
}
