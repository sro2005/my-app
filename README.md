# ⚡ ElectroVibeHome

Bienvenido a **ElectroVibeHome**, una plataforma moderna e intuitiva para la compra de electrodomésticos. Nuestro objetivo es ofrecer innovación, calidad y comodidad en cada compra.

## 🌟 Descripción del Proyecto
ElectroVibeHome es una aplicación web diseñada para facilitar la compra de productos para el hogar. Proporcionamos una experiencia fluida y segura para los clientes, con múltiples opciones de pago y una interfaz optimizada.

---

## 🚀 Tecnologías Utilizadas

### **Frontend:**
- React.js
- CSS (Diseño responsive)
- Google Fonts

### **Backend:**
- Node.js
- Express.js

### **Base de Datos:**
- MongoDB

### **Herramientas Adicionales:**
- Postman (para pruebas de API)
- GitHub (control de versiones)
- JSON Web Tokens (JWT) para autenticación

---

## 🎯 Características Principales
✅ Registro e inicio de sesión de usuarios
✅ Gestión de productos con imágenes, descripciones y precios
✅ Carrito de compras con total dinámico
✅ Métodos de pago variados: tarjeta, billeteras virtuales (Nequi, Daviplata), Transfiya
✅ Historial de pedidos para los clientes
✅ Panel de administración para gestionar productos y pedidos
✅ Notificaciones y alertas en la compra

---

## 📂 Instalación y Uso

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### 1️⃣ **Clonar el repositorio**
```bash
  git clone https://github.com/sro2005/my-app.git
  cd my-app
```

### 2️⃣ **Instalar dependencias**
```bash
  npm install
```

### 3️⃣ **Configurar variables de entorno**
Crea un archivo `.env` en la raíz del proyecto y define las variables necesarias.

### 4️⃣ **Iniciar la aplicación**
```bash
  npm start
```
Luego, abre **http://localhost:3000** en tu navegador para ver la aplicación en acción.

---

## 📜 Documentación de la API
La API de **ElectroVibeHome** permite realizar operaciones CRUD en los módulos principales. Aquí están algunos de los endpoints clave:

### 🔹 **Autenticación**
- `POST /api/auth/register` → Registrar un nuevo usuario
- `POST /api/auth/login` → Iniciar sesión y obtener un token JWT

### 🔹 **Gestión de Productos**
- `GET /api/products` → Obtener todos los productos
- `POST /api/products` → Agregar un nuevo producto (requiere rol de administrador)

### 🔹 **Pedidos**
- `GET /api/orders` → Obtener pedidos del usuario autenticado
- `POST /api/orders` → Crear un nuevo pedido

---

## 🛠️ **Mantenimiento y Actualizaciones**
- Se realizan pruebas periódicas con **Postman** y **Jest**.
- Implementación de mejoras en la UI/UX.
- Integración de nuevas pasarelas de pago en el futuro.

---

## 👥 **Contribuidores**
📌 **Desarrollador principal:** SANTYRO  
📌 **Repositorio en GitHub:** [ElectroVibeHome](https://github.com/sro2005/my-app)

Si deseas contribuir, ¡siéntete libre de hacer un fork y enviar un pull request! 🚀

---

## 📞 Contacto
Si tienes dudas o sugerencias, puedes escribirme a **electrovibehome@soporte.com** 📩

⚡ *Gracias por visitar ElectroVibeHome. ¡Esperamos que disfrutes tu experiencia!* ⚡