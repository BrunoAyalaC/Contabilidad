import React from 'react';

interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, description, children }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="p-8">
        <div className="border-b border-gray-200 pb-5">
            <h3 className="text-xl leading-6 font-medium text-gray-900">{title}</h3>
            {description && <p className="mt-2 max-w-2xl text-base text-gray-500">{description}</p>}
        </div>
        <div className="mt-8">
            {children}
        </div>
      </div>
    </div>
  );
};

export default Card;