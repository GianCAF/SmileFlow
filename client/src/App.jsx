import React from 'react';
import Services from './components/Services';

function App() {
  return (
    <div className="min-h-screen bg-white selection:bg-blush/20">

      {/* Tu sección Hero aquí... */}

      <main>
        <Services />
        {/* Aquí irán las siguientes secciones (Testimonios, Citas) */}
      </main>

      <footer className="py-10 text-center text-gray-400 text-sm">
        &copy; 2026 SmileFlow - Consultorio Dental Digital
      </footer>
    </div>
  );
}

export default App;