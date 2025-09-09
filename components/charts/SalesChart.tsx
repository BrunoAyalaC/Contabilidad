import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Invoice } from '../../types';

interface SalesChartProps {
    invoiceData: Invoice[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ invoiceData }) => {
    const processData = () => {
        const monthlySales: { [key: string]: number } = {};
        
        invoiceData.forEach(invoice => {
            const month = new Date(invoice.date).toLocaleString('default', { month: 'short' });
            if (!monthlySales[month]) {
                monthlySales[month] = 0;
            }
            monthlySales[month] += invoice.total;
        });

        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        return monthOrder.map(month => ({
            name: month,
            Ventas: monthlySales[month] || 0,
        }));
    };

    const data = processData();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                <YAxis tick={{ fill: '#9ca3af' }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #4b5563',
                        color: '#e5e7eb'
                    }}
                    cursor={{fill: 'rgba(220, 38, 38, 0.1)'}}
                />
                <Legend wrapperStyle={{ color: '#d1d5db' }}/>
                <Bar dataKey="Ventas" fill="#dc2626" />
            </BarChart>
        </ResponsiveContainer>
    );
};
