import React from 'react';
import InformationalPage from './InformationalPage';

const TermsPage = () => (
  <InformationalPage
    eyebrow="CONDICIONES DE USO"
    title="Términos de Servicio"
    lead="Estas condiciones explican cómo utilizar ElectroVibeHome, administrar tu cuenta, explorar el catálogo y revisar tus pedidos."
    noticeTitle="Información sobre pedidos y pagos"
    notice="Actualmente, los pedidos registrados en el sitio no generan entregas ni cobros reales. El checkout de Wompi utiliza su entorno de pruebas; no ingreses los datos de una tarjeta real."
    sections={[
      {
        title: 'Catálogo y disponibilidad',
        body: 'El catálogo organiza productos de tecnología y electrodomésticos por categorías. Las características, los importes y las existencias mostradas pueden cambiar; revisa los detalles antes de continuar con un pedido.'
      },
      {
        title: 'Cuenta y acceso',
        body: 'Para registrarte debes ser mayor de edad, facilitar la información solicitada y mantener tus credenciales seguras. No compartas tu contraseña ni intentes acceder a cuentas o información de otras personas.'
      },
      {
        title: 'Pedidos y checkout',
        body: 'La función de pedidos permite registrar una solicitud y consultar su estado dentro de la cuenta. En esta versión, el registro no constituye una compra comercial ni coordina una entrega real. Si eliges Wompi, serás dirigido a su entorno de pruebas: no se procesa un pago real.'
      },
      {
        title: 'Recuperación de contraseña',
        body: 'Puedes solicitar un enlace de recuperación para restablecer el acceso a la cuenta. La disponibilidad del mensaje depende de la configuración del servicio; utiliza un correo al que tengas acceso.'
      },
      {
        title: 'Guía ElectroVibe',
        body: 'La guía proporciona sugerencias para explorar el catálogo y comparar opciones. Sus recomendaciones pueden ser incompletas, por lo que debes revisar siempre las características del producto. No incluyas contraseñas ni datos personales sensibles en tus consultas.'
      },
      {
        title: 'Uso responsable y contacto',
        body: 'Utiliza las funciones de forma respetuosa y no intentes alterar datos de otras cuentas ni eludir controles de acceso. Las consultas sobre ElectroVibeHome pueden enviarse a company.electrovibehome@gmail.com.'
      }
    ]}
  />
);

export default TermsPage;
