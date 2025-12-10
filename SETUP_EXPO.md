# ConSoft Móvil – Guía de instalación rápida (Admin y Customer)

Esta guía te deja el entorno listo en cualquier PC, para correr las dos apps Expo (admin y customer) conectadas a tu backend.

---

## 1) Requisitos
- Node.js LTS (>= 18) y npm
- Git
- Expo Go en el teléfono (Android/iOS) o emulador (Android Studio / Xcode)
- (macOS opcional) Watchman

Verifica:
```bash
node -v
npm -v
git --version
```

---

## 2) Clonar el repo
```bash
git clone https://github.com/samuelmora01/consoft-movil.git
cd consoft-movil
```

---

## 3) Backend (variables y arranque)
Configura el backend (este repo es solo móvil). Crea un archivo `.env` en tu backend con, por ejemplo:
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
FRONTEND_ORIGINS=http://localhost:19006,http://localhost:8081,http://<TU-IP-LAN>:19006
JWT_SECRET=<una_llave_segura>
COOKIE_NAME=token
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_USER=<tu_usuario>
MAIL_SMTP_PASS=<tu_app_password>
MAIL_SMTP_PORT=587
MAIL_FROM="Consoft <no-reply@tu-dominio.com>"
ADMIN_NOTIFY_EMAIL=admin@admin.com
```
- Arranca el backend en `http://<TU-IP-LAN>:3000` (usa tu IP local)
- Asegúrate de que `FRONTEND_ORIGINS` incluye la URL de Expo (web) y el host móvil si aplica

---

## 4) Configurar las apps (API)
Edita los archivos `app.json` de cada app para apuntar al backend (usa TU IP LAN, no localhost si pruebas en dispositivo):

`consoft-admin/app.json`
```json
{
  "expo": {
    "extra": {
      "API": "http://<TU-IP-LAN>:3000",
      "MAPBOX_TOKEN": ""
    }
  }
}
```

`consoft-customer/app.json`
```json
{
  "expo": {
    "extra": {
      "API": "http://<TU-IP-LAN>:3000"
    }
  }
}
```

---

## 5) Instalar dependencias
Admin:
```bash
cd consoft-movil/consoft-admin
npm install
```

Customer:
```bash
cd ../consoft-customer
npm install
# Si usas el botón flotante (persistencia de posición)
npm i @react-native-async-storage/async-storage
```

---

## 6) Iniciar Expo
Admin:
```bash
cd consoft-movil/consoft-admin
npx expo start --lan -c
# o
npm run start:lan:nowatch
```

Customer:
```bash
cd consoft-movil/consoft-customer
npx expo start --lan -c
# o
npm run start:lan:nowatch
```

- Abre con Expo Go (escanea QR) o lanza un emulador.
- PC y teléfono deben estar en la misma red Wi‑Fi.

---

## 7) Pruebas rápidas
1. Backend arriba en `http://<TU-IP-LAN>:3000`
2. Customer:
   - Login / Registro
   - Catálogo: productos y servicios (GET `/api/products`, `/api/services`)
   - Filtros con “Buscar”
   - Detalle del producto: “Añadir al carrito” y “Cotizar”
   - Carrito: ver items, cotización individual o de todo el carrito
   - Chat: en Perfil → “Chat con soporte” (DM con admin) o desde la acción de cotización
3. Admin:
   - Login
   - Pedidos/Visitas
   - Chat (pestaña “Chat”): conversaciones DM por usuario y por pedido
   - Perfil: editar info, cambiar contraseña, logout

---

## 8) Consejos de red / cookies
- Usa `--lan` para que Expo publique por la IP local.
- En iOS autoriza “Local Network” a Expo Go.
- Cookies httpOnly: backend debe permitir CORS y usar `SameSite=None; Secure` en producción (HTTPS).

---

## 9) Troubleshooting
- “Network request failed”: revisa IP LAN en `app.json` y que backend responda desde el móvil.
- “Cookies no persisten”: usa `credentials: 'include'` (ya está implementado); revisa CORS y dominio.
- “socket.io-client not found”: `npm i socket.io-client` en la app correspondiente.
- “AsyncStorage not found”: `npm i @react-native-async-storage/async-storage` en customer.

---

## 10) Producción (opcional)
Si construyes con EAS:
- Usa `app.config.ts` y lee `process.env` (EAS Secrets) para `API`/tokens.
- HTTPS obligatorio (cookies `Secure`).

---

## 11) Comandos útiles
```bash
# Admin
cd consoft-movil/consoft-admin
npm run start:lan:nowatch

# Customer
cd consoft-movil/consoft-customer
npm run start:lan:nowatch
```

Listo. Con esto puedes levantar ambas apps en otro PC sin fricción.*** End Patch```} ***!

