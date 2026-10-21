import React from 'react';
import InformationalPage from './InformationalPage';

const PrivacyPage = () => (
  <InformationalPage
    eyebrow="DATOS Y TRANSPARENCIA"
    title="Política de Privacidad"
    lead="Aquí explicamos qué información utiliza el prototipo, para qué la necesita y qué ocurre al probar sus funciones."
    notice="Este texto describe la versión académica actual y sirve para explicar su funcionamiento. No es un aviso legal aprobado para una tienda en producción. Para explorar la demo, utiliza información ficticia y nunca compartas datos sensibles."
    sections={[
      {
        title: 'Información de una cuenta',
        body: 'Al crear un perfil de prueba, el sistema solicita nombre, apellidos, correo, número de identificación, fecha de nacimiento, celular y preferencias de productos. Estos datos se usan para crear la cuenta, iniciar sesión, mostrar el perfil y personalizar la navegación del catálogo.'
      },
      {
        title: 'Información de pedidos',
        body: 'Cuando se prueba el flujo de compra, el sistema registra los datos de contacto y entrega, los productos y cantidades, el total, la fecha del pedido y el estado del pago. La base de datos del proyecto conserva los pedidos para que se puedan consultar durante la demostración.'
      },
      {
        title: 'Sesión en el navegador',
        body: 'La sesión guarda en el almacenamiento local del navegador un token de autenticación y datos básicos del perfil. Cerrar sesión elimina esos elementos del navegador; por sí solo, no elimina el perfil ni los pedidos guardados en la base de datos.'
      },
      {
        title: 'Servicios que participan',
        body: 'La aplicación utiliza Render para alojar servicios y MongoDB para guardar los registros del proyecto. Si la Guía ElectroVibe está habilitada, el mensaje que escribes se envía al backend y a OpenAI para generar una respuesta; ElectroVibeHome no guarda el historial de esa conversación. Para pagos, el flujo abre el checkout de Wompi en Sandbox.'
      },
      {
        title: 'Uso prudente de la demostración',
        body: 'No introduzcas documentos, teléfonos, direcciones, contraseñas habituales, datos de tarjetas ni información de otras personas. La demo no tiene todavía un panel de autoservicio para solicitar correcciones o eliminación de registros. Las consultas sobre el proyecto pueden dirigirse a company.electrovibehome@gmail.com.'
      }
    ]}
  />
);

export default PrivacyPage;
