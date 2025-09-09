
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account } from '../types';
import initialPcge from '../pcge.json';

// --- INICIO: Nueva función recursiva para aplanar el PCGE ---
const flattenPcge = (nodes: any[], seenCodes = new Set<string>()): { cuenta: string; descripcion: string }[] => {
    let flatList: { cuenta: string; descripcion: string }[] = [];

    for (const node of nodes) {
        if (node && node.codigo && node.nombre && !seenCodes.has(node.codigo)) {
            seenCodes.add(node.codigo);
            flatList.push({ cuenta: node.codigo, descripcion: node.nombre });
            if (node.children && node.children.length > 0) {
                flatList = flatList.concat(flattenPcge(node.children, seenCodes));
            }
        }
    }

    return flatList;
};
// --- FIN: Nueva función recursiva ---

// Mapeamos el PCGE aplanado a la estructura del tipo Account
const mapPcgeToAccounts = (pcge: { cuenta: string; descripcion: string }[]): Account[] => {
    // Filtrar para asegurar que el item y la cuenta existen y son strings.
    return pcge.filter(item => item && typeof item.cuenta === 'string').map(item => {
        const code = item.cuenta.trim();
        
        // Lógica de cálculo de nivel mejorada y más clara.
        let level = 0;
        const len = code.length;
        if (len > 2) {
            // Nivel 1: 101 (len 3)
            // Nivel 2: 1011 (len 4)
            // ... y así sucesivamente
            level = len - 2;
        }

        return {
            code: code,
            description: item.descripcion,
            type: 'Activo', // Tipo por defecto, se puede mejorar
            isSub: len > 2,
            level: level,
        };
    });
};

interface AccountsContextType {
    accounts: Account[];
    loading: boolean;
    addAccount: (account: Account) => void;
    updateAccount: (account: Account) => void;
    deleteAccount: (code: string) => void;
    getAccountByCode: (code: string) => Account | undefined;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const AccountsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Aplanar la estructura jerárquica del JSON
        const flatPcge = flattenPcge(initialPcge);
        // 2. Mapear la lista aplanada a la estructura de Account que usa la app
        const processedAccounts = mapPcgeToAccounts(flatPcge);
        setAccounts(processedAccounts.sort((a, b) => a.code.localeCompare(b.code)));
        setLoading(false);
    }, []);

    const addAccount = (account: Account) => {
        // Lógica para calcular el nivel de la nueva cuenta
        let level = 0;
        if (account.code.length > 2) level = account.code.length - 2;
        if (account.code.length > 4) level = account.code.length - 3 + 1;
        if (account.code.length > 6) level = account.code.length - 4 + 2;

        const newAccount: Account = {
            ...account,
            isSub: account.code.length > 2,
            level: level,
        };

        const newAccounts = [...accounts, newAccount].sort((a, b) => a.code.localeCompare(b.code));
        setAccounts(newAccounts);
    };

    const updateAccount = (updatedAccount: Account) => {
        setAccounts(accounts.map(acc => acc.code === updatedAccount.code ? updatedAccount : acc));
    };

    const deleteAccount = (code: string) => {
        setAccounts(accounts.filter(acc => acc.code !== code));
    };

    const getAccountByCode = (code: string): Account | undefined => {
        return accounts.find(acc => acc.code === code);
    };

    return (
        <AccountsContext.Provider value={{ accounts, loading, addAccount, updateAccount, deleteAccount, getAccountByCode }}>
            {children}
        </AccountsContext.Provider>
    );
};

export const useAccounts = (): AccountsContextType => {
    const context = useContext(AccountsContext);
    if (!context) {
        throw new Error('useAccounts debe ser usado dentro de un AccountsProvider');
    }
    return context;
};
