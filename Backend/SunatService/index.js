const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const db = require('./database.js');

const app = express();
const PORT = 5008; // Puerto para el nuevo SunatService

app.use(cors());
app.use(express.json());

// Endpoint para consultar RUC
app.get('/api/consulta-ruc/:ruc', (req, res) => {
  const { ruc } = req.params;

  if (!/^[0-9]{11}$/.test(ruc)) {
    return res.status(400).json({ error: 'RUC inválido. Debe contener 11 dígitos numéricos.' });
  }

  // 1. Buscar en la base de datos (caché)
  const sql = `SELECT * FROM Contribuyentes WHERE Ruc = ?`;
  db.get(sql, [ruc], (err, row) => {
    if (err) {
      console.error('Error en la base de datos:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor al consultar la base de datos.' });
    }

    // Opcional: Lógica de caché para decidir si los datos son suficientemente frescos.
    // Por ahora, si existe, lo devolvemos.
    if (row) {
      console.log(`[Cache HIT] Devolviendo datos para el RUC: ${ruc}`);
      // Parseamos las actividades económicas para devolver un array
      row.ActividadesEconomicas = row.ActividadesEconomicas ? row.ActividadesEconomicas.split(';').map(s => s.trim()) : [];
      return res.json(row);
    }

    // 2. Si no está en caché, ejecutar el script de scraping
    console.log(`[Cache MISS] No se encontraron datos para el RUC: ${ruc}. Ejecutando scraper...`);
    const scriptPath = path.join(__dirname, '..', 'Scrapping', 'consulta-ruc-playwright.js');
    const command = `node "${scriptPath}" ${ruc}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar el script: ${error.message}`);
        return res.status(500).json({ error: 'El script de scraping falló.', details: error.message });
      }
      if (stderr) {
        console.error(`Stderr del script: ${stderr}`);
        // No siempre es un error fatal, pero es bueno registrarlo
      }

      try {
        const result = JSON.parse(stdout);
        const data = result.object; // Usamos el objeto plano que genera el script

        if (!data || !data.numero_de_ruc) {
            return res.status(404).json({ error: 'No se pudo obtener la información del RUC. La página de SUNAT puede haber cambiado o no hay datos.' });
        }

        // 3. Guardar el nuevo resultado en la base de datos
        const insertSql = `
          INSERT INTO Contribuyentes (
            Ruc, TipoContribuyente, TipoDocumento, NombreComercial, FechaInscripcion, 
            FechaInicioActividades, EstadoContribuyente, CondicionContribuyente, DomicilioFiscal, 
            SistemaEmisionComprobante, ActividadComercioExterior, SistemaContabilidad, 
            ActividadesEconomicas, ComprobantesDePago, SistemaEmisionElectronica, 
            EmisorElectronicoDesde, ComprobantesElectronicos, AfiliadoPleDesde, Padrones, UltimaActualizacion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(Ruc) DO UPDATE SET
            TipoContribuyente=excluded.TipoContribuyente,
            NombreComercial=excluded.NombreComercial,
            EstadoContribuyente=excluded.EstadoContribuyente,
            CondicionContribuyente=excluded.CondicionContribuyente,
            DomicilioFiscal=excluded.DomicilioFiscal,
            UltimaActualizacion=excluded.UltimaActualizacion
        `;

        const params = [
          data.ruc_consultado || ruc,
          data.tipo_contribuyente,
          data.tipo_de_documento,
          data.nombre_comercial,
          data.fecha_de_inscripcion,
          data.fecha_de_inicio_de_actividades,
          data.estado_del_contribuyente,
          data.condicion_del_contribuyente,
          data.domicilio_fiscal,
          data.sistema_emision_de_comprobante,
          data.actividad_comercio_exterior, // Este campo no parece estar en el JSON, se guardará como null
          data.sistema_contabilidad,
          data.actividades ? data.actividades.join('; ') : null, // Guardamos el array como texto separado por punto y coma
          data.comprobantes_de_pago,
          data.sistema_de_emision_electronica,
          data.emisor_electronico_desde,
          data.comprobantes_electronicos,
          data.afiliado_al_ple_desde,
          data.padrones,
          new Date().toISOString()
        ];

        db.run(insertSql, params, function(err) {
          if (err) {
            console.error('Error al guardar en la base de datos:', err.message);
            // No devolvemos error al cliente, ya que tenemos los datos. Solo lo registramos.
          }
          console.log(`[DB] Datos para el RUC ${ruc} guardados/actualizados.`);
        });

        // 4. Devolver el resultado al cliente
        res.json(data);

      } catch (parseError) {
        console.error('Error al parsear la salida del script:', parseError, 'Salida recibida:', stdout);
        res.status(500).json({ error: 'La respuesta del script de scraping no es un JSON válido.' });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`SunatService escuchando en http://localhost:${PORT}`);
});