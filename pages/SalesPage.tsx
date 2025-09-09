// Importaciones de React, hooks y librerías externas
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Printer, X, Info, FileText } from 'lucide-react';

// Importaciones de tipos y componentes locales
import { InvoiceItem, Account, ParsedInvoice } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { AccountSelectionModal } from '../components/modals/AccountSelectionModal';
import { PdfDisplayModal } from '../components/modals/PdfDisplayModal';
import { useClient } from '../contexts/ClientContext';
import FeedbackModal from '../components/modals/FeedbackModal';

// note: electronAPI typing is provided centrally in types.ts

// Componente reutilizable para un <select> con estilos del proyecto
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="bg-[#0f0f0f] border border-gray-700 text-gray-200 rounded-md px-3 h-10 w-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600" />
);

// Obtenemos la fecha de hoy en formato YYYY-MM-DD
const TodayDate = new Date().toISOString().split('T')[0];

// --- COMPONENTE PRINCIPAL DE LA PÁGINA DE VENTAS ---
const SalesPage: React.FC = () => {
    // --- ESTADOS DEL COMPONENTE ---
    // Estados para el formulario de la factura
    const [invoiceSeries, setInvoiceSeries] = useState('F001');
    const [invoiceNumber, setInvoiceNumber] = useState('1');
    const [emissionDate, setEmissionDate] = useState(TodayDate);
    const [dueDate, setDueDate] = useState(TodayDate);
    const [clientRuc, setClientRuc] = useState('20100066603');
    const [clientName, setClientName] = useState('Empresa XYZ S.A.C.');
    const [paymentCondition, setPaymentCondition] = useState<'Contado' | 'Crédito'>('Crédito');
    const [glosa, setGlosa] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([
        { description: 'Producto Ejemplo 1', quantity: 2, unitPrice: 150.00, total: 300.00 },
    ]);

    // Estados para los modales y datos extraídos
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [extractedPdfText, setExtractedPdfText] = useState('');
    const [parsedInvoice, setParsedInvoice] = useState<ParsedInvoice | null>(null);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackVariant, setFeedbackVariant] = useState<'error'|'success'|'info'>('error');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    
    // Estados para las cuentas contables
    const [modalTarget, setModalTarget] = useState<'debit' | 'igv' | 'credit' | null>(null);
    const [transactionAccounts, setTransactionAccounts] = useState({
        debit: { code: '1212', description: 'Emitidas en cartera' },
        igv: { code: '40111', description: 'IGV - Cuenta propia' },
        credit: { code: '701', description: 'Mercaderías' },
    });

    // --- MANEJADORES DE EVENTOS Y LÓGICA ---

    // Manejador para la importación y parseo del PDF
    const handleImportPdf = async () => {
        const result = await window.electronAPI.readPdfData();
            if (result.success && result.text && result.parsedData) {
            setExtractedPdfText(result.text);
            setParsedInvoice(result.parsedData);
            setIsPdfModalOpen(true);
        } else if (result.message !== 'No file selected') {
            setFeedbackVariant('error');
            setFeedbackMessage(`Error al leer el PDF: ${result.message}`);
            setFeedbackOpen(true);
        }
    };

    // Manejador para el autocompletado del formulario
    const handleAutocomplete = () => {
        // Log de diagnóstico para ver los datos recibidos
        console.log('--- DATOS PARSEADOS PARA AUTOCOMPLETAR (SalesPage) ---', parsedInvoice);

            if (!parsedInvoice) {
            console.error('No hay datos parseados para autocompletar.');
            setFeedbackVariant('error');
            setFeedbackMessage('No hay datos parseados para autocompletar.');
            setFeedbackOpen(true);
            return;
        }

        // Autocompletar datos del cliente y factura
        setClientRuc(parsedInvoice.receiver.ruc || '');
        setClientName(parsedInvoice.receiver.name || '');
        if (parsedInvoice.invoiceId) {
            const [series, number] = parsedInvoice.invoiceId.split('-');
            setInvoiceSeries(series || '');
            setInvoiceNumber(number || '');
        }
        if (parsedInvoice.date) {
            const [day, month, year] = parsedInvoice.date.split('/');
            setEmissionDate(`${year}-${month}-${day}`);
        }
        setPaymentCondition(parsedInvoice.paymentCondition || 'Crédito');

        // Autocompletar items
        if (parsedInvoice.items && parsedInvoice.items.length > 0) {
            setItems(parsedInvoice.items);
            console.log('Frontend: Items updated to:', parsedInvoice.items);
        }

        // Autocompletar cuentas contables sugeridas
        if (parsedInvoice.asiento && parsedInvoice.asiento.type === 'sale' && parsedInvoice.asiento.naturaleza) {
            const { lines } = parsedInvoice.asiento.naturaleza;
            const debitAccount = lines.find(l => l.code.startsWith('12') || l.code.startsWith('10')); // Puede ser 10 o 12
            const igvAccount = lines.find(l => l.code.startsWith('40'));
            const creditAccount = lines.find(l => l.code.startsWith('70'));

            setTransactionAccounts({
                debit: debitAccount || { code: '1212', description: 'Emitidas en cartera' },
                igv: igvAccount || { code: '40111', description: 'IGV - Cuenta propia' },
                credit: creditAccount || { code: '701', description: 'Mercaderías' },
            });
            console.log('Frontend: Transaction Accounts updated to:', { debit: debitAccount, igv: igvAccount, credit: creditAccount });
        } else {
            console.warn('No se pudo autocompletar el asiento: parsedInvoice.asiento no es válido o no es de tipo venta.', parsedInvoice.asiento);
        }

        // Cerramos el modal después de autocompletar
        setIsPdfModalOpen(false);
    };

    // Lógica para la tabla de items
    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string) => {
        const newItems = [...items];
        const numericValue = parseFloat(value) || 0;
        if (field === 'description') {
            newItems[index][field] = value;
        } else {
            (newItems[index] as any)[field] = numericValue;
        }
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
        }
        setItems(newItems);
    };
    const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    // Lógica para el modal de selección de cuentas
    const openAccountModal = (target: 'debit' | 'igv' | 'credit') => {
        setModalTarget(target);
        setIsAccountModalOpen(true);
    };
    const handleAccountSelect = (selectedAccount: Account) => {
        if (modalTarget) {
            setTransactionAccounts(prev => ({ ...prev, [modalTarget]: { code: selectedAccount.code, description: selectedAccount.description } }));
        }
    };

    // Calculos de totales (Subtotal, IGV, Total)
    const { subtotal, igv, total } = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + item.total, 0);
        const igv = subtotal * 0.18;
        const total = subtotal + igv;
        return { subtotal, igv, total };
    }, [items]);
    
    const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;

    // Client context
    const { selectedClient } = useClient();

    // Exportar la factura actual a CSV (descarga local)
    const handleExportCsv = () => {
        try {
            // Cabecera del CSV
            const headers = ['Serie', 'Número', 'Fecha Emisión', 'RUC Cliente', 'Razón Social', 'Glosa', 'Item descripción', 'Cantidad', 'Precio Unitario', 'Total Ítem', 'Subtotal', 'IGV', 'Total'];

            // Filas: una por cada item, repitiendo los datos de la factura
            const rows = items.map(item => ([
                invoiceSeries,
                invoiceNumber,
                emissionDate,
                clientRuc,
                clientName,
                glosa,
                item.description,
                item.quantity.toString(),
                item.unitPrice.toFixed(2),
                item.total.toFixed(2),
                subtotal.toFixed(2),
                igv.toFixed(2),
                total.toFixed(2),
            ]));

            // Construir CSV
            const csvContent = [headers, ...rows].map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\r\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${invoiceSeries}-${invoiceNumber || '000000'}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting CSV', err);
            alert('No se pudo exportar a CSV. Revisa la consola para más detalles.');
        }
    };

    // Guardar factura en BD
    const handleSaveInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // obtener cliente seleccionado desde el contexto
            if (!selectedClient) {
                setFeedbackVariant('error');
                setFeedbackMessage('ERROR ELIGA UN CLIENTE');
                setFeedbackOpen(true);
                return;
            }

            const payload = {
                client_id: selectedClient.id,
                client_ruc: selectedClient.ruc || clientRuc,
                client_name: selectedClient.name || clientName,
                series: invoiceSeries,
                number: invoiceNumber,
                date: emissionDate,
                subtotal,
                igv,
                total,
                glosa,
                items
            };

            // @ts-ignore
            const res = await window.electronAPI.addInvoice(payload);
            if (res && res.success) {
                setFeedbackVariant('success');
                setFeedbackMessage('Factura guardada con éxito');
                setFeedbackOpen(true);
            } else {
                setFeedbackVariant('error');
                setFeedbackMessage('Error al guardar factura: ' + (res && res.message));
                setFeedbackOpen(true);
            }
        } catch (err) {
            console.error('Save invoice error', err);
            setFeedbackVariant('error');
            setFeedbackMessage('Error al guardar factura. Revisa la consola para más detalles.');
            setFeedbackOpen(true);
        }
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-red-500">Registro de Factura de Venta</h2>
                        <p className="text-sm text-gray-400">Complete los datos o importe un PDF para autocompletar.</p>
                    </div>
                    <Button variant="outline" onClick={handleImportPdf}>
                        <FileText size={16} className="mr-2"/>
                        Importar desde PDF
                    </Button>
                </CardHeader>
                <CardContent>
                    <form className="space-y-8" onSubmit={handleSaveInvoice}>
                        {/* Sección de Cabecera */}
                        <div className="p-4 bg-black/30 rounded-lg border border-gray-800 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><Label>Tipo Documento</Label><Select><option>Factura</option></Select></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><Label>Serie</Label><Input type="text" placeholder="F001" value={invoiceSeries} onChange={e => setInvoiceSeries(e.target.value)} /></div>
                                    <div><Label>Número</Label><Input type="number" placeholder="0000001" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} /></div>
                                </div>
                                <div><Label>Fecha Emisión</Label><Input type="date" value={emissionDate} onChange={e => setEmissionDate(e.target.value)} /></div>
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label>Fecha Venc.</Label>
                                        <Button type="button" variant="ghost" className="ml-2 p-1 text-sm transform transition-transform hover:scale-105" onClick={() => setDueDate(emissionDate)} title="Copiar Fecha Emisión" aria-label="Copiar Fecha Emisión">
                                            Copiar
                                        </Button>
                                    </div>
                                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Datos del Cliente */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-red-500 border-b border-gray-800 pb-2">Datos del Cliente</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><Label htmlFor="ruc">RUC</Label><Input id="ruc" type="text" placeholder="20100066603" value={clientRuc} onChange={e => setClientRuc(e.target.value)} /></div>
                                <div><Label htmlFor="razon-social">Razón Social</Label><Input id="razon-social" type="text" placeholder="Empresa XYZ S.A.C." value={clientName} onChange={e => setClientName(e.target.value)} /></div>
                            </div>
                        </div>

                        {/* Tabla de Items */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-red-500">Detalle de Items</h3><Button type="button" onClick={addItem}><Plus size={16}/> Agregar Item</Button></div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#0f0f0f]"><tr><th className="p-3 text-left text-sm font-medium text-gray-400">Descripción</th><th className="p-3 text-left text-sm font-medium text-gray-400 w-24">Cantidad</th><th className="p-3 text-left text-sm font-medium text-gray-400 w-32">P. Unitario</th><th className="p-3 text-left text-sm font-medium text-gray-400 w-32">Total</th><th className="p-3 text-center text-sm font-medium text-gray-400 w-20">Acciones</th></tr></thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} className="border-b border-gray-800 last:border-0">
                                                <td className="p-2"><Input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                                                <td className="p-2"><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} /></td>
                                                <td className="p-2"><Input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} /></td>
                                                <td className="p-2"><Input type="text" value={formatCurrency(item.total)} readOnly className="bg-gray-800 cursor-not-allowed" /></td>
                                                <td className="p-2 text-center"><Button type="button" variant="ghost" onClick={() => removeItem(index)} className="px-2 py-1"><Trash2 size={16} /></Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Detalles Adicionales y Totales */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4 p-4 bg-black/30 rounded-lg border border-gray-800">
                                <h4 className="font-semibold text-gray-300">Detalles Adicionales y Contables</h4>
                                <div><Label>Glosa</Label><Input placeholder="E.g., Venta de mercadería según factura..." value={glosa} onChange={e => setGlosa(e.target.value)} /></div>
                                <div className="flex items-start gap-2 p-2 bg-gray-800/50 border border-gray-700 rounded-md text-sm">
                                    <Info size={16} className="text-red-500 flex-shrink-0 mt-1" />
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-400">
                                        <span>Cuentas Afectadas:</span>
                                        <div className="flex items-center gap-1"><span>Debe:</span><Button type="button" variant="ghost" className="h-auto p-1" onClick={() => openAccountModal('debit')}><span className="font-mono text-white">{transactionAccounts.debit.code}</span></Button></div>
                                        <div className="flex items-center gap-1"><span>Haber IGV:</span><Button type="button" variant="ghost" className="h-auto p-1" onClick={() => openAccountModal('igv')}><span className="font-mono text-white">{transactionAccounts.igv.code}</span></Button></div>
                                        <div className="flex items-center gap-1"><span>Haber Venta:</span><Button type="button" variant="ghost" className="h-auto p-1" onClick={() => openAccountModal('credit')}><span className="font-mono text-white">{transactionAccounts.credit.code}</span></Button></div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-black/50 border border-gray-700 p-4 rounded-lg"><label className="block text-sm font-medium text-gray-400">Subtotal</label><p className="text-lg font-bold text-white">{formatCurrency(subtotal)}</p></div>
                                <div className="bg-black/50 border border-gray-700 p-4 rounded-lg"><label className="block text-sm font-medium text-gray-400">IGV (18%)</label><p className="text-lg font-bold text-white">{formatCurrency(igv)}</p></div>
                                <div className="bg-black/50 border border-red-500 p-4 rounded-lg"><label className="block text-sm font-medium text-gray-400">Total</label><p className="text-xl font-bold text-red-500">{formatCurrency(total)}</p></div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-col md:flex-row justify-end gap-4 pt-4 border-t border-gray-800">
                            <Button type="button" variant="secondary" onClick={handleExportCsv}><Printer size={16}/> Exportar a CSV</Button>
                            <Button type="submit"><Save size={16}/> Guardar Venta</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Modales */}
            <AccountSelectionModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSelect={handleAccountSelect} />
            <PdfDisplayModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} content={extractedPdfText} onAutocomplete={handleAutocomplete} />
            <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} variant={feedbackVariant} message={feedbackMessage} />
        </motion.div>
    );
};

export default SalesPage;
