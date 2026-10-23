import React from 'react';
import InformationalPage from './InformationalPage';

const AboutPage = () => (
  <InformationalPage
    eyebrow="LA IDEA DETRÁS DE LA TIENDA"
    title="Sobre ElectroVibeHome"
    lead="Una idea de comercio electrónico que acerca la tecnología cotidiana a los espacios donde transcurre la vida."
    notice="ElectroVibeHome nació como un proyecto académico y personal. Hoy se presenta como una demostración de portafolio: permite explorar la experiencia y sus funciones, pero no es una tienda abierta al público."
    sections={[
      {
        title: 'Una casa más cómoda y conectada',
        body: 'La propuesta reúne electrodomésticos y tecnología para el hogar en un solo lugar. La idea es ayudar a cada persona a descubrir opciones útiles para su rutina, comparar lo que ofrece el catálogo y elegir con mayor claridad.'
      },
      {
        title: 'Una experiencia pensada para las personas',
        body: 'El recorrido combina una vitrina de productos, categorías de interés, cuentas de cliente y consulta de pedidos. La organización del catálogo busca que encontrar un producto sea sencillo desde el inicio hasta la revisión de sus detalles.'
      },
      {
        title: 'Una guía con Inteligencia Artificial',
        body: 'La Guía ElectroVibe permite describir una necesidad del hogar y recibir orientación basada en las opciones disponibles. Su papel es acompañar la exploración: la persona conserva el control de la decisión y debe revisar las características del producto antes de continuar.'
      },
      {
        title: 'Una idea académica que sigue creciendo',
        body: 'El proyecto conserva la visión original de ElectroVibeHome y la lleva a una nueva etapa con una experiencia más clara, una base técnica más sólida y funciones de IA integradas con propósito. Es una muestra de cómo podría evolucionar el concepto de negocio.'
      }
    ]}
  />
);

export default AboutPage;
