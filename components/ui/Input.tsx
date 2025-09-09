import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "bg-[#0f0f0f] border border-gray-700 text-gray-200 rounded-md px-3 h-10 w-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };