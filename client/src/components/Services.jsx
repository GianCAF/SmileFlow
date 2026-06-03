import { useState } from 'react';
import { motion } from 'framer-motion';
import BookingModal from './BookingModal';

const services = [
  { id: 1, title: 'Limpieza Pro', desc: 'Tecnologia ultrasonica.', icon: '*' },
  { id: 2, title: 'Ortodoncia', desc: 'Brackets invisibles.', icon: '<>' },
  { id: 3, title: 'Implantes', desc: 'Resultados naturales.', icon: '[]' },
  { id: 4, title: 'Blanqueamiento', desc: 'Sonrisa 3 tonos mas blanca.', icon: '+' },
];

const Services = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  return (
    <section id="servicios" className="min-h-[700px] bg-cream py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-gray-900">Servicios Premium</h2>
        <p className="mt-32 font-medium text-blush">Especialidades disenadas para tu bienestar</p>

        <div className="relative mt-32 flex h-[500px] items-center justify-center">
          {services.map((service, index) => {
            const angle = (index - (services.length - 1) / 2) * 25;
            const isBlocked = hoveredIndex !== null && hoveredIndex !== index;

            return (
              <motion.div
                key={service.id}
                role="button"
                tabIndex={0}
                aria-label={`Agendar ${service.title}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setSelectedService(service)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedService(service);
                  }
                }}
                initial={{ rotate: 0, opacity: 0, y: 100 }}
                whileInView={{ rotate: angle, opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{
                  rotate: 0,
                  scale: 1.1,
                  zIndex: 100,
                  y: -40,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                style={{
                  originY: 1.4,
                  pointerEvents: isBlocked ? 'none' : 'auto',
                }}
                className={`absolute flex h-[21.25rem] w-64 cursor-pointer flex-col justify-between rounded-[2rem] border-2 border-blush/25 bg-soft-rose p-8 shadow-2xl shadow-blush/10 transition-all duration-300 group ${
                  isBlocked ? 'opacity-50 blur-[2px]' : 'opacity-100'
                }`}
              >
                <div className="flex flex-col gap-4">
                  <span className="text-5xl font-black text-blush">{service.icon}</span>
                  <h3 className="text-2xl font-extrabold leading-none text-gray-800 group-hover:text-dark-blush">
                    {service.title}
                  </h3>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium leading-relaxed text-gray-600">{service.desc}</p>
                  <div className="mt-4 font-bold text-blush opacity-0 transition-opacity group-hover:opacity-100">
                    Agendar
                  </div>
                </div>
              </motion.div>
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
