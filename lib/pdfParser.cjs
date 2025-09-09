// Este archivo contiene la lógica para parsear el texto de una factura electrónica.
// La función principal tomará el texto crudo y devolverá un objeto estructurado.

// Función auxiliar para limpiar y convertir a número
const cleanAndParseFloat = (str) => {
    if (typeof str !== 'string') return null;
    return parseFloat(str.replace(/,/g, ''));
};

// --- FUNCIONES DE PARSEO POR SECCIÓN ---

/**
 * Parsea los datos del emisor de la factura.
 * @param {string} text - El texto completo de la factura.
 * @returns {{name: string|null, ruc: string|null}}
 */
function parseEmitter(text) {
    const emitter = { name: null, ruc: null };
    const emitterRucMatch = text.match(/RUC:?\s*(\d{11})/);
    if (emitterRucMatch) {
        emitter.ruc = emitterRucMatch[1].trim();
        const emitterNameRegex = /(?:FACTURA ELECTRONICA|BOLETA DE VENTA|NOTA DE CREDITO)\s*([^\n\r]*?)(?:\s*RUC:|\s*CAL\.|\s*Fecha de Emisión)/i;
        const emitterNameMatch = text.match(emitterNameRegex);
        if (emitterNameMatch) {
            emitter.name = emitterNameMatch[1].trim();
        }
    }
    return emitter;
}

/**
 * Parsea los datos del receptor de la factura.
 * @param {string} text - El texto completo de la factura.
 * @returns {{name: string|null, ruc: string|null}}
 */
function parseReceiver(text) {
    const receiver = { name: null, ruc: null };
    const receiverSectionMatch = text.match(/Señor\(es\):?([\s\S]*?)(?:Establecimiento del Emisor|Cantidad Unidad Medida|Sub Total Ventas)/);
    if (receiverSectionMatch) {
        const receiverText = receiverSectionMatch[1];
        const rucMatch = receiverText.match(/RUC\s*:\s*(\d{11})/);
        if (rucMatch) {
            receiver.ruc = rucMatch[1].trim();
        }
        const nameMatch = receiverText.match(/([\s\S]+?)(?:RUC|CAL\.|Establecimiento)/);
        if (nameMatch) {
            receiver.name = nameMatch[1].trim().replace(/Señor\(es\):?\s*/, '').replace(/:$/, '');
        }
    }
    return receiver;
}

/**
 * Parsea los datos generales de la factura (ID, fecha).
 * @param {string} text - El texto completo de la factura.
 * @returns {{invoiceId: string|null, date: string|null}}
 */
function parseGeneralData(text) {
    const generalData = { invoiceId: null, date: null };
    // Permitir espacios entre letra y números (OCR puede insertar espacios). Normalizar al devolver.
    const invoiceIdMatch = text.match(/([EF]\s*\d{1,3}\s*-\s*\d+)/i);
    if (invoiceIdMatch) {
        generalData.invoiceId = invoiceIdMatch[1].replace(/\s+/g, '').trim();
    }
    const dateMatch = text.match(/Fecha de Emisión\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
        generalData.date = dateMatch[1].trim();
    }
    // Intentar capturar la forma de pago (Contado / Crédito)
    // Usamos lookahead para detener la captura antes de 'Cantidad' o 'Unidad' incluso si están pegados
    const paymentMatch = text.match(/Forma de pago\s*:?\s*([^\n\r]+?)(?=(?:Cantidad|Unidad|Sub Total|Valor de Venta|$))/i);
    if (paymentMatch) {
        generalData.paymentCondition = paymentMatch[1].trim().replace(/\s+$/, '');
    }
    return generalData;
}

/**
 * Parsea los ítems de la factura.
 * @param {string} text - El texto completo de la factura.
 * @returns {Array<{quantity: number, unitMeasure: string, description: string, unitPrice: number, total: number}>}
 */
function parseItems(text) {
    const items = [];
    // Regex para capturar el bloque completo de ítems
    const itemsBlockRegex = /Cantidad\s+Unidad\s+Medida\s+Descripci[oó]n\s+Valor\s+Unitario\s+ICBPER([\s\S]*?)(?:Valor de Venta de Operaciones Gratuitas|Sub Total Ventas)/i;
    const itemsBlockMatch = text.match(itemsBlockRegex);

    if (itemsBlockMatch && itemsBlockMatch[1]) {
        const itemsText = itemsBlockMatch[1];
        // Regex para cada línea de ítem dentro del bloque
        // Captura: Cantidad, Unidad Medida (opcional), Descripción, Valor Unitario, ICBPER
        const itemLineRegex = /^\s*(\d+(?:[\.,]\d+)?)\s+([A-ZÁ-Ú\s]+?)\s+(.*?)\s+(\d+[\.,]\d{2})\s+(\d+[\.,]\d{2})\s*$/gm;
        let lineMatch;

        while ((lineMatch = itemLineRegex.exec(itemsText)) !== null) {
            const quantity = cleanAndParseFloat(lineMatch[1].replace(/,/g, '.')) || 0;
            let unitMeasure = (lineMatch[2] || '').trim();
            let description = (lineMatch[3] || '').replace(/\s{2,}/g, ' ').trim();
            const unitPrice = cleanAndParseFloat(lineMatch[4]) || 0;
            const icbper = cleanAndParseFloat(lineMatch[5]) || 0;

            items.push({
                description: description,
                quantity: quantity,
                unitMeasure: unitMeasure,
                unitPrice: unitPrice,
                total: quantity * unitPrice,
                icbper: icbper
            });
        }
    }
    return items;
}

/**
 * Parsea los totales de la factura (subtotal, IGV, total).
 * @param {string} text - El texto completo de la factura.
 * @returns {{subtotal: number|null, igv: number|null, total: number|null}}
 */
function parseTotals(text) {
    const totals = { subtotal: null, igv: null, total: null };
    const subtotalMatch = text.match(/Sub Total Ventas\s*:\s*S\/\s*([\d,]+\.\d{2})/);
    if (subtotalMatch) {
        totals.subtotal = cleanAndParseFloat(subtotalMatch[1]);
    }
    const igvMatch = text.match(/IGV\s*:\s*S\/\s*([\d,]+\.\d{2})/);
    if (igvMatch) {
        totals.igv = cleanAndParseFloat(igvMatch[1]);
    }
    const totalMatch = text.match(/Importe Total\s*:\s*S\/\s*([\d,]+\.\d{2})/);
    if (totalMatch) {
        totals.total = cleanAndParseFloat(totalMatch[1]);
    }
    return totals;
}

/**
 * Función principal para parsear el texto completo de una factura.
 * @param {string} text - El texto crudo de la factura.
 * @returns {object} - Un objeto con todos los datos parseados.
 */
function parseInvoiceText(text) {
    // Normalizar texto: insertar espacios entre dígitos y letras pegadas por OCR
    let norm = String(text || '');
    // Insertar espacio entre dígito seguido de letra (ej: '46.70KILOGRAMO' -> '46.70 KILOGRAMO')
    norm = norm.replace(/(\d)(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1 ');
    // Insertar espacio entre letra seguida de dígito (ej: 'KILOGRAMO46.70' -> 'KILOGRAMO 46.70')
    norm = norm.replace(/([A-Za-zÀ-ÖØ-öø-ÿ])(?=\d)/g, '$1 ');
    // Insertar espacio antes de números decimales pegados a texto (ej: '20/135.000.00' -> '20/1 35.00 0.00')
    norm = norm.replace(/([A-Za-zÀ-ÖØ-öø-ÿ])(?=\d+\.[0-9]{2})/g, '$1 ');
    // Insertar espacio entre una letra minúscula y una mayúscula (ej: 'CantidadUnidad' -> 'Cantidad Unidad')
    norm = norm.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Specific fix for concatenated item headers
    norm = norm.replace(/UnitarioICBPER/g, 'Unitario ICBPER');
    // Normalizar espacios múltiples
    norm = norm.replace(/\s{2,}/g, ' ');

    const emitterData = parseEmitter(norm);
    const receiverData = parseReceiver(norm);
    const generalData = parseGeneralData(norm);
    const itemsData = parseItems(norm);
    const totalsData = parseTotals(norm);

    return {
        emitter: emitterData,
        receiver: receiverData,
        invoiceId: generalData.invoiceId,
        date: generalData.date,
        paymentCondition: generalData.paymentCondition,
        items: itemsData,
        subtotal: totalsData.subtotal,
        igv: totalsData.igv,
        total: totalsData.total,
    };
}

// Exportamos la función principal para que pueda ser usada en otros archivos
module.exports = { parseInvoiceText };