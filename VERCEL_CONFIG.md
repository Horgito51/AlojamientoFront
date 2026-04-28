# 🔧 Configuración para Vercel

## Pasos para Configurar las Variables de Entorno en Vercel

### 1. Accede al Dashboard de Vercel
- Ve a: https://vercel.com/dashboard
- Selecciona tu proyecto "alojamiento-front"

### 2. Configura las Variables de Entorno
Ve a **Settings → Environment Variables** y agrega:

**Variable:** `VITE_API_URL`
**Valor:** `https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net`

### 3. Redeploy
Luego de guardar:
1. Ve a **Deployments**
2. Selecciona el último deployment
3. Haz clic en los tres puntos (...) → **Redeploy**
4. Confirma "Redeploy" (sin cambios de código)

---

## ⚠️ Si el error persiste (Error CORS)

Si ves en la consola del navegador un error como:
```
Access to XMLHttpRequest at 'https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net/api/v1/auth/login' 
from origin 'https://alojamiento-front-xxxx.vercel.app' has been blocked by CORS policy
```

**El problema es el servidor API**, no el cliente. El servidor Azure debe permitir solicitudes desde Vercel.

### Solución en el Backend (API Azure):
Agrega estos orígenes a CORS en `Program.cs` o `Startup.cs`:

```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            .AllowAnyOrigin()        // O especifica: .WithOrigins("https://tu-dominio-vercel.vercel.app")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// En Configure()
app.UseCors("AllowAll");
```

---

## 🧪 Para Probar Localmente

Asegúrate de que `.env.local` esté creado con:
```
VITE_API_URL=https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net
```

Luego corre:
```bash
npm run dev
```

---

## 📋 Checklist de Verificación

- [ ] Archivos `.env.example` y `.env.local` creados
- [ ] `vite.config.js` actualizado con `historyApiFallback`
- [ ] `vercel.json` creado con rewrites
- [ ] `axiosConfig.js` actualizado con logging
- [ ] Variables de entorno configuradas en Vercel
- [ ] Redeploy ejecutado en Vercel
- [ ] Consola del navegador sin errores CORS
