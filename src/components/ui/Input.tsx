import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return <div className="w-full">
      {label && <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            {icon}
          </div>}
        <input className={`
            block w-full rounded-lg bg-zinc-900 border border-zinc-700 
            text-zinc-100 placeholder-zinc-500
            focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none
            transition-colors duration-200
            disabled:bg-zinc-800 disabled:text-zinc-500
            ${icon ? 'pl-10' : 'pl-4'} 
            pr-4 py-2.5 text-sm
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `} {...props} />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>;
}