import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  variant?: 'error' | 'success' | 'info';
  onClose: () => void;
}

const ICONS: Record<string, any> = {
  error: AlertCircle,
  success: CheckCircle,
  info: AlertCircle,
};

export const FeedbackModal: React.FC<Props> = ({ open, title, message, variant = 'error', onClose }) => {
  if (!open) return null;
  const Icon = ICONS[variant] || AlertCircle;

  const headerBg = variant === 'success' ? 'bg-green-700' : variant === 'info' ? 'bg-blue-700' : 'bg-red-700';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ y: -10, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -10, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.14 }}
        className="relative w-[460px] max-w-[95%] bg-[#0b0b0b] border border-gray-800 rounded-lg overflow-hidden shadow-2xl"
      >
        <div className={`${headerBg} p-3 flex items-center gap-3`}>
          <div className="p-1 rounded bg-black/20">
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{title || (variant === 'success' ? 'Operación exitosa' : 'Error')}</div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-1"><X/></button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-300">{message}</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={onClose} className="px-4 py-2">Cerrar</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
