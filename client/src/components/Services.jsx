import React, { useState } from 'react'; 
import { motion } from 'framer-motion';

const services = [
    { id: 1, title: 'Limpieza Pro', desc: 'Tecnología ultrasónica.', icon: '✨' },
    { id: 2, title: 'Ortodoncia', desc: 'Brackets invisibles.', icon: '💎' },
    { id: 3, title: 'Implantes', desc: 'Resultados naturales.', icon: '🦷' },
    { id: 4, title: 'Blanqueamiento', desc: 'Sonrisa 3 tonos más blanca.', icon: '🌟' },
];

const Services = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    return (
        <section className="py-20 bg-white min-h-[700px]">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold text-gray-900">Servicios Premium</h2>
                <p className="text-blush mt-32 font-medium">Especialidades diseñadas para tu bienestar</p>

                {/* Contenedor del abanico */}
                <div className="relative mt-32 flex justify-center items-center h-[500px]">
                    {services.map((service, index) => {
                        // Calculamos el ángulo para que las cartas se distribuyan en abanico
                        const angle = (index - (services.length - 1) / 2) * 25;
                        const isBlocked = hoveredIndex !== null && hoveredIndex !== index;
                        return (
                            <motion.div
                                key={service.id}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                initial={{ rotate: 0, opacity: 0, y: 100 }}
                                whileInView={{
                                    rotate: angle,
                                    opacity: 1,
                                    y: 0
                                }}
                                viewport={{ once: true }}
                                whileHover={{
                                    rotate: 0,
                                    scale: 1.1,
                                    zIndex: 100, // Forzamos que siempre esté arriba
                                    y: -40,
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 20
                                }}
                                style={{
                                    originY: 1.4,
                                    // 4. El truco maestro: pointer-events none si otra carta está activa
                                    pointerEvents: isBlocked ? 'none' : 'auto'
                                }}
                                className={`absolute w-64 h-85 bg-lavender border-2 border-blush/30 rounded-[2.5rem] shadow-2xl p-8 flex flex-col justify-between cursor-pointer group transition-all duration-300 ${isBlocked ? 'opacity-50 blur-[2px]' : 'opacity-100'
                                    }`}
                            >
                                {/* Contenido de la carta (Icono, Título, Desc) igual que antes */}
                                <div className="flex flex-col gap-4">
                                    <span className="text-5xl">{service.icon}</span>
                                    <h3 className="text-2xl font-extrabold text-gray-800 group-hover:text-blush leading-none">
                                        {service.title}
                                    </h3>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{service.desc}</p>
                                    <div className="mt-4 text-blush font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        Agendar →
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Services;