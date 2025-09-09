
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { cn } from '../lib/utils';
import { NavItem } from '../types';
import { Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import SettingsModal from './SettingsModal';
import { contableSysLogo } from '../assets/images';

interface SideNavProps {
    navItems: NavItem[];
}

const sidebarVariants: Variants = {
    hidden: { x: '-100%' },
    visible: {
        x: 0,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        }
    }
};

const navItemVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 100 }
    }
};

export const SideNav: React.FC<SideNavProps> = ({ navItems }) => {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            className="w-64 bg-black border-r border-gray-800 flex flex-col p-4"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
             <motion.div variants={navItemVariants} className="flex items-center justify-center mb-10 px-2">
                <img src={contableSysLogo} alt="ContableSys Logo" className="w-40" />
            </motion.div>
            <nav className="flex-1 flex flex-col">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <motion.li key={item.path} variants={navItemVariants}>
                            <NavLink
                                to={item.path}
                                end
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    )
                                }
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        </motion.li>
                    ))}
                </ul>
            </nav>
            <motion.div variants={navItemVariants} className="mt-auto space-y-2">
                {/* Settings modal trigger */}
                <button onClick={() => setOpen(true)} className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200">
                    <Settings size={20} />
                    <span>Configuración</span>
                </button>
                <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200">
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </a>
            </motion.div>
            <SettingsModal open={open} onClose={() => setOpen(false)} />
        </motion.div>
    );
};
