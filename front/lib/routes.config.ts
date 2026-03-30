/**
 * CONFIGURACIÓN DE RUTAS - MotoBrix Application
 * 
 * Este archivo contiene todas las rutas disponibles de la aplicación
 * para facilitar la integración con GeneXus6 y otros sistemas externos.
 * 
 * ESTRUCTURA DE LA APLICACIÓN:
 * =============================
 * Esta es una aplicación WEB puramente VISUAL que recibe todos los datos desde
 * GeneXus 6. No contiene hardcodeos ni datos estáticos.
 * 
 * - La aplicación se comunica con GeneXus a través de APIs REST
 * - NexT.js + React: Tabla de contenidos/UI
 * - GeneXus 6: Backend, base de datos, lógica de negocio
 * - Electron: Empaquetador como aplicación desktop Windows (.exe)
 * 
 * =============================
 * INSTRUCCIONES PARA GENEXUS6:
 * =============================
 * 
 * Para abrir cualquier sección desde GeneXus6, usa el protocolo motobrix://:
 * ShellExecute("motobrix://RUTA", "", "", "open", 1)
 * 
 * Donde RUTA es una de las siguientes:
 */

export const ROUTES = {
  // Página Principal / Menú
  HOME: '/',
  
  // Sección: Pedido de Facturación
  // - Usuario selecciona revendedor
  // - Completar datos de comprador, cónyuge, vehículo
  // - El pedido se guarda en GeneXus
  PEDIDO_FACTURACION: '/pedido-facturacion',
  
  // Sección: Stock de Motocicletas
  // - Usuario selecciona revendedor
  // - Consulta disponibilidad de motos
  // - Filtra por descripción, marca, subrubro
  STOCK_MOTOCICLETAS: '/stock-motocicletas',
  
  // Sección: Cuenta Corriente
  // - Visualiza deuda y movimientos
  // - Consulta historial de pedidos
  CUENTA_CORRIENTE: '/cuenta-corriente',
  
  // Sección: Mis Pedidos
  // - Lista de pedidos del revendedor
  // - Permite editar pedidos no procesados (POV_CVTA = "N")
  MIS_PEDIDOS: '/mis-pedidos',
} as const

/**
 * INTEGRACIÓN CON GENEXUS6 - EJEMPLOS:
 * =============================
 * 
 * 1. Abrir Menú Principal:
 *    ShellExecute("motobrix://", "", "", "open", 1)
 * 
 * 2. Abrir Pedido de Facturación:
 *    ShellExecute("motobrix://pedido-facturacion", "", "", "open", 1)
 * 
 * 3. Abrir Stock de Motocicletas:
 *    ShellExecute("motobrix://stock-motocicletas", "", "", "open", 1)
 * 
 * 4. Abrir Cuenta Corriente:
 *    ShellExecute("motobrix://cuenta-corriente", "", "", "open", 1)
 * 
 * =============================
 * 
 * COMUNICACIÓN CON GENEXUS6:
 * =============================
 * 
 * Consulta lib/api-endpoints.ts para la lista completa de endponts.
 * 
 * Endpoints principales:
 * - GET /api/revendedores → Obtener lista de revendedores
 * - GET /api/revendedores/{id}/stock → Obtener stock para revendedor
 * - POST /api/pedidos → Crear nuevo pedido
 * - GET /api/cuenta-corriente/{revendedorId} → Consultar deuda
 * 
 * La aplicación espera que GeneXus proporcione una API REST en:
 * NEXT_PUBLIC_GENEXUS_API_URL (configurado en .env.local)
 * 
 * =============================
 */

// Tipado para rutas
export type Route = (typeof ROUTES)[keyof typeof ROUTES]

export default ROUTES
