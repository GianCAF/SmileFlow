import Services from './components/Services';
import heroImage from './assets/hero.png';

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-950 selection:bg-blush/20">
      <header className="sticky top-0 z-40 border-b border-blush/10 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#inicio" className="text-xl font-black tracking-normal text-gray-950">
            Smile<span className="text-blush">Flow</span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-semibold text-gray-600 md:flex">
            <a className="hover:text-blush" href="#servicios">Servicios</a>
            <a className="hover:text-blush" href="#agenda">Agenda</a>
            <a className="hover:text-blush" href="#contacto">Contacto</a>
          </div>
          <a
            href="#servicios"
            className="rounded-full bg-blush px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blush/20 transition hover:bg-dark-blush"
          >
            Agendar
          </a>
        </nav>
      </header>

      <section id="inicio" className="overflow-hidden bg-lavender">
        <div className="mx-auto grid min-h-[620px] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-blush">
              Consultorio dental digital
            </p>
            <h1 className="text-5xl font-black leading-[1.03] text-gray-950 md:text-7xl">
              SmileFlow
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Agenda citas en segundos, confirma por WhatsApp y ofrece una experiencia pulida desde el primer contacto.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#servicios"
                className="rounded-full bg-blush px-7 py-4 text-center text-sm font-black text-white shadow-xl shadow-blush/25 transition hover:bg-dark-blush"
              >
                Ver servicios
              </a>
              <a
                href="#contacto"
                className="rounded-full border border-blush/30 bg-white px-7 py-4 text-center text-sm font-black text-gray-900 transition hover:border-blush hover:text-blush"
              >
                Hablar por WhatsApp
              </a>
            </div>
          </div>
          <div className="relative min-h-[420px]">
            <div className="absolute inset-0 rounded-[2rem] bg-white/50" />
            <img
              src={heroImage}
              alt="Paciente sonriendo en consultorio dental"
              className="relative h-[420px] w-full rounded-[2rem] object-cover shadow-2xl shadow-blush/20"
            />
          </div>
        </div>
      </section>

      <main>
        <Services />
        <section id="contacto" className="bg-gray-950 px-6 py-16 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black">Listos para recibir pacientes</h2>
              <p className="mt-2 max-w-xl text-white/70">
                El formulario ya envia reservas al servidor local y queda preparado para confirmar por WhatsApp.
              </p>
            </div>
            <a
              href="#servicios"
              className="rounded-full bg-white px-6 py-3 text-sm font-black text-gray-950 transition hover:bg-lavender"
            >
              Agendar ahora
            </a>
          </div>
        </section>
      </main>

      <footer className="py-10 text-center text-sm text-gray-400">
        &copy; 2026 SmileFlow - Consultorio Dental Digital
      </footer>
    </div>
  );
}

export default App;
