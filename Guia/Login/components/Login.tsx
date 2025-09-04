import React, { useState } from 'react';
import UserIcon from './icons/UserIcon';
import LockIcon from './icons/LockIcon';
import Logo from './Logo';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Usuario y Contraseña son requeridos.');
      return;
    }
    setIsLoggingIn(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Logging in with:', { username, password });
      setIsLoggingIn(false);
    }, 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-xl animate-fade-in-up">
      <div className="text-center">
        <Logo className="h-20 w-auto mx-auto mb-10" />
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido de Nuevo</h1>
        <p className="text-slate-500 mt-2">Ingresa para administrar tu contabilidad.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400 transition-colors duration-300 group-focus-within:text-[#0085ca]" />
          </div>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
            required
            className="w-full pl-12 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0085ca]/50 focus:border-[#0085ca] transition-all duration-300"
          />
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <LockIcon className="h-5 w-5 text-gray-400 transition-colors duration-300 group-focus-within:text-[#0085ca]" />
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="w-full pl-12 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0085ca]/50 focus:border-[#0085ca] transition-all duration-300"
          />
        </div>
        
        {error && <p className="text-red-600 text-sm text-center animate-shake">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0085ca] hover:bg-[#007AB8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0085ca] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out"
          >
            {isLoggingIn ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;