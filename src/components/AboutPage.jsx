import React from 'react';
import InformationalPage from './InformationalPage';

const AboutPage = () => (
  <InformationalPage
    eyebrow="NUESTRO PROPÓSITO"
    title="Sobre Nosotros"
    lead="En ElectroVibeHome creemos que la tecnología debe hacer más sencilla la vida en casa. Reunimos inspiración, categorías y orientación para ayudarte a descubrir lo que mejor encaja contigo."
    sections={[
      {
        title: 'Lo que nos inspira',
        body: 'Acercar los electrodomésticos y la tecnología a las necesidades del día a día. Queremos que descubrir opciones para tu hogar sea una experiencia sencilla, organizada y agradable.'
      },
      {
        title: 'Nuestra misión',
        body: 'Ayudarte a descubrir soluciones para el hogar mediante un catálogo organizado, información clara y herramientas que faciliten la comparación de alternativas.'
      },
      {
        title: 'Nuestra visión',
        body: 'Construir una experiencia digital fácil de usar, con información útil, orientación responsable y procesos de consulta y seguimiento cada vez más claros.'
      },
      {
        title: 'Lo que nos guía',
        items: [
          'Claridad: explicar las características y las condiciones de cada producto sin promesas difíciles de verificar.',
          'Utilidad: organizar el catálogo para que la búsqueda responda a necesidades cotidianas.',
          'Confianza: ofrecer información clara sobre los productos, los pedidos y las condiciones de cada proceso.',
          'Uso responsable de la tecnología: ofrecer orientación digital como apoyo, no como sustituto de la revisión de las características del producto.'
        ]
      },
      {
        title: 'Una guía para decidir mejor',
        body: 'La Guía ElectroVibe te permite describir una necesidad y descubrir sugerencias relacionadas con el catálogo. Revisa las características y elige según las necesidades de tu hogar.'
      },
      {
        title: 'Una experiencia en evolución',
        body: 'Trabajamos para que la navegación, la información de producto y el seguimiento de pedidos sean claros y fáciles de usar. Cada mejora busca que encuentres lo que necesitas y entiendas cada paso del proceso.'
      }
    ]}
  />
);

export default AboutPage;
