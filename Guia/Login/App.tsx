import React from 'react';
import Login from './components/Login';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gray-50 overflow-hidden">
      <main className="w-full">
        <Login />
      </main>
      <footer className="absolute bottom-5 text-center text-xs text-gray-500 w-full">
        &copy; {new Date().getFullYear()} ContaEs Solutions. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default App;