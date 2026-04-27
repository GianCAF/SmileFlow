import React from 'react';

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
                    {services.map((service, index) => (
                        <div
                            key={service.id}
                            className="absolute w-60 h-80 bg-lavender border border-blush/30 rounded-[2rem] shadow-lg p-6 flex flex-col justify-between"
                        >
                            <span className="text-4xl">{service.icon}</span>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-gray-800">{service.title}</h3>
                                <p className="text-sm text-gray-600 mt-2">{service.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;