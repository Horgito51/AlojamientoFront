# 🚀 Guía de Debugging - Error 404 y Conexión API

## Resumen de Cambios Realizados

He actualizado tu proyecto con las siguientes mejoras:

### ✅ Archivos Creados/Modificados:
1. **`vercel.json`** - Configuración SPA para Vercel (redirecciona todas las rutas a index.html)
2. **`vite.config.js`** - Agregado `historyApiFallback` para desarrollo local
3. **`.env.example`** - Template de variables de entorno
4. **`.env.local`** - Variables de entorno para desarrollo local
5. **`src/api/axiosConfig.js`** - Mejorado con logging y manejo de errores
6. **`src/components/Login.jsx`** - Mejor detección y reporte de errores
7. **`src/api/apiDebug.js`** - Herramienta de debugging para la consola

---

## 🔍 Debugging: Paso a Paso

### Paso 1: Verifica en Desarrollo Local
```bash
npm run dev
```
Luego intenta:
- Acceder a `http://localhost:5173/login`
- Intenta login
- Abre la Consola (F12) y busca los logs `[API...]`

### Paso 2: Verifica la Conexión a la API Directamente

Abre la **Consola del Navegador** (F12 → Console) y ejecuta:

```javascript
// Importar la herramienta de debug
import apiDebug from './src/api/apiDebug.js'

// Ver información de la API
apiDebug.info()

// Probar conexión básica
await apiDebug.testConnection()

// Probar login
await apiDebug.testLogin('admin_master@hotel.com', 'HASH_SECRETO123')

// Probar CORS
await apiDebug.testCors()
```

### Paso 3: Revisa los Logs en la Consola

Deberías ver algo como:
```
[API Config] Base URL: https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net
[API Request] POST /api/v1/auth/login
```

---

## 🔴 Errores Comunes y Soluciones

### ❌ "Error de red" o "No se puede conectar a la API"
**Causa:** La URL de la API es incorrecta o el servidor no está respondiendo

**Solución:**
```javascript
apiDebug.info() // Verifica que la URL sea correcta
```

La URL debe ser: `https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net`

---

### ❌ "CORS policy: blocked"
**Causa:** El servidor API no está configurado para aceptar solicitudes desde Vercel

**En tu Backend (.NET):**
```csharp
// Program.cs o Startup.cs
services.AddCors(options =>
{
    options.AddPolicy("AllowVercel", builder =>
    {
        builder
            .WithOrigins("https://alojamiento-front-*.vercel.app") 
            // O usar AllowAnyOrigin() temporalmente
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

app.UseCors("AllowVercel");
```

---

### ❌ "Correo o contraseña incorrectos"
**Causa:** Las credenciales de prueba son incorrectas

**Solución:** Verifica en tu API que el usuario exista. Desde Swagger prueba manualmente.

---

### ❌ Timeout (La solicitud tardó demasiado)
**Causa:** El servidor tarda mucho en responder o hay problemas de red

**Solución:**
- Verifica que el servidor Azure esté activo
- Aumenta el timeout en `axiosConfig.js` (ya está en 30s)

---

## 📋 Checklist para Vercel

- [ ] Crear `.env.local` (ya hecho)
- [ ] Actualizar `vite.config.js` (ya hecho)
- [ ] Crear `vercel.json` (ya hecho)
- [ ] **Configurar en Vercel Dashboard:**
  - Ir a **Settings → Environment Variables**
  - Agregar: `VITE_API_URL` = `https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net`
- [ ] **Redeploy en Vercel:**
  - Ir a **Deployments**
  - Click en los tres puntos (...) del último deployment
  - Seleccionar **Redeploy**

---

## 🔧 Comandos Útiles

```bash
# Desarrollo local con logs
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Lint
npm run lint
```

---

## 📞 Si Todo Sigue Fallando

1. **Verifica en Swagger** que la API esté respondiendo
2. **Ejecuta en la consola:**
   ```javascript
   // Copiar y pegar en Console (F12)
   fetch('https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net/api/v1/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ username: 'admin_master@hotel.com', password: 'HASH_SECRETO123' })
   }).then(r => r.json()).then(d => console.log(d))
   ```
3. **Revisa los logs del servidor Azure** para ver qué está pasando
4. **Verifica CORS en el backend** - Es el problema más común
