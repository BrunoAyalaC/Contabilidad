import React from 'react';

const LockIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="11" width="18" height="10" rx="2" fill="#9CA3AF" />
    <path d="M7 11V8a5 5 0 0110 0v3" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default LockIcon;
