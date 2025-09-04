import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: SelectOption[];
}

const Select: React.FC<SelectProps> = ({ label, name, options, ...props }) => {
  return (
    <div>
      <label htmlFor={name} className="block text-base font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        id={name}
        name={name}
        {...props}
        className="block w-full rounded-lg border-gray-300 py-2 pl-4 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;