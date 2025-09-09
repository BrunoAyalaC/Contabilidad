import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useClient } from '../contexts/ClientContext';
import { cn } from '../lib/utils';
import { CheckCircle } from 'lucide-react';
import { Trash2, Plus } from 'lucide-react';

const ClientsPage: React.FC = () => {
    // unify client hook to avoid multiple context calls
    const { clients, selectedClient, selectClient, addClient, removeClient } = useClient();
    const [newRuc, setNewRuc] = useState('');
    const [adding, setAdding] = useState(false);

    const handleAddByRuc = async () => {
        if (!newRuc || newRuc.trim().length < 8) return;
        setAdding(true);
        try {
            // 1) check DB if exists
            // @ts-ignore
            const local = await window.electronAPI.getClientByRuc(newRuc.trim());
            if (local && local.success && local.found && local.client) {
                alert('Cliente ya existe en la base de datos');
                setAdding(false);
                return;
            }
            // 2) otherwise query SUNAT (reusing consultaRuc)
            // @ts-ignore
            const res = await window.electronAPI.consultaRuc(newRuc.trim());
            if (res && res.success && res.result) {
                const raw = res.result.raw || res.result;
                const mapped = res.result.mapped || (raw && raw.mapped) || {};
                const clientToAdd = {
                    ruc: newRuc.trim(),
                    name: mapped.nombre_comercial || mapped.nombre || mapped.razon_social || '',
                    address: mapped.domicilio_fiscal || '',
                    status: mapped.estado_contribuyente || 'Activo',
                    condition: mapped.condicion_contribuyente || 'Habido',
                    raw: raw
                };
                const added = await addClient(clientToAdd);
                if (added && added.success) {
                    setNewRuc('');
                    alert('Cliente agregado');
                } else {
                    alert('No se pudo agregar cliente: ' + (added && added.message));
                }
            } else {
                alert('No se encontró información en SUNAT: ' + (res && res.message));
            }
        } catch (e) { console.error(e); alert('Error agregando cliente: ' + String(e)); }
        setAdding(false);
    };

    const handleRemove = async (rucOrId: string | number) => {
        if (!confirm('¿Eliminar este cliente?')) return;
        const res = await removeClient(rucOrId);
        if (res && res.success) alert('Cliente eliminado');
        else alert('No se pudo eliminar: ' + (res && res.message));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
        >
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-bold text-red-500">Gestión de Clientes</h2>
                    <p className="text-sm text-gray-400">Seleccione un cliente para ver su información y gestionar sus operaciones.</p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Quick-select chips: precargar clientes existentes para seleccionar con un click */}
                        <div className="flex gap-2 items-center overflow-x-auto py-1">
                            {clients.slice(0, 20).map(c => (
                                <motion.button
                                    key={`chip-${c.id}`}
                                    onClick={() => selectClient(c.id)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                                        selectedClient?.id === c.id
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'bg-[#0f0f0f] text-gray-200 border border-gray-800 hover:bg-red-600/10'
                                    )}
                                    title={`${c.name} — RUC: ${c.ruc}`}
                                >
                                    <span className="font-semibold truncate max-w-[12rem]">{c.name}</span>
                                    <small className="text-xs text-gray-400">{c.ruc}</small>
                                </motion.button>
                            ))}
                            {clients.length === 0 && (
                                <div className="text-sm text-gray-500">No hay clientes aún.</div>
                            )}
                        </div>

                        <div className="flex gap-2 items-center">
                            <input
                                className="bg-[#0f0f0f] border border-gray-700 text-gray-200 rounded-lg px-3 h-10 w-64 placeholder:text-gray-500"
                                placeholder="Ingresar RUC"
                                value={newRuc}
                                onChange={e => setNewRuc(e.target.value)}
                            />
                            <motion.button
                                onClick={handleAddByRuc}
                                disabled={adding}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-colors',
                                    adding
                                        ? 'opacity-60 cursor-wait bg-red-500 text-white'
                                        : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600'
                                )}
                                title="Buscar en SUNAT y agregar a la base de datos"
                            >
                                <Plus size={14} />
                                <span>Buscar y Agregar</span>
                            </motion.button>
                        </div>
                        <hr className="border-gray-800" />
                        {clients.map(client => (
                            <motion.div
                                key={client.id}
                                className={cn(
                                    "p-4 rounded-lg border-2 transition-all cursor-pointer",
                                    selectedClient?.id === client.id
                                        ? 'border-red-500 bg-red-500/10'
                                        : 'border-gray-800 bg-[#0f0f0f] hover:border-red-500/50'
                                )}
                                onClick={() => selectClient(client.id)}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white">{client.name}</h3>
                                        <p className="text-sm text-gray-400 font-mono">RUC: {client.ruc}</p>
                                        <p className="text-sm text-gray-500">{client.address}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs">
                                            <span className={`px-2 py-1 rounded-full ${client.status === 'Activo' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                {client.status}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full ${client.condition === 'Habido' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {client.condition}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedClient?.id === client.id && (
                                        <div className="flex items-center gap-2 text-red-500">
                                            <CheckCircle size={20} />
                                            <span className="font-semibold">Activo</span>
                                        </div>
                                    )}
                                    <div className="ml-4">
                                        <button title="Eliminar" className="text-gray-400 hover:text-red-500" onClick={() => handleRemove(client.id)}><Trash2 /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ClientsPage;
