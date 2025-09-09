import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Receipt, Users, CheckCircle, DollarSign, AlertCircle } from 'lucide-react';
import { useClient } from '../contexts/ClientContext';
import { SalesChart } from '../components/charts/SalesChart';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 100 }
    },
};

const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string; }> = ({ icon, value, label }) => {
    return (
        <motion.div
            className="bg-black/50 border border-gray-800 backdrop-blur-sm rounded-xl p-4 text-center"
            whileHover={{ y: -5, scale: 1.05, boxShadow: "0 10px 20px rgba(220, 38, 38, 0.2)" }}
            transition={{ type: 'spring', stiffness: 300 }}
            variants={itemVariants}
        >
            <div className="text-red-500 mb-2 mx-auto w-fit">{icon}</div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
        </motion.div>
    );
}

const DashboardPage: React.FC = () => {
    const { selectedClient } = useClient();

    if (!selectedClient) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                Seleccione un cliente para ver su dashboard.
            </div>
        );
    }

    const totalInvoiced = selectedClient.invoices.reduce((acc, inv) => acc + inv.total, 0);
    const totalPurchases = selectedClient.purchases.reduce((acc, pur) => acc + pur.total, 0);
    const pendingInvoices = selectedClient.invoices.length; // Simplified logic

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="space-y-6"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold text-white">Dashboard: <span className="text-red-500">{selectedClient.name}</span></h1>
                <p className="text-gray-400">Resumen de la actividad financiera del cliente.</p>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <StatCard icon={<DollarSign size={32} />} value={`S/ ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} label="Total Facturado" />
                <StatCard icon={<Receipt size={32} />} value={`S/ ${totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} label="Total Compras" />
                <StatCard icon={<Users size={32} />} value={selectedClient.invoices.length.toString()} label="Facturas Emitidas" />
                <StatCard icon={<AlertCircle size={32} />} value={pendingInvoices.toString()} label="Cuentas por Cobrar" />
            </motion.div>

            <motion.div variants={itemVariants}>
                <div className="bg-[#1a1a1a] border border-red-600/30 rounded-lg shadow-lg shadow-black/30 p-6 h-96">
                    <h2 className="text-xl font-bold text-red-500 mb-4">Ventas Mensuales</h2>
                    <SalesChart invoiceData={selectedClient.invoices} />
                </div>
            </motion.div>

        </motion.div>
    );
};

export default DashboardPage;