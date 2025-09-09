import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Client } from '../types';
// initialClients fallback when DB empty
import { initialClients } from '../data/mockData';

interface ClientContextType {
    clients: Client[];
    selectedClient: Client | null;
    selectClient: (clientId: number) => void;
    addClient: (client: Partial<Client>) => Promise<any>;
    removeClient: (rucOrId: string | number) => Promise<any>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

    useEffect(() => {
        // cargar clientes desde DB
        (async () => {
            try {
                // @ts-ignore
                const res = await window.electronAPI.getAllClients();
                if (res && res.success && Array.isArray(res.clients)) {
                    setClients(res.clients);
                    setSelectedClient(res.clients[0] || null);
                }
            } catch (e) { console.warn('Failed loading clients from DB', e); }
        })();
    }, []);

    const selectClient = (clientId: number) => {
        const client = clients.find(c => c.id === clientId);
        setSelectedClient(client || null);
    };

    const addClient = async (client: Partial<Client>) => {
        try {
            // @ts-ignore
            const res = await window.electronAPI.addClient(client);
            if (res && res.success) {
                // recargar listado
                const rr = await window.electronAPI.getAllClients();
                if (rr && rr.success) setClients(rr.clients);
            }
            return res;
        } catch (e) { return { success: false, message: String(e) }; }
    };

    const removeClient = async (rucOrId: string | number) => {
        try {
            // @ts-ignore
            const res = await window.electronAPI.removeClient(rucOrId);
            if (res && res.success) {
                const rr = await window.electronAPI.getAllClients();
                if (rr && rr.success) setClients(rr.clients);
            }
            return res;
        } catch (e) { return { success: false, message: String(e) }; }
    };

    return (
        <ClientContext.Provider value={{ clients, selectedClient, selectClient, addClient, removeClient }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClient = (): ClientContextType => {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
};
