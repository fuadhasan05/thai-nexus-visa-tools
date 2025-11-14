import React from 'react';

export default function GlassCard({ children, className = '', hover = true }) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E7E7E7] shadow-sm ${
        hover ? 'hover:shadow-md transition-shadow duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}