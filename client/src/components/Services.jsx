import React from 'react';
import { motion } from 'framer-motion';

const services = [
    { id: 1, title: 'Limpieza Pro', desc: 'Tecnología ultrasónica.', icon: '✨' },
    { id: 2, title: 'Ortodoncia', desc: 'Brackets invisibles.', icon: '💎' },
    { id: 3, title: 'Implantes', desc: 'Resultados naturales.', icon: '🦷' },
    { id: 4, title: 'Blanqueamiento', desc: 'Sonrisa 3 tonos más blanca.', icon: '🌟' },
];

const Services = () => {
    return (
        <section className="py-20 bg-white min-h-[600px]">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold text-gray-900">Servicios Premium</h2>
                <p className="text-blush mt-2 font-medium">Especialidades diseñadas para tu bienestar</p>

                {/* Contenedor del abanico */}
                <div className="relative mt-20 flex justify-center items-center h-[400px]">
                    {services.map((service, index) => {
                        // Calculamos el ángulo para que las cartas se distribuyan en abanico
                        const angle = (index - (services.length - 1) / 2) * 25;

                        return (
                            <motion.div
                                key={service.id}
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
                                    zIndex: 50,
                                    y: -40
                                    boxShadow: "0px 20px 40px rgba(211, 126, 145, 0.3)"
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 20,
                                    delay: index * 0.1
                                }}
                                style={{ originY: 1.2 }} // Punto de rotación por debajo de la carta
                                className="absolute w-60 h-80 bg-lavender border border-blush/30 rounded-[2rem] shadow-lg p-6 flex flex-col justify-between cursor-pointer group hover:border-blush transition-colors"
                            >
                                <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                                    {service.icon}
                                </span>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blush transition-colors">
                                        {service.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-2">{service.desc}</p>
                                </div>

                                {/* Indicador visual de "clic" */}
                                <div className="text-blush opacity-0 group-hover:opacity-100 text-right font-bold transition-opacity">
                                    Agendar →
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