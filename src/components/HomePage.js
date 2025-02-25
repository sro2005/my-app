import React from 'react';

// Componente funcional HomePage que representa la página de inicio de la aplicación
const HomePage = () => {
  return (
    <div className="container">
      {/* Título principal de la página de inicio */}
      <h2 className="home-title">¡BIENVENID@ A ⚡ELECTROVIBEHOME⚡!</h2>
      <hr />

      {/* Introducción de la empresa */}
      <p>
        En <strong>⚡ELECTROVIBEHOME⚡</strong>, nos enorgullece ser líderes en la gestión de inventarios y proporcionar soluciones innovadoras para transformar la manera en que
        administras y accedes a tus productos. Desde nuestra fundación en el año <strong>2023</strong>, hemos estado dedicados a ofrecer servicios de calidad que no solo facilitan la gestión
        de tus inventarios, sino que también elevan la experiencia de nuestros clientes.
      </p>
      <hr />

      {/* Misión */}
      <h3>MISIÓN</h3>
      <p>
        Nuestra misión es ser el socio confiable para la administración eficiente de inventarios, proporcionando herramientas y servicios que maximicen
        la eficiencia operativa y la satisfacción del cliente. Nos comprometemos a ofrecer soluciones personalizadas y tecnológicamente avanzadas que
        se adapten a las necesidades cambiantes de nuestros usuarios.
      </p>
      <hr />

      {/* Visión */}
      <h3>VISIÓN</h3>
      <p>
        Nuestra visión es liderar el mercado en la provisión de servicios de gestión de inventarios, estableciendo nuevos estándares de excelencia y
        convirtiéndonos en la referencia indiscutible en nuestro sector. Aspiramos a ser reconocidos por nuestra innovación continua, nuestro compromiso
        con la calidad y nuestra capacidad para anticipar y satisfacer las necesidades de nuestros clientes.
      </p>
      <hr />

      {/* ¿Quiénes Somos? */}
      <h3>¿QUIÉNES SOMOS?</h3>
      <p>
        Somos <strong>⚡ELECTROVIBEHOME⚡</strong>, una empresa comprometida con la excelencia y la innovación en la gestión de inventarios. No producimos electrodomésticos; 
        en cambio, proporcionamos soluciones y servicios que te ayudan a mantener tus productos organizados y accesibles. Nuestro enfoque está en la 
        integración de tecnologías avanzadas y prácticas sostenibles para ofrecerte las mejores herramientas de inventario.
      </p>
      <hr />

      {/* Nuestros Valores */}
      <h3>VALORES</h3>
      <ul>
        <li><strong>Innovación:</strong> Constantemente buscamos nuevas formas de mejorar nuestros servicios y ofrecer soluciones vanguardistas.</li>
        <li><strong>Calidad:</strong> Cada aspecto de nuestro trabajo está enfocado en alcanzar los más altos estándares de calidad.</li>
        <li><strong>Compromiso:</strong> Nos dedicamos a entender y satisfacer las necesidades únicas de cada cliente.</li>
        <li><strong>Sostenibilidad:</strong> Promovemos prácticas sostenibles para contribuir positivamente al medio ambiente.</li>
      </ul>
      <hr />

      {/* Testimonios */}
      <h3>TESTIMONIOS</h3>
      <div className="testimonials-wrapper">
        <div className="testimonial">
          <div className="image-container">
            <img src="/testimonial-image-1.png" alt="Cliente satisfecho" className="testimonial-image" />
          </div>
        <blockquote>
          "Desde que comenzamos a utilizar los servicios de <strong>⚡ELECTROVIBEHOME⚡</strong>, nuestra eficiencia en la gestión de inventarios ha mejorado notablemente.
          Sus soluciones tecnológicas son intuitivas y efectivas. ¡Altamente recomendado!"
        </blockquote>
          <p>- Juan Pérez</p>
        </div>
        <div className="testimonial">
          <div className="image-container">
            <img src="/testimonial-image-2.png" alt="Cliente satisfecho" className="testimonial-image" />
          </div>
        <blockquote>
          "El equipo de <strong>⚡ELECTROVIBEHOME⚡</strong> ha sido increíblemente útil y profesional. Sus soluciones han transformado nuestra operación diaria."
        </blockquote>
          <p>- Laura Gómez</p>
        </div>
        <div className="testimonial">
          <div className="image-container">
            <img src="/testimonial-image-3.png" alt="Cliente satisfecho" className="testimonial-image" />
          </div>
        <blockquote>
          "Gracias a <strong>⚡ELECTROVIBEHOME⚡</strong>, hemos optimizado nuestro inventario de una manera que nunca creímos posible. ¡Estamos muy contentos con los resultados!"
        </blockquote>
          <p>- Carlos Martinez</p>
        </div>
      </div>
      <hr />

      {/* Descubre Más Con Nosotros */}
      <h3>DESCUBRE MÁS CON NOSOTROS</h3>
      <p>
        En <strong>⚡ELECTROVIBEHOME⚡</strong>, cada solución cuenta una historia de precisión y dedicación al detalle. Nuestro equipo de expertos trabaja incansablemente para 
        garantizar que cada servicio cumpla con tus expectativas de rendimiento y fiabilidad. Creemos que la verdadera calidad se encuentra en la combinación 
        perfecta de funcionalidad y eficiencia, y nos esforzamos por lograr esa perfección en cada una de nuestras ofertas.
      </p>
      <p>
        Únete a nosotros en nuestro viaje hacia el futuro de la gestión de inventarios. Descubre cómo nuestra marca y compañia <strong>⚡ELECTROVIBEHOME⚡</strong> puede transformar tu experiencia con 
        soluciones diseñadas para durar e impresionar.
      </p>
    </div>
  );
};

// Exportar el componente HomePage para que pueda ser utilizado en otros archivos
export default HomePage;