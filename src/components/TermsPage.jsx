import React from 'react';
import InformationalPage from './InformationalPage';

const TermsPage = () => (
  <InformationalPage
    eyebrow="REGLAS DE ESTA DEMOSTRACIÓN"
    title="Términos de Servicio"
    lead="Estas pautas explican el propósito de ElectroVibeHome y las condiciones para recorrer su experiencia de prueba."
    notice="ElectroVibeHome es un prototipo académico para portafolio, no un comercio abierto al público. Este contenido explica el alcance de la demo; no constituye un contrato para una operación comercial."
    sections={[
      {
        title: 'Propósito y disponibilidad',
        body: 'El sitio muestra cómo podría funcionar una tienda digital de tecnología para el hogar. Sus servicios pueden cambiar, reiniciarse o dejar de estar disponibles mientras el proyecto evoluciona. El catálogo, las imágenes, los precios y el inventario tienen fines de demostración.'
      },
      {
        title: 'Cuentas de prueba',
        body: 'Las cuentas permiten recorrer funciones como el perfil, las preferencias y la consulta de pedidos. Usa datos ficticios, conserva tus credenciales de prueba de forma segura y no intentes acceder a cuentas o información de otras personas.'
      },
      {
        title: 'Pedidos y pagos',
        body: 'El flujo permite crear pedidos de prueba y visualizar sus estados. La integración de pagos opera exclusivamente en el entorno Sandbox de Wompi: no está configurada para recibir pagos reales ni para entregar productos. No ingreses una tarjeta real.'
      },
      {
        title: 'Guía ElectroVibe e Inteligencia Artificial',
        body: 'La guía genera sugerencias para ayudar a explorar el catálogo. Sus respuestas pueden ser incompletas o equivocadas, por lo que no reemplazan la revisión de las especificaciones del producto. No realiza compras ni confirma pedidos por cuenta propia. Si está habilitada, las preguntas se procesan mediante OpenAI; evita incluir datos personales.'
      },
      {
        title: 'Uso responsable',
        body: 'El uso previsto del prototipo es explorar sus funciones sin interrumpir el servicio, alterar datos de otras personas o intentar eludir controles de acceso. Las preguntas sobre el proyecto pueden enviarse a company.electrovibehome@gmail.com.'
      }
    ]}
  />
);

export default TermsPage;
