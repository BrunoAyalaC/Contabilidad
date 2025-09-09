// Importaciones de React y librerías de UI
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2 } from 'lucide-react'; // Importamos un nuevo ícono
import { Button } from '../ui/Button';

// Definición de las propiedades que el componente modal aceptará
interface PdfDisplayModalProps {
    isOpen: boolean; // Para controlar si el modal está visible o no
    onClose: () => void; // Función que se llama para cerrar el modal
    content: string; // El texto crudo del PDF para mostrar
    onAutocomplete: () => void; // Nueva función para el autocompletado
}

// Componente funcional del Modal para mostrar el PDF
export const PdfDisplayModal: React.FC<PdfDisplayModalProps> = ({ isOpen, onClose, content, onAutocomplete }) => {
    return (
        <AnimatePresence>
            {/* Solo renderiza el modal si isOpen es true */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} // Estado inicial de la animación
                    animate={{ opacity: 1 }} // Estado final de la animación
                    exit={{ opacity: 0 }} // Animación al salir
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={onClose} // Cierra el modal si se hace clic en el fondo
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()} // Evita que el modal se cierre al hacer clic dentro de él
                    >
                        {/* Cabecera del Modal */}
                        <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                            <h2 className="text-lg font-semibold text-white">Texto Extraído del PDF</h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </header>
                        
                        {/* Contenido Principal del Modal (el texto del PDF) */}
                        <main className="p-6 flex-1 overflow-y-auto">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words font-mono">
                                {content}
                            </pre>
                        </main>
                        
                        {/* Pie de Página del Modal con los botones de acción */}
                        <footer className="flex justify-end items-center gap-4 p-4 border-t border-gray-700 flex-shrink-0">
                            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                            {/* Nuevo botón para autocompletar */}
                            <Button onClick={onAutocomplete} className="bg-red-600 hover:bg-red-700">
                                <Wand2 size={16} className="mr-2"/>
                                Autocompletar Formulario
                            </Button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};