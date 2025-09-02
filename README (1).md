# 📘 README – ConSoft

## 🪑 Contexto  
**Confort & Estilo** es una empresa familiar ubicada en Medellín dedicada al diseño, fabricación y reparación de muebles, tapizado (incluido automotriz) y decoración de interiores.  
El crecimiento de la empresa evidenció dificultades en la **gestión manual** de información, la **dependencia de asesores** para ventas y la **falta de automatización** de procesos clave como inventario, pedidos y pagos.

---

## ❌ Problemas Identificados
- Información gestionada en documentos físicos → riesgo de pérdida y errores.  
- Ventas limitadas al horario de atención.  
- Clientes dependientes de un asesor para compras.  
- Falta de integración entre comunicación, ventas e inventario.  
- Procesos manuales y repetitivos → baja eficiencia y productividad.  

---

## ✅ Solución: ConSoft
**ConSoft** es un **aplicativo web/móvil** diseñado para digitalizar y automatizar los procesos de Confort & Estilo.  
El software integra en una sola plataforma la **gestión de usuarios, ventas, compras, servicios, inventario y reportes**, brindando mayor eficiencia operativa y autonomía al cliente.

---

## 🎯 Objetivo General
Desarrollar una aplicación web/móvil que gestione los procesos de **compras, servicios y ventas** de la empresa Confort & Estilo, optimizando su operación y mejorando la experiencia de los clientes.

---

## 🔑 Objetivos Específicos
- Gestionar roles y permisos de acceso.  
- Administrar clientes, empleados y usuarios.  
- Digitalizar las ejemplos de productos para la fabricacion y servicios.  
- Gestionar compras, ventas, pedidos y cotizaciones.  
- Automatizar pagos con integración de **QR** y plan separe.  
- Facilitar el **agendamiento de servicios** (fabricación, reparación, tapizado, decoración).  
- Generar reportes de desempeño (ventas, ingresos, usuarios).  

---

## ⚙️ Alcance Funcional

### 1. Configuración
- Roles y permisos.  
- Gestión de usuarios y accesos.  

### 2. Compras
- Categorías de productos de ejemplo.  
- Gestión de productos (crear, editar, eliminar, listar).  
 

### 3. Servicios
- Registro y actualización de servicios (fabricación, reparación, tapizado, decoración).  
- **Agendamiento de servicios (pedidos):** los clientes pueden solicitar servicios específicos, subir imágenes o notas de referencia y hacer seguimiento a su ejecución.  
- **Agendamiento de visitas:** permite programar visitas del equipo de la empresa al lugar del cliente para evaluar o prestar un servicio.   

### 4. Ventas
- Gestión de clientes.  
- Listado de productos de ejemplo y servicios.  
- Cotizaciones y pedidos que se mueve todo por el mismo documento, solo que cuando va cambiando de estado se le añaden datos a ese documento.  
- Pagos (QR y plan separe).  


### 5. Medición y Desempeño
- Reportes de ventas, ingresos bimestrales y cantidad de usuarios.  
- Representación visual con **gráficos de barras y circulares**. 
- Reportes de productos más vendidos, etc. 
- Reportes de ventas con métricas clave.
---

## 📌 Diferenciadores frente a plataformas similares
- Enfoque **personalizado al modelo de negocio** de Confort & Estilo.  
- Gestión interna optimizada con comunicación centralizada.  
- Encuestas automáticas enviadas al correo del cliente después de cada compra.  
- Catálogo híbrido: **modelos predeterminados** + opción de **personalización** (cliente puede subir fotos de referencia).  



---

## 🪟 Guía rápida de instalación en Windows (por consola)

### 1) Requisitos (instalar con Winget en PowerShell como Administrador)
```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
# Opcional (emulador Android)
winget install Google.AndroidStudio
# Opcional (editor)
winget install Microsoft.VisualStudioCode
```

### 2) Clonar y preparar el proyecto
```powershell
git clone <URL_DEL_REPOSITORIO>
cd <CARPETA_DEL_REPO>\consoft-admin
npm install
```

### 3) Ejecutar (Expo)
```powershell
npm start
```
- Android (emulador): en la terminal de Expo presiona "a" (requiere un AVD creado en Android Studio).
- Android (dispositivo físico): instala "Expo Go" desde Play Store y escanea el QR.
- Web: presiona "w".
- Si hay problemas de red/firewall, usa túnel:
```powershell
npx expo start --tunnel
```

### 4) Datos de ejemplo (citas)
- En desarrollo se auto-cargan citas si la lista está vacía.
- Para resembrar manualmente, en la consola de Expo / DevTools ejecuta:
```js
global.seedAppointments()
```

### 5) Verificaciones (opcional)
```powershell
# Chequear TypeScript
npx tsc -p tsconfig.json --noEmit
# Chequear ESLint
npx eslint src
```

Notas:
- En Windows no hay iOS; la tecla "i" (simulador iOS) sólo funciona en macOS.
- Para emulador Android, abre Android Studio, crea un "Virtual Device" y luego usa "a" en Expo.
