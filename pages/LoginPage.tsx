import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Loader, User, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { contableSysLogo } from '../assets/images';

// note: electronAPI typing is provided centrally in types.ts

interface LoginPageProps {
    onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const result = await window.electronAPI.login({ username, password });

            if (result.success) {
                setStatus('success');
                setTimeout(onLoginSuccess, 1000);
            } else {
                setStatus('error');
                setErrorMessage(result.message || 'Credenciales inválidas');
                setTimeout(() => setStatus('idle'), 2000);
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Ocurrió un error de comunicación.');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const buttonContent = {
        idle: <><Fingerprint className="mr-2" size={18}/> Verificar Identidad</>,
        loading: <><Loader className="mr-2 animate-spin" size={18}/> Verificando...</>,
        success: <><CheckCircle className="mr-2" size={18}/> Acceso Concedido</>,
        error: <><AlertTriangle className="mr-2" size={18}/> {errorMessage || 'Credenciales Inválidas'}</>,
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-4xl"
            >
                <Card className="flex flex-col md:flex-row overflow-hidden">
                    {/* Brand Section */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                        className="w-full md:w-2/5 bg-gradient-to-br from-[#1a1a1a] to-black p-8 flex flex-col justify-center items-center text-center relative"
                    >
                         <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23292524%22%20fill-opacity%3D%220.1%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22/%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
                         <div className="relative z-10">
                            <motion.img
                                src={contableSysLogo}
                                alt="ContableSys Logo"
                                className="w-52 mx-auto"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </div>
                    </motion.div>
                    
                    {/* Form Section */}
                     <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                        className="w-full md:w-3/5 p-8"
                    >
                        <CardContent>
                            <h2 className="text-2xl font-bold text-white mb-2">Acceso Seguro</h2>
                            <p className="text-gray-400 mb-8">Ingrese sus credenciales para acceder al sistema.</p>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="username">Usuario</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                                        <Input id="username" type="text" placeholder="Usuario" className="pl-10" value={username} onChange={e => setUsername(e.target.value)} disabled={status === 'loading' || status === 'success'}/>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="password">Contraseña</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                                        <Input id="password" type="password" placeholder="Contraseña" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} disabled={status === 'loading' || status === 'success'}/>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end text-sm">
                                    <a href="#" className="text-red-500 hover:text-red-400 transition-colors">¿Olvidó su contraseña?</a>
                                </div>
                                <div className="pt-2">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={status}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                        >
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={status === 'loading' || status === 'success'}
                                                variant={status === 'error' ? 'destructive' : 'primary'}
                                            >
                                                {buttonContent[status]}
                                            </Button>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                <div className="text-center text-xs text-gray-500 pt-4">
                                    Conexión segura SSL 256-bit
                                </div>
                            </form>
                        </CardContent>
                    </motion.div>
                </Card>
            </motion.div>
        </div>
    );
};

export default LoginPage;