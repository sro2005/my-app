import React from 'react';
import InformationalPage from './InformationalPage';

const PrivacyPage = () => (
  <InformationalPage
    eyebrow="TUS DATOS Y TU PRIVACIDAD"
    title="Política de Privacidad"
    lead="Te explicamos qué información utiliza ElectroVibeHome para gestionar tu cuenta, personalizar la experiencia y dar seguimiento a tus solicitudes."
    noticeTitle="Antes de compartir tus datos"
    notice="Al crear una cuenta solicitamos información personal para que puedas acceder a tu perfil. Comparte únicamente los datos necesarios y nunca introduzcas información de tarjetas ni contraseñas que uses en otros servicios."
    sections={[
      {
        title: 'Información de tu cuenta',
        body: 'El formulario solicita nombre, apellidos, correo electrónico, identificación, fecha de nacimiento, celular y preferencias de productos. El género es opcional y solo se utiliza si decides indicarlo: permite adaptar el icono visual de tu perfil. Estos datos permiten crear tu cuenta, iniciar sesión, mostrar tu perfil y ajustar la exploración del catálogo.'
      },
      {
        title: 'Uso del correo y recuperación del acceso',
        body: 'Tu correo se utiliza para iniciar sesión y solicitar la recuperación de contraseña. La confirmación de titularidad del correo no está automatizada en todos los flujos; utiliza una dirección que controles y puedas consultar.'
      },
      {
        title: 'Información de pedidos',
        body: 'Al registrar un pedido se guardan los datos de contacto y entrega, los productos y cantidades, el importe mostrado, la fecha y el estado. Actualmente, registrar un pedido no genera un cobro ni coordina una entrega. La opción de Wompi no procesa cargos ni transferencias reales.'
      },
      {
        title: 'Sesión y seguridad',
        body: 'El navegador conserva un token de autenticación y datos básicos de tu perfil para mantener la sesión. Al cerrar sesión, estos datos se eliminan del navegador; cerrar sesión no elimina la cuenta ni los pedidos guardados.'
      },
      {
        title: 'Servicios que participan',
        body: 'Render aloja los servicios de la aplicación y MongoDB almacena los registros de cuentas, productos y pedidos. Actualmente, la Guía ElectroVibe funciona con reglas locales: compara información del catálogo y no envía tus mensajes a OpenAI ni a otros servicios externos de IA. Las opciones de pago disponibles en esta versión no procesan cobros ni transferencias reales.'
      },
      {
        title: 'Consultas sobre tu información',
        body: 'Para consultas relacionadas con la cuenta o el tratamiento de información, escribe a company.electrovibehome@gmail.com. Evita incluir documentos, contraseñas o datos financieros sensibles en el mensaje.'
      }
    ]}
  />
);

export default PrivacyPage;
