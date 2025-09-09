import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', ...props }, ref) => {
        const variants = {
            primary: "bg-red-600 text-white hover:bg-red-700",
            secondary: "bg-gray-700 text-gray-200 hover:bg-gray-600",
            ghost: "text-red-500 hover:bg-red-500/10",
            destructive: "bg-red-900 text-red-100 hover:bg-red-800",
        };
        return (
            <button
                className={cn(
                    "px-4 py-2 rounded-md font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 disabled:opacity-50",
                    variants[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };