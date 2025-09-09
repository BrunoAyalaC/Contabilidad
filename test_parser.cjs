// Script temporal para probar el parser de PDF con múltiples ejemplos

// Mock Gemini API call
async function callGeminiApi(invoiceText) {
    // Simulate Gemini's response based on the sample text
    if (invoiceText.includes("E001-595")) { // Sample 1
        return {
            emitter: { name: "ENRIQUEZ CUETO JUDY ENRIQUE", ruc: "10702859676" },
            receiver: { name: "TERREL HIDALGO GINA PILAR", ruc: "10427740264" },
            invoiceId: "E001-595",
            date: "28/08/2025",
            paymentCondition: "Contado",
            items: [
                {
                    description: "JERSEY 30/1",
                    quantity: 51.70,
                    unitMeasure: "KILOGRAMO",
                    unitPrice: 32.00,
                    total: 1654.40
                }
            ],
            subtotal: 1654.40,
            igv: 297.79,
            total: 1952.19
        };
    } else if (invoiceText.includes("E001-594")) { // Sample 2
        return {
            emitter: { name: "ENRIQUEZ CUETO JUDY ENRIQUE", ruc: "10702859676" },
            receiver: { name: "TERREL HIDALGO GINA PILAR", ruc: "10427740264" },
            invoiceId: "E001-594",
            date: "27/08/2025",
            paymentCondition: "Contado",
            items: [
                {
                    description: "JERSEY 20/1",
                    quantity: 46.70,
                    unitMeasure: "KILOGRAMO",
                    unitPrice: 35.00,
                    total: 1634.50
                }
            ],
            subtotal: 1634.50,
            igv: 294.21,
            total: 1928.71
        };
    }
    return null; // Should not happen with these samples
}

// Primer texto de ejemplo (original)
const sampleText1 = `
FACTURA ELECTRONICA
ENRIQUEZ CUETO JUDY ENRIQUE
RUC: 10702859676
CAL. HIPOLITO UNANUE 1445
E001-595   (Factura y Serie)
LA VICTORIA LIMA LIMA
-
-
Fecha de Emisión : 28/08/2025 Forma de pago: Contado
Señor(es) TERREL HIDALGO GINA PILAR :
RUC : 10427740264
CAL. HIPOLITO UNANUE 1445 LIMA
-
Establecimiento del Emisor :
LIMA-LA VICTORIA
Tipo de Moneda : SOLES
Observación :
Cantidad Unidad Medida Descripción Valor Unitario ICBPER
51.70 KILOGRAMO JERSEY 30/1 32.00 0.00
Sub Total Ventas : S/ 1,654.40
Anticipos : S/ 0.00
Descuentos : S/ 0.00
Valor de Venta de Operaciones Gratuitas : S/ 0.00
Valor Venta : S/ 1,654.40
ISC : S/ 0.00
IGV : S/ 297.79
SON: UN MIL NOVECIENTOS CINCUENTA Y DOS Y 19/100 SOLES
ICBPER : S/ 0.00
Otros Cargos : S/ 0.00
Otros Tributos : S/ 0.00
Monto de redondeo : S/ 0.00
Importe Total : S/ 1,952.19
`;

// Segundo texto de ejemplo (el que causó problemas, ahora con el formato original de Muestra.md)
const sampleText2 = `
Texto crudoFACTURA ELECTRONICAENRIQUEZ CUETO JUDY ENRIQUE  CAL. HIPOLITO UNANUE 1445  LA VICTORIA - LIMA - LIMA FACTURA ELECTRONICARUC: 10702859676 E001-594 Fecha de Emisión:27/08/2025Señor(es):TERREL HIDALGO GINA PILAR  RUC :10427740264  Establecimiento del Emisor :CAL. HIPOLITO UNANUE 1445 LIMA-LIMA-LA VICTORIA Tipo de Moneda:SOLES Observación: Forma de pago: ContadoCantidadUnidad MedidaDescripciónValor UnitarioICBPER46.70KILOGRAMOJERSEY 20/135.000.00Valor de Venta de Operaciones Gratuitas:S/ 0.00   SON: UN MIL NOVECIENTOS VEINTIOCHO Y 71/100 SOLES  Sub Total Ventas:S/ 1,634.50 Anticipos:S/ 0.00 Descuentos:S/ 0.00 Valor Venta:S/ 1,634.50 ISC:S/ 0.00 IGV:S/ 294.21 ICBPER:S/ 0.00 Otros Cargos:S/ 0.00 Otros Tributos:S/ 0.00 Monto de redondeo:S/ 0.00 Importe Total:S/ 1,928.71 Esta es una representación impresa de la factura electrónica, generada en el Sistema de SUNAT. Puedeverificarla utilizando su clave SOL.CerrarAutocompletar Formulario0
`;

async function runTests() {
    console.log(`--- PARSEANDO SAMPLE 1 ---`);
    const parsedData1 = await callGeminiApi(sampleText1);
    console.log(JSON.stringify(parsedData1, null, 2));

    console.log(`
--- PARSEANDO SAMPLE 2 ---`);
    const parsedData2 = await callGeminiApi(sampleText2);
    console.log(JSON.stringify(parsedData2, null, 2));
}

runTests();