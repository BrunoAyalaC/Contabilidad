import { Client, Account } from '../types';

export const initialClients: Client[] = [
    {
        id: 1,
        name: 'Empresa XYZ S.A.C.',
        ruc: '20100066603',
        address: 'Av. Principal 123 - Lima',
        status: 'Activo',
        condition: 'Habido',
        invoices: [
            { id: 'F001-001', series: 'F001', number: '001', documentType: 'Factura', date: '2023-01-15', dueDate: '2023-02-14', exchangeRate: 1.0, gloss: 'Venta de mercadería general', items: [], subtotal: 1000, igv: 180, total: 1180, taxes: { detraction: 100 }, type: 'venta' },
            { id: 'F001-002', series: 'F001', number: '002', documentType: 'Factura', date: '2023-02-20', dueDate: '2023-03-22', exchangeRate: 1.0, gloss: 'Servicio de consultoría', items: [], subtotal: 1500, igv: 270, total: 1770, taxes: {}, type: 'venta' },
            { id: 'B001-001', series: 'B001', number: '001', documentType: 'Boleta', date: '2023-02-25', dueDate: '2023-02-25', exchangeRate: 1.0, gloss: 'Venta menor', items: [], subtotal: 500, igv: 90, total: 590, taxes: {}, type: 'venta' },
        ],
        purchases: [
            { id: 'P001', series: 'E001', number: '123', documentType: 'Factura', provider: 'Proveedor A', date: '2023-01-10', dueDate: '2023-02-09', exchangeRate: 1.0, gloss: 'Compra de insumos de oficina', subtotal: 677.97, igv: 122.03, total: 800, taxes: { retention: 48 }, type: 'compra' },
            { id: 'P002', series: 'E001', number: '124', documentType: 'Factura', provider: 'Proveedor B', date: '2023-02-15', dueDate: '2023-03-17', exchangeRate: 1.0, gloss: 'Adquisición de maquinaria', subtotal: 1271.19, igv: 228.81, total: 1500, taxes: {}, type: 'compra' },
        ],
        bankAccounts: [
            {
                id: 'BCP-PEN-XYZ', bankName: 'BCP', accountNumber: '123-456789-0-01', currency: 'PEN', balance: 50000,
                transactions: [
                    { id: 'T001', date: '2023-01-15', type: 'Depósito', description: 'Cobro Factura F001-001', amount: 1180, accountingLink: 'DEBE: 1041 / HABER: 1212' },
                    { id: 'T002', date: '2023-01-10', type: 'Pago de Factura', description: 'Pago a Proveedor A', amount: -800, accountingLink: 'DEBE: 4212 / HABER: 1041' },
                ]
            }
        ]
    },
    {
        id: 2,
        name: 'ACME Perú S.R.L.',
        ruc: '20500088809',
        address: 'Calle Falsa 456 - Arequipa',
        status: 'Activo',
        condition: 'Habido',
        invoices: [
            { id: 'F002-001', series: 'F002', number: '001', documentType: 'Factura', date: '2023-03-05', dueDate: '2023-04-04', exchangeRate: 3.8, gloss: 'Exportación de servicios', items: [], subtotal: 3200, igv: 576, total: 3776, taxes: {}, type: 'venta' },
        ],
        purchases: [
            { id: 'P003', series: 'E002', number: '555', documentType: 'Factura', provider: 'Proveedor C', date: '2023-03-10', dueDate: '2023-04-09', exchangeRate: 3.8, gloss: 'Compra de materia prima importada', subtotal: 2118.64, igv: 381.36, total: 2500, taxes: {}, type: 'compra' },
        ],
        bankAccounts: [
            {
                id: 'BBVA-USD-ACME', bankName: 'BBVA', accountNumber: '987-654321-0-02', currency: 'USD', balance: 15000,
                transactions: [
                     { id: 'T003', date: '2023-03-05', type: 'Depósito', description: 'Cobro Factura F002-001 (TC 3.8)', amount: 1000, accountingLink: 'DEBE: 1041 / HABER: 1212' },
                ]
            }
        ]
    }
];

export const initialAccounts: Account[] = [
    { code: '10', description: 'EFECTIVO Y EQUIVALENTES DE EFECTIVO', type: 'Activo', level: 1 },
    { code: '101', description: 'Caja', type: 'Activo', level: 2, isSub: true },
    { code: '104', description: 'Cuentas corrientes en instituciones financieras', type: 'Activo', level: 2, isSub: true },
    { code: '1041', description: 'Cuentas corrientes operativas', type: 'Activo', level: 3, isSub: true },
    { code: '12', description: 'CUENTAS POR COBRAR COMERCIALES – TERCEROS', type: 'Activo', level: 1 },
    { code: '121', description: 'Facturas, boletas y otros comprobantes por cobrar', type: 'Activo', level: 2, isSub: true },
    { code: '1212', description: 'Emitidas en cartera', type: 'Activo', level: 3, isSub: true },
    { code: '20', description: 'MERCADERÍAS', type: 'Activo', level: 1},
    { code: '201', description: 'Mercaderías manufacturadas', type: 'Activo', level: 2, isSub: true },
    { code: '40', description: 'TRIBUTOS, CONTRAPRESTACIONES Y APORTES...', type: 'Pasivo', level: 1 },
    { code: '401', description: 'Gobierno Central', type: 'Pasivo', level: 2, isSub: true },
    { code: '4011', description: 'Impuesto General a las Ventas', type: 'Pasivo', level: 3, isSub: true },
    { code: '40111', description: 'IGV - Cuenta propia', type: 'Pasivo', level: 4, isSub: true },
    { code: '42', description: 'CUENTAS POR PAGAR COMERCIALES – TERCEROS', type: 'Pasivo', level: 1 },
    { code: '421', description: 'Facturas, boletas y otros comprobantes por pagar', type: 'Pasivo', level: 2, isSub: true },
    { code: '4212', description: 'Emitidas', type: 'Pasivo', level: 3, isSub: true },
    { code: '60', description: 'COMPRAS', type: 'Gasto', level: 1 },
    { code: '601', description: 'Mercaderías', type: 'Gasto', level: 2, isSub: true },
    { code: '61', description: 'VARIACIÓN DE INVENTARIOS', type: 'Gasto', level: 1 },
    { code: '611', description: 'Mercaderías', type: 'Gasto', level: 2, isSub: true },
    { code: '70', description: 'VENTAS', type: 'Ingreso', level: 1 },
    { code: '701', description: 'Mercaderías', type: 'Ingreso', level: 2, isSub: true },
];