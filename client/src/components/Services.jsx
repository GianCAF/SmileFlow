import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import BookingModal from './BookingModal';

const iconClass = 'h-14 w-14';

const ToothIcon = () => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 48 48">
    <path d="M16.5 8.5c2.9 0 4.7 1.4 7.5 1.4s4.6-1.4 7.5-1.4c5 0 8 3.9 8 9.5 0 8.7-4.2 22-9.1 22-2.8 0-2.1-8.9-6.4-8.9s-3.6 8.9-6.4 8.9c-4.9 0-9.1-13.3-9.1-22 0-5.6 3-9.5 8-9.5Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M16 16c1.6-1.8 3.7-2.3 6-1.4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const AlignIcon = () => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 48 48">
    <path d="M12 15h24M10 24h28M12 33h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M15 11v8M24 20v8M33 29v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const ImplantIcon = () => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 48 48">
    <path d="M18 9h12a6 6 0 0 1 6 6v1a7 7 0 0 1-7 7H19a7 7 0 0 1-7-7v-1a6 6 0 0 1 6-6Z" stroke="currentColor" strokeWidth="3" />
    <path d="M24 23v17M18 30h12M20 36h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 48 48">
    <path d="M24 6l3.9 10.1L38 20l-10.1 3.9L24 34l-3.9-10.1L10 20l10.1-3.9L24 6Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M37 31l1.7 4.3L43 37l-4.3 1.7L37 43l-1.7-4.3L31 37l4.3-1.7L37 31Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

const services = [
  { id: 1, title: 'Limpieza Pro', desc: 'Tecnologia ultrasonica para una sensacion fresca y profunda.', Icon: ToothIcon },
  { id: 2, title: 'Ortodoncia', desc: 'Alineacion dental con planes claros y seguimiento constante.', Icon: AlignIcon },
  { id: 3, title: 'Implantes', desc: 'Soluciones estables con resultados naturales y duraderos.', Icon: ImplantIcon },
  { id: 4, title: 'Blanqueamiento', desc: 'Tratamiento estetico para una sonrisa mas luminosa.', Icon: SparkleIcon },
];

const Services = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const isLockedRef = useRef(false);
  const lockTimerRef = useRef(null);

  useEffect(() => () => {
    window.clearTimeout(lockTimerRef.current);
  }, []);

  const activateCard = (index) => {
    if (isLockedRef.current && activeIndex !== index) return;

    window.clearTimeout(lockTimerRef.current);
    isLockedRef.current = true;
    setActiveIndex(index);
    lockTimerRef.current = window.setTimeout(() => {
      isLockedRef.current = false;
      setActiveIndex(null);
    }, 5000);
  };

  return (
    <section id="servicios" className="bg-cream py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-4xl font-black text-gray-950">Especialidades</h2>
        <p className="mt-3 font-semibold text-blush">Atencion dental clara, cercana y facil de agendar</p>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const isActive = activeIndex === index;
            const isBlocked = activeIndex !== null && !isActive;
            const Icon = service.Icon;

            return (
              <motion.button
                key={service.id}
                type="button"
                onMouseEnter={() => activateCard(index)}
                onFocus={() => activateCard(index)}
                onClick={() => setSelectedService(service)}
                animate={{
                  y: isActive ? -14 : 0,
                  scale: isActive ? 1.04 : 1,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className={`group flex min-h-[310px] flex-col justify-between rounded-[1.25rem] border border-beige bg-white p-6 text-left shadow-xl shadow-blush/5 transition ${
                  isBlocked ? 'pointer-events-none opacity-55' : 'opacity-100 hover:border-blush/50'
                }`}
              >
                <div>
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-soft-rose text-dark-blush transition group-hover:bg-blush group-hover:text-white">
                    <Icon />
                  </div>
                  <h3 className="mt-6 text-2xl font-black leading-tight text-gray-950">{service.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-gray-600">{service.desc}</p>
                </div>
                <span className="mt-6 text-sm font-black text-blush">Agendar</span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <BookingModal
        service={selectedService}
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
      />
    </section>
  );
};

export default Services;
