import React from 'react';
import { Link } from 'react-router-dom';

// Componente funcional HomePage que representa la página de inicio de la aplicación
const HomePage = () => {
  return (
    <div>
        {/* Navegación a las diferentes secciones */}
      <nav>
        <ul>
          <li><Link to="/producto-form">Agregar Producto</Link></li>
          <li><Link to="/pedido-form">Realizar Pedido</Link></li>
          <li><Link to="/confirmacion-pedido">Confirmación de Pedido</Link></li>
          <li><Link to="/listado-clientes">Listado de Clientes</Link></li>
          <li><Link to="/listado-productos">Listado de Productos</Link></li>
          <li><Link to="/listado-pedidos">Listado de Pedidos</Link></li>
          <li><Link to="/registro-cliente">Registro de Cliente</Link></li>
          <li><Link to="/login-cliente">Iniciar Sesión</Link></li>
          <li><Link to="/perfil-cliente">Perfil de Cliente</Link></li>
        </ul>
      </nav>

        {/* Título principal de la página de inicio */}
      <h2>¡Bienvenido! Empresa & Marca "Home Appliances SRO"</h2>
        {/* Párrafo de descripción de la empresa */}
      <p>En [Home Appliances SRO] nos enorgullecemos de ser líderes en innovación y calidad en el sector de electrodomésticos desde el año 2023. Nos dedicamos apasionadamente a diseñar y fabricar productos que no solo transforman hogares, sino también vidas. Nuestra misión es crear soluciones que sean tanto funcionales como estéticamente agradables, elevando así el estándar de confort y conveniencia para nuestros clientes. Fundada sobre principios de integridad y excelencia, nuestra empresa se compromete a ofrecer productos que combinan lo último en tecnología con un diseño intuitivo y sostenible. Nos esforzamos por superar las expectativas en cada paso del camino, desde la concepción inicial hasta la entrega final. En [Home Appliances SRO], cada electrodoméstico cuenta una historia de ingeniería meticulosa y dedicación al detalle. Nuestro equipo de profesionales expertos trabaja incansablemente para garantizar que cada producto cumpla con los más altos estándares de rendimiento y durabilidad. Creemos que la verdadera calidad se encuentra en la armonía entre funcionalidad y estética, y nos esforzamos por lograr esa perfección en cada uno de nuestros productos.</p>
        {/* Llamado a la acción */}
      <p>Únete a nosotros en nuestro viaje hacia el futuro de la tecnología en el hogar. Descubre cómo [Home Appliances SRO] puede transformar tu vida diaria con soluciones que están diseñadas para durar e impresionar.</p>
    </div>
  );
};

// Exportar el componente HomePage para que pueda ser utilizado en otros archivos
export default HomePage;
