import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

const Input: React.FC<InputProps> = ({ label, name, ...props }) => {
  const disabledClasses = "disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none";
  return (
    <div>
      <label htmlFor={name} className="block text-base font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...props}
        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base px-4 py-2 ${disabledClasses}`}
      />
    </div>
  );
};

export default Input;