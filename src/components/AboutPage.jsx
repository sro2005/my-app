import React from 'react';
import InformationalPage from './InformationalPage';

const AboutPage = () => (
  <InformationalPage
    eyebrow="CONCEPTO Y PROPÓSITO"
    title="Qué es ElectroVibeHome"
    lead="Una propuesta de comercio electrónico para descubrir electrodomésticos y tecnología útil para la vida en casa."
    notice="ElectroVibeHome es actualmente un proyecto personal y un prototipo de portafolio. No es una tienda abierta al público: los productos, precios, existencias y pedidos se usan para demostrar la experiencia. No se afirma que exista una operación comercial activa ni un registro empresarial."
    sections={[
      {
        title: 'La idea de negocio',
        body: 'Reunir en una experiencia digital electrodomésticos y tecnología para el hogar, organizados por categorías y acompañados de información clara. La propuesta busca que las personas puedan explorar alternativas según sus necesidades, su espacio y las tareas que quieren resolver.'
      },
      {
        title: 'Misión propuesta',
        body: 'Facilitar el descubrimiento de soluciones tecnológicas para el hogar mediante un catálogo organizado, información comprensible y herramientas que ayuden a comparar opciones antes de tomar una decisión.'
      },
      {
        title: 'Visión propuesta',
        body: 'Evolucionar hacia una experiencia de comercio electrónico confiable y fácil de usar, con una selección útil de productos, orientación responsable y procesos de atención y seguimiento claros. Esta visión describe una meta futura, no una operación comercial vigente.'
      },
      {
        title: 'Principios de la propuesta',
        items: [
          'Claridad: explicar las características y las condiciones de cada producto sin promesas difíciles de verificar.',
          'Utilidad: organizar el catálogo para que la búsqueda responda a necesidades cotidianas.',
          'Confianza: distinguir la información real de los datos de demostración y no presentar pedidos o pagos ficticios como ventas reales.',
          'Uso responsable de la tecnología: ofrecer orientación digital como apoyo, no como sustituto de la revisión de las características del producto.'
        ]
      },
      {
        title: 'Una guía para explorar el catálogo',
        body: 'La Guía ElectroVibe permite describir una necesidad y recibir sugerencias relacionadas con los productos disponibles. Según la configuración, utiliza reglas locales o asistencia generativa. Sus sugerencias son orientativas: revisa siempre las características del producto.'
      },
      {
        title: 'Un proyecto en desarrollo',
        body: 'La versión actual permite recorrer pantallas de catálogo, crear cuentas de prueba, explorar funciones de cliente y administración, y ensayar pedidos sin pagos reales. Antes de una eventual apertura comercial se necesitarían, entre otros elementos, inventario verificable, condiciones de venta y entrega, canales de atención, y revisión jurídica y de protección de datos.'
      }
    ]}
  />
);

export default AboutPage;
