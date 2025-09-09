import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SideNav } from './components/SideNav';
import { navItems } from './constants';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import AccountingEntriesPage from './pages/AccountingEntriesPage';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import LedgersPage from './pages/LedgersPage';
import IncomeStatementPage from './pages/IncomeStatementPage';
import LoginPage from './pages/LoginPage';
import ClientsPage from './pages/ClientsPage';
import ConsultaRucPage from './pages/ConsultaRucPage';
import BanksPage from './pages/BanksPage';
import { ClientProvider } from './contexts/ClientContext';
import { AccountsProvider } from './contexts/AccountsContext';

const AnimatedRoutes: React.FC = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/consulta-ruc" element={<ConsultaRucPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/purchases" element={<PurchasesPage />} />
                <Route path="/accounting-entries" element={<AccountingEntriesPage />} />
                <Route path="/chart-of-accounts" element={<ChartOfAccountsPage />} />
                <Route path="/ledgers" element={<LedgersPage />} />
                <Route path="/banks" element={<BanksPage />} />
                <Route path="/income-statement" element={<IncomeStatementPage />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </AnimatePresence>
    );
}

const AppContent: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }

    return (
        <AccountsProvider>
            <ClientProvider>
                <div className="flex h-screen bg-black">
                    <SideNav navItems={navItems} />
                    <main className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#0a0a0a]">
                            <AnimatedRoutes />
                        </div>
                    </main>
                </div>
            </ClientProvider>
        </AccountsProvider>
    );
};

const App: React.FC = () => {
  return (
    <HashRouter>
        <AppContent />
    </HashRouter>
  );
};

export default App;