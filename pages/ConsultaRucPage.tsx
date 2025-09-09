import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface SunatData {
    ruc?: string;
    tipo_contribuyente?: string;
    tipo_documento?: string;
    nombre_comercial?: string;
    fecha_inscripcion?: string;
    fecha_inicio_actividades?: string;
    estado_contribuyente?: string;
    condicion_contribuyente?: string;
    domicilio_fiscal?: string;
    sistema_emision_comprobante?: string;
    actividad_comercio_exterior?: string;
    sistema_contabilidad?: string;
    actividades_economicas?: string;
    comprobantes_impresion?: string;
    sistema_emision_electronica?: string;
    emisor_electronico_desde?: string;
    comprobantes_electronicos?: string;
    afiliado_ple_desde?: string;
    padrones?: string;
    raw?: any;
}

const ConsultaRucPage: React.FC = () => {
    const [ruc, setRuc] = useState('');
    const [loading, setLoading] = useState(false);
    const [progressActive, setProgressActive] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [data, setData] = useState<SunatData | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    // indica si el registro ya existe en la DB
    const [existsInDb, setExistsInDb] = useState(false);
    const progressInterval = useRef<number | null>(null);
    const unsubscribeProgress = useRef<(() => void) | null>(null);

    const handleSearch = async () => {
        setMessage(null);
        if (!ruc || ruc.trim().length < 8) { setMessage('Ingrese un RUC válido'); return; }
        setLoading(true);
        // iniciar indicador de progreso
        setProgressActive(true);
        setProgressPercent(2);

        // si existe la API de progreso del preload, suscribirse y usar valores reales
        try {
            // @ts-ignore
            if (window.electronProgress && typeof window.electronProgress.subscribe === 'function') {
                // subscribe devuelve función para desuscribir en nuestro preload wrapper
                // la API expone: subscribe(cb) -> unsubscribe
                const unsub = window.electronProgress.subscribe((payload: any) => {
                    if (payload && typeof payload.percent === 'number') {
                        setProgressPercent(Math.max(0, Math.min(100, payload.percent)));
                    } else if (payload && payload.step === 'done') {
                        setProgressPercent(100);
                    }
                });
                unsubscribeProgress.current = unsub;
            }
        } catch (e) {
            // noop
        }

        // simulación de progreso para UX: incrementa lentamente hasta 95% si no hay eventos reales
        progressInterval.current = window.setInterval(() => {
            setProgressPercent(prev => {
                if (prev >= 95) return prev;
                // crecer con paso variable
                const step = prev < 60 ? 6 : prev < 85 ? 3 : 1;
                return Math.min(95, prev + step + Math.floor(Math.random() * 2));
            });
        }, 600) as unknown as number;
        try {
            // Primero consultar en la DB local si ya existe
            // @ts-ignore
            const local = await window.electronAPI.getSunatByRuc(ruc.trim());
            if (local && local.success && local.found && local.row) {
                // usar datos desde la DB y no hacer scraping
                const row = local.row;
                // parsed fields suelen estar en columnas; componer objeto similar al mapeado
                const mappedFromDb: any = {
                    ruc: row.ruc,
                    tipo_contribuyente: row.tipo_contribuyente,
                    tipo_documento: row.tipo_documento,
                    nombre_comercial: row.nombre_comercial,
                    fecha_inscripcion: row.fecha_inscripcion,
                    fecha_inicio_actividades: row.fecha_inicio_actividades,
                    estado_contribuyente: row.estado_contribuyente,
                    condicion_contribuyente: row.condicion_contribuyente,
                    domicilio_fiscal: row.domicilio_fiscal,
                    sistema_emision_comprobante: row.sistema_emision_comprobante,
                    actividad_comercio_exterior: row.actividad_comercio_exterior,
                    sistema_contabilidad: row.sistema_contabilidad,
                    actividades_economicas: row.actividades_economicas,
                    comprobantes_impresion: row.comprobantes_impresion,
                    sistema_emision_electronica: row.sistema_emision_electronica,
                    emisor_electronico_desde: row.emisor_electronico_desde,
                    comprobantes_electronicos: row.comprobantes_electronicos,
                    afiliado_ple_desde: row.afiliado_ple_desde,
                    padrones: row.padrones,
                    raw: row.raw_json || null
                };
                setData(mappedFromDb as SunatData);
                setExistsInDb(true);
                setMessage('Encontrado en la base de datos local. No se realizará scraping.');
                // detener el progreso si se inició
                setProgressPercent(100);
                if (progressInterval.current) { clearInterval(progressInterval.current as any); progressInterval.current = null; }
                setTimeout(() => { setProgressActive(false); setProgressPercent(0); setLoading(false); }, 250);
                return;
            }
            // No existe en DB → proceder a scraping
            setExistsInDb(false);
            // llamar al preload API
            // @ts-ignore
            const res = await window.electronAPI.consultaRuc(ruc.trim());
            console.debug('sunat consulta result:', res);
            if (res && res.success && res.result) {
                // main.cjs devuelve result: { raw, mapped } (o result may be raw)
                const resultObj: any = res.result;
                // Prefer mapped if provided by main
                let mapped: any = null;
                if (resultObj.mapped) mapped = resultObj.mapped;
                else if (resultObj.raw && resultObj.raw.mapped) mapped = resultObj.raw.mapped;
                else if (resultObj.mapped === undefined && resultObj.raw && typeof resultObj.raw === 'object') mapped = resultObj.raw.mapped || null;

                if (mapped) {
                    // Ensure ruc present
                    mapped.ruc = mapped.ruc || ruc.trim();
                    mapped.raw = resultObj.raw || resultObj;
                    setData(mapped as SunatData);
                    setExistsInDb(false);
                } else {
                    // Si no se mapeó, al menos mostrar el raw para inspección
                    setData({ ruc: ruc.trim(), raw: resultObj.raw || resultObj });
                    setExistsInDb(false);
                    setMessage('Se obtuvo respuesta, pero no se pudo mapear campos automáticamente.');
                }
            } else {
                setMessage(res && res.message ? res.message : 'No se encontró información');
                setData(null);
            }
        } catch (err) {
            console.error('Consulta RUC error', err);
            setMessage(err && err.message ? err.message : String(err));
            setData(null);
        } finally {
            // asegurar 100% y esperar un momento para que el usuario lo vea
            setProgressPercent(100);
            // limpiar simulador y suscripción
            if (progressInterval.current) {
                clearInterval(progressInterval.current as any);
                progressInterval.current = null;
            }
            if (unsubscribeProgress.current) {
                try { unsubscribeProgress.current(); } catch (e) { /* noop */ }
                unsubscribeProgress.current = null;
            }
            // dar un pequeño retardo para UX antes de ocultar la barra
            setTimeout(() => {
                setProgressActive(false);
                setProgressPercent(0);
                setLoading(false);
            }, 350);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleSave = async () => {
        if (!data) { setMessage('No hay datos para guardar'); return; }
        try {
            // @ts-ignore
            const res = await window.electronAPI.saveSunatData(data);
            if (res && res.success) {
                setMessage('Datos guardados correctamente');
            } else {
                setMessage(res.message || 'Error guardando datos');
            }
        } catch (err) {
            console.error('Save error', err);
            setMessage(err && err.message ? err.message : String(err));
        }
    };

    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-bold text-red-500">Consulta Ruc</h2>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <Input placeholder="Ingrese número de RUC" value={ruc} onChange={e => setRuc(e.target.value)} onKeyDown={handleKeyDown} />
                            <Button type="button" onClick={handleSearch} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</Button>
                            <Button type="button" variant="secondary" onClick={handleSave} disabled={!data || existsInDb}>Agregar a BD</Button>
                        </div>

                        {/* Indicador de progreso mientras la consulta está activa */}
                        {progressActive && (
                            <div className="mt-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-full bg-gray-700 rounded h-2 overflow-hidden">
                                        <div className="bg-green-400 h-2 rounded transition-all" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                    <div className="text-sm text-gray-200 w-12 text-right">{progressPercent}%</div>
                                </div>
                                <div className="mt-2 text-xs text-gray-300">{loading ? 'Consultando SUNAT — espere por favor' : ''}</div>
                            </div>
                        )}

                        {message && <div className="text-yellow-400">{message}</div>}

                        {data && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div><strong>Número de RUC:</strong> {data.ruc}</div>
                                    <div><strong>Tipo Contribuyente:</strong> {data.tipo_contribuyente || '-'}</div>
                                    <div><strong>Tipo de Documento:</strong> {data.tipo_documento || '-'}</div>
                                    <div><strong>Nombre Comercial:</strong> {data.nombre_comercial || '-'}</div>
                                    <div><strong>Fecha de Inscripción:</strong> {data.fecha_inscripcion || '-'}</div>
                                    <div><strong>Fecha de Inicio de Actividades:</strong> {data.fecha_inicio_actividades || '-'}</div>
                                    <div><strong>Estado del Contribuyente:</strong> {data.estado_contribuyente || '-'}</div>
                                    <div><strong>Condición del Contribuyente:</strong> {data.condicion_contribuyente || '-'}</div>
                                    <div><strong>Domicilio Fiscal:</strong> {data.domicilio_fiscal || '-'}</div>
                                </div>
                                <div className="space-y-2">
                                    <div><strong>Sistema Emisión de Comprobante:</strong> {data.sistema_emision_comprobante || '-'}</div>
                                    <div><strong>Actividad Comercio Exterior:</strong> {data.actividad_comercio_exterior || '-'}</div>
                                    <div><strong>Sistema Contabilidad:</strong> {data.sistema_contabilidad || '-'}</div>
                                    <div><strong>Actividad(es) Económica(s):</strong> {data.actividades_economicas || '-'}</div>
                                    <div><strong>Comprobantes de Pago c/aut. de impresión:</strong> {data.comprobantes_impresion || '-'}</div>
                                    <div><strong>Sistema de Emisión Electrónica:</strong> {data.sistema_emision_electronica || '-'}</div>
                                    <div><strong>Emisor electrónico desde:</strong> {data.emisor_electronico_desde || '-'}</div>
                                    <div><strong>Comprobantes Electrónicos:</strong> {data.comprobantes_electronicos || '-'}</div>
                                    <div><strong>Afiliado al PLE desde:</strong> {data.afiliado_ple_desde || '-'}</div>
                                    <div><strong>Padrones:</strong> {data.padrones || '-'}</div>
                                </div>
                            </div>
                        )}
                        {/* (raw viewer eliminado - ya no disponible) */}

                        {/* Si no hay campos mapeados visibles, mostrar pista */}
                        {data && !Object.values(data).some(v => v && v !== data.raw && v !== data.ruc) && (
                            <div className="text-gray-400 text-sm">Se obtuvo respuesta, pero los campos específicos no pudieron ser extraídos automáticamente.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConsultaRucPage;
