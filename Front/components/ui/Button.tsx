import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  const baseClasses = "inline-flex justify-center rounded-lg border px-6 py-3 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";

  const variantClasses = {
    primary: "border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500",
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
};

export default Button;