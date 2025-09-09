
import React from 'react';
import { LayoutDashboard, FileText, Book, List, Library, BarChart2, Users, Landmark } from 'lucide-react';
import { NavItem } from './types';

export const navItems: NavItem[] = [
    {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={20} />,
    },
    {
        path: '/clients',
        label: 'Clientes',
        icon: <Users size={20} />,
    },
    {
        path: '/consulta-ruc',
        label: 'Consulta Ruc',
        icon: <FileText size={20} />,
    },
    {
        path: '/sales',
        label: 'Ventas',
        icon: <FileText size={20} />,
    },
    {
        path: '/purchases',
        label: 'Compras',
        icon: <FileText size={20} />, // Changed from ShoppingCart to FileText for consistency
    },
    {
        path: '/accounting-entries',
        label: 'Asientos Contables',
        icon: <Book size={20} />,
    },
    {
        path: '/chart-of-accounts',
        label: 'Plan Contable',
        icon: <List size={20} />,
    },
    {
        path: '/ledgers',
        label: 'Libros Contables',
        icon: <Library size={20} />,
    },
    {
        path: '/banks',
        label: 'Bancos',
        icon: <Landmark size={20} />,
    },
    {
        path: '/income-statement',
        label: 'Estado de Resultados',
        icon: <BarChart2 size={20} />,
    }
];
