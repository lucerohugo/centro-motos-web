# 🏍️ MotoBrix - Desktop App para GeneXus 6

> Interfaz visual limpia y moderna para gestión de motocicletas en GeneXus 6

[![Status](https://img.shields.io/badge/status-production-green)](VALIDACION.md)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](package.json)
[![Platform](https://img.shields.io/badge/platform-Windows-blue)](https://www.microsoft.com/en-us/windows)

---

## 🚀 Inicio Rápido

### Para Usuarios Finales

**Opción 1: Ejecutar directamente**
```bash
# Descargar carpeta: dist\win-unpacked\
# Doble-click en: BrixSoftware MotoCentro.exe
```

**Opción 2: Llamar desde GeneXus**
```genexus
' PROScript
ShellExecute('motobrix://pedido-facturacion', '', '', 'open', 1)
```

### Para Desarrolladores

```bash
# 1. Instalar dependencias
npm install

# 2. Modo desarrollo (con hot reload)
npm run dev-electron

# 3. Compilar a .exe
npm run build-electron

# 4. Ejecutar .exe
.\dist\win-unpacked\BrixSoftware\ MotoCentro.exe
```

---

## 📁 Estructura del Proyecto

```
template-brix/
├── app/                          # Páginas Next.js
│   ├── pedido-facturacion/      # Crear pedidos
│   ├── stock-motocicletas/      # Consultar stock
│   ├── cuenta-corriente/        # Ver cuentas
│   └── layout.tsx               # Layout principal
├── components/                   # Componentes React
│   ├── ui/                      # UI primitivos (Radix)
│   └── app-header.tsx           # Header personalizado
├── electron/                     # Aplicación Electron
│   ├── main.js                  # Proceso principal (spawn Next.js)
│   └── preload.js               # Puente seguro IPC
├── lib/                          # Utilidades sólidas
│   ├── api-endpoints.ts         # Comunicación API + mock data
│   ├── types.ts                 # Interfaces TypeScript
│   ├── mock-data.ts             # Datos de prueba
│   └── routes.config.ts         # Rutas centralizadas
├── public/                       # Assets estáticos
│   └── isologo.png              # Logo de la app
├── dist/                         # Build output
│   └── win-unpacked/            # .exe final + dependencias
├── ARCHITECTURE.md              # Documentación técnica
├── BUILD_EXE.md                 # Guía de compilación
├── EJECUTAR.md                  # Instrucciones rápidas
├── VALIDACION.md                # Checklist de QA
└── README.md                    # Este archivo
```

---

## 🎯 Características

✅ **Interfaz Visual Pura**
- UI moderna con Tailwind CSS
- Componentes Radix UI
- Responsive y accesible

✅ **Sin Hardcodes**
- Datos provienen de API
- Mock data para desarrollo
- Fallback automático

✅ **Standalone .exe**
- No necesita npm en máquina usuario
- Electron + Next.js empaquetado
- 213 MB total (todo incluido)

✅ **GeneXus 6 Integration**
- Protocolo `motobrix://` personalizado
- Deep linking a rutas específicas
- ShellExecute compatible

✅ **TypeScript**
- Seguridad de tipos completa
- Interfaces centralizadas
- Autocomplete en IDE

---

## 🔌 API Integration

### Modo Desarrollo (Mock Data)

Por defecto, la app usa datos de prueba. Útil para:
- Diseño de UI
- Testing offline
- Desarrollo sin GeneXus

```env
# .env.local (por defecto)
# NEXT_PUBLIC_GENEXUS_API_URL=  # Comentado = usa mock data
```

### Modo Producción (API Real)

Para conectar a GeneXus:

```env
# .env.local
NEXT_PUBLIC_GENEXUS_API_URL=http://tu-servidor:8080/motobrix-api
```

Luego: `npm run build-electron`

---

## 📊 Rutas Disponibles

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Menú principal | `motobrix://` |
| `/pedido-facturacion` | Crear pedidos | `motobrix://pedido-facturacion` |
| `/stock-motocicletas` | Ver stock disponible | `motobrix://stock-motocicletas` |
| `/cuenta-corriente` | Estado de cuenta | `motobrix://cuenta-corriente` |

---

## 🔧 Comandos npm

```bash
# Desarrollo
npm run dev              # Servidor Next.js local
npm run dev-electron    # Electron con hot reload

# Compilación
npm run build           # Solo Next.js (output/standalone)
npm run build-electron  # .exe final (30-60 segundos)

# Ejecución
npm run electron        # Ejecutar .exe creado
npm run start          # Servidor production Next.js

# Linting
npm run lint           # Verificar código
```

---

## 🔐 Protocolo Personalizado

### Registro en Windows

```powershell
# Ejecutar como Administrador
.\register-protocol.ps1
```

Esto crea una entrada en el registro:
```
HKEY_CURRENT_USER\Software\Classes\motobrix\
```

### Desde GeneXus

```genexus
' PROScript - Abrir stock
ShellExecute('motobrix://stock-motocicletas', '', '', 'open', 1)

' ObjectScript - Abrir pedido
WebSession.Execute("shell:open motobrix://pedido-facturacion")
```

---

## 📦 Distribución

### Opción 1: Archivos Sueltos (Recomendado)
```
dist/win-unpacked/              ← Carpeta a distribuir
├── BrixSoftware MotoCentro.exe
├── *.dll
├── resources/
└── locales/
```

**Pasos:**
1. Copiar completa la carpeta a usuarios
2. Ejecutar `register-protocol.ps1` como Admin en cada máquina
3. Listo para usar

### Opción 2: Instalador NSIS (Opcional)
```bash
npm run build-electron -- --win nsis
# Genera: BrixSoftware MotoCentro Setup 1.0.0.exe
```

---

## 🐛 Troubleshooting

### El .exe no inicia

```powershell
# Verificar permisos
icacls "dist\win-unpacked\BrixSoftware MotoCentro.exe"

# Probar servidor manualmente
cd ".next\standalone"
node server.js
# Debe mostrar: ▲ Ready in 2.5s. http://localhost:3000
```

### Protocolo motobrix:// no funciona

```powershell
# Ejecutar como Admin
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
.\register-protocol.ps1

# Verificar registro
Get-ItemProperty "HKCU:\Software\Classes\motobrix" -Name "(Default)"
```

### Puerto 3000 en uso

```powershell
# Encontrar proceso
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Get-Process -Id <PID>

# Terminar
Stop-Process -Name node -Force
```

---

## 📚 Documentación

| Archivo | Propósito |
|---------|-----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Diseño técnico completo |
| [BUILD_EXE.md](BUILD_EXE.md) | Guía detallada de compilación |
| [EJECUTAR.md](EJECUTAR.md) | Instrucciones rápidas de uso |
| [VALIDACION.md](VALIDACION.md) | Checklist de QA y verificación |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, Next.js 16, Turbopack |
| **Estilos** | Tailwind CSS 3.4, Radix UI |
| **Desktop** | Electron 40, electron-builder 26 |
| **Lenguaje** | TypeScript 5 |
| **Backend** | GeneXus 6 (REST API) |

---

## 📋 Requisitos

| Requisito | Versión | Necesario |
|-----------|---------|----------|
| Windows | 7+ (64-bit) | ✅ |
| GeneXus | 6 | Opcional* |
| Node.js | 18+ | Solo desarrollo |
| npm | 9+ | Solo desarrollo |

*Sin GeneXus: usa mock data. Con GeneXus: datos reales.

---

## 🤝 Integración GeneXus

### Cliente PROScript

```genexus
MyProcedure()
    ' Abrir pantalla
    Do ShellExecute('motobrix://pedido-facturacion', '', '', 'open', 1)
    
    ' Enviar parámetro (futuro)
    Do ShellExecute('motobrix://pedido-facturacion?revendedor=123', '', '', 'open', 1)
EndProcedure
```

### API REST (Datos)

MotoBrix espera estos endpoints:

```
GET  /api/revendedores         → Listado de resellers
GET  /api/stock?revendedor=1   → Stock del reseller
POST /api/pedidos              → Crear pedido
GET  /api/cuenta-corriente?id=1 → Estado de cuenta
```

Ver [lib/api-endpoints.ts](lib/api-endpoints.ts) para detalles.

---

## 📄 Licencia

Propietario. Desarrollado para GeneXus 6 MotoCentro.

---

## 👨‍💻 Desarrollo

### Setup Local

```bash
# 1. Clonar y instalar
git clone <repo>
cd template-brix
npm install --legacy-peer-deps

# 2. Configurar API (opcional)
echo 'NEXT_PUBLIC_GENEXUS_API_URL=...' > .env.local

# 3. Dev mode
npm run dev-electron
```

### Cambios Frecuentes

| Tarea | Archivo |
|-------|---------|
| Agregar ruta | `app/nueva-ruta/page.tsx` |
| Componente reutilizable | `components/mi-componente.tsx` |
| Datos mock | `lib/mock-data.ts` |
| Endpoint API | `lib/api-endpoints.ts` |
| Tipo TypeScript | `lib/types.ts` |

---

## ✅ Status

- ✅ Build .exe funcional
- ✅ Protocolo motobrix:// registrable
- ✅ Mock data operacional
- ✅ TypeScript completo
- ✅ documentación lista
- 🔄 Test con GeneXus6 (usuario)

---

## 📞 Contacto / Soporte

Para problemas de compilación, ver [VALIDACION.md](VALIDACION.md)  
Para arquitectura, ver [ARCHITECTURE.md](ARCHITECTURE.md)  
Para build, ver [BUILD_EXE.md](BUILD_EXE.md)

---

**Última actualización:** 2026-02-09  
**Versión:** 1.0.0  
**Estado:** ✅ Production Ready
"# CentroMotos" 
