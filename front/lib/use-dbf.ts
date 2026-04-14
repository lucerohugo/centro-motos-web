/**
 * Custom Hooks para consumir la API REST del backend Django
 * 100% Web - Sin dependencias de Electron
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Revendedor,
  Localidad,
  CondicionIva,
  Comprobante,
  Stock,
} from './types'

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_URL = `${API_BASE_URL}/api/gestion`

// ================================================================
// Helper: Fetch genérico que retorna un array completo
// Soporta respuesta directa (array) o paginada DRF (recorre todas las páginas)
// ================================================================

const fetchAll = async <T,>(endpoint: string): Promise<T[]> => {
  const response = await fetch(`${API_URL}${endpoint}`)
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }
  const data = await response.json()
  return Array.isArray(data) ? data : data.results ?? []
}

/* =========================================================
   LOCALIDADES
========================================================= */

export function useLocalidades() {
  const [localidades, setLocalidades] = useState<Localidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    const loadLocalidades = async () => {
      try {
        const data = await fetchAll<Localidad>('/localidades/')
        if (!activo) return
        setLocalidades(data)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        if (activo) setError(message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    loadLocalidades()

    return () => {
      activo = false
    }
  }, [])

  return { localidades, loading, error }
}

/* =========================================================
   CONDICIONES DE IVA
========================================================= */

export function useCondicionesIva() {
  const [condiciones, setCondiciones] = useState<CondicionIva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    const loadCondiciones = async () => {
      try {
        const data = await fetchAll<CondicionIva>('/condicion-iva/')
        if (!activo) return
        setCondiciones(data)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        if (activo) setError(message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    loadCondiciones()

    return () => {
      activo = false
    }
  }, [])

  return { condiciones, loading, error }
}

/* =========================================================
   COMPROBANTES (TIPOS DE FACTURA)
========================================================= */

export function useComprobantes() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    const loadComprobantes = async () => {
      try {
        const data = await fetchAll<Comprobante>('/comprobantes/')
        if (!activo) return
        setComprobantes(data)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        if (activo) setError(message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    loadComprobantes()

    return () => {
      activo = false
    }
  }, [])

  return { comprobantes, loading, error }
}

// ================================================================
// PEDIDOS
// ================================================================

export interface PedidoResumen {
  codigo: number
  fecha: string
  comprador: string
  vehiculo: string
  monto: number
  editable: boolean
  datosCompletos?: any
}

export async function getPedidosRevendedor(
  revendedorId: number
): Promise<{ success: boolean; pedidos: PedidoResumen[]; error?: string }> {
  try {
    const url = `${API_URL}/pedidos/?rev_codi=${revendedorId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    
    // Manejar respuesta paginada o array directo
    const pedidosArray = Array.isArray(data) ? data : (data.results || [])
    
    // Mapear campos del backend al frontend
    const pedidosMapeados: PedidoResumen[] = pedidosArray.map((p: any) => ({
      codigo: p.pov_codi,
      fecha: p.pov_fech || '',
      comprador: p.cli_nomb || '-',
      vehiculo: p.art_nomb || '-',
      monto: p.pov_monf || 0,
      editable: !p.ped_exp, // Editable si NO fue exportado
      datosCompletos: p,
    }))
    
    return { 
      success: true, 
      pedidos: pedidosMapeados 
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { 
      success: false, 
      pedidos: [],
      error: message 
    }
  }
}

/* =========================================================
   Actualizar Pedido Existente
========================================================= */
export async function actualizarPedidoPOVT(codigo: number, pedidoData: any): Promise<{ success: boolean; codigo?: number; error?: string }> {
  try {
    // Formatear fecha de YYYY-MM-DDTHH:mm:ss.sssZ a YYYY-MM-DD
    const fechaPedido = pedidoData.fecha ? pedidoData.fecha.split('T')[0] : new Date().toISOString().split('T')[0]

    // Helper para limpiar números formateados (preservar decimales)
    const limpiarNumero = (val: any) => {
      let str = String(val || '')
      if (!str) return '0'
      
      // Si tiene coma, es formato argentino: 1.234.567,89
      if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.')
      } else {
        // Sin coma: podría ser "1.234.567" o "1.234.567.5" o "1234567.5"
        // Si el último "." tiene ≤2 dígitos después, es decimal
        const lastDotIndex = str.lastIndexOf('.')
        if (lastDotIndex !== -1) {
          const afterDot = str.substring(lastDotIndex + 1)
          if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
            // Último punto es decimal: remover puntos anteriores
            str = str.slice(0, lastDotIndex).replace(/\./g, '') + '.' + afterDot
          } else {
            // Todos los puntos son separadores de miles
            str = str.replace(/\./g, '')
          }
        }
      }
      return str
    }
    const parseNumero = (val: any) => parseInt(limpiarNumero(val)) || null
    const parseDecimal = (val: any) => parseFloat(limpiarNumero(val)) || 0

    const response = await fetch(`${API_BASE_URL}/api/gestion/pedidos/${codigo}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pov_fech: fechaPedido,
        rev_codi: pedidoData.revendedor?.id,
        cli_nomb: pedidoData.detalles?.datosComprador?.apellidoNombre || '',
        loc_codi: parseInt(pedidoData.detalles?.datosComprador?.localidadCodigo) || null,
        cli_dire: pedidoData.detalles?.datosComprador?.direccion || '',
        cli_tele: pedidoData.detalles?.datosComprador?.telefono || '',
        cli_celu: pedidoData.detalles?.datosComprador?.celular || '',
        cli_emai: pedidoData.detalles?.datosComprador?.email || '',
        cli_fnac: pedidoData.detalles?.datosComprador?.fechaNacimiento || null,
        cli_tdoc: pedidoData.detalles?.datosComprador?.documento || 'DNI',
        cli_ndoc: parseNumero(pedidoData.detalles?.datosComprador?.nroDocumento),
        cli_cuit: pedidoData.detalles?.datosComprador?.cuit || '',
        cli_estc: pedidoData.detalles?.datosComprador?.estadoCivil || '',
        cli_ocup: pedidoData.detalles?.datosComprador?.ocupacion || '',
        civ_codi: parseInt(pedidoData.detalles?.datosComprador?.condicionIva) || null,
        cli_nombc: pedidoData.detalles?.datosConyuge?.apellidoNombre || '',
        cli_tdocc: pedidoData.detalles?.datosConyuge?.documento || '',
        cli_ndocc: parseNumero(pedidoData.detalles?.datosConyuge?.nroDocumento),
        cli_cuitc: pedidoData.detalles?.datosConyuge?.cuit || '',
        pov_arti: parseInt(pedidoData.detalles?.datosVehiculo?.selectedMoto?.codigoArticulo) || null,
        pov_mode: parseInt(pedidoData.detalles?.datosVehiculo?.formData?.modelo) || null,
        pov_colo: parseInt(pedidoData.detalles?.datosVehiculo?.selectedMoto?.col_codi) || null,
        pov_ncha: pedidoData.detalles?.datosVehiculo?.formData?.nroChasis || '',
        pov_nmot: pedidoData.detalles?.datosVehiculo?.formData?.nroMotor || '',
        pov_ncer: pedidoData.detalles?.datosVehiculo?.formData?.nroCertificado || '',
        com_codi: parseInt(pedidoData.detalles?.formaPago?.comCodi) || null,
        com_nomb: pedidoData.detalles?.formaPago?.comNomb || '',
        com_letr: pedidoData.detalles?.formaPago?.comLetr || '',
        pov_flis: pedidoData.detalles?.formaPago?.fechaListaPrecios || null,
        pov_plis: parseDecimal(pedidoData.detalles?.formaPago?.precioLista),
        pov_finu: pedidoData.detalles?.formaPago?.financiera || '',
        pov_numc: pedidoData.detalles?.formaPago?.nroCredito || '',
        pov_impc: parseDecimal(pedidoData.detalles?.formaPago?.importeCredito),
        pov_nomc: pedidoData.detalles?.formaPago?.nombreTitularCredito || '',
        pov_tarc: parseDecimal(pedidoData.detalles?.formaPago?.tarjetaCredito),
        pov_ppag: parseDecimal(pedidoData.detalles?.formaPago?.planPago),
        pov_cheq: parseDecimal(pedidoData.detalles?.formaPago?.cheques),
        pov_tran: parseDecimal(pedidoData.detalles?.formaPago?.transferencia),
        pov_cont: parseDecimal(pedidoData.detalles?.formaPago?.contado),
        pov_monf: parseDecimal(pedidoData.detalles?.formaPago?.montoFinal),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.detail || JSON.stringify(error) }
    }

    const result = await response.json()
    return { success: true, codigo: result.pov_codi }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// GUARDAR PDF COMO DESCARGA WEB
export async function guardarPDF(htmlContent: string, nombreSugerido: string): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }> {
  try {
    // Importar html2pdf dinámicamente
    const html2pdf = (await import('html2pdf.js')).default

    // Crear elemento DOM temporal con el HTML
    const element = document.createElement('div')
    element.innerHTML = htmlContent
    element.style.padding = '20px'

    // Opciones para el PDF con type casting
    const opt: any = {
      margin: 10,
      filename: nombreSugerido,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    }

    // Generar y descargar PDF
    await html2pdf().set(opt).from(element).save()

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

/**
 * Generar PDF de pedido guardado (desde Mis Pedidos)
 * Usa EXACTAMENTE el mismo formato que vista-previa.tsx
 */
export async function generarPDFPedidoGuardado(
  pedidoCompleto: any,
  codigoExistente: number,
  nombreRevendedor: string,
  revendedorId: number
): Promise<void> {
  try {
    // Importar html2pdf
    const html2pdf = (await import('html2pdf.js')).default

    // Traer pedido completo del API para datos denormalizados
    let pedido = pedidoCompleto
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const fetchUrl = `${API_BASE}/api/gestion/pedidos/${codigoExistente}/`
      const response = await fetch(fetchUrl)
      if (response.ok) {
        pedido = await response.json()
      } else {
      }
    } catch (err) {
      // Silenciar error
    }

    // Convertir logo a base64
    let logoBase64 = ''
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('revendedor_login') : null
      if (raw) {
        const data = JSON.parse(raw)
        console.log("Datos de login recuperados para PDF:", data)
        
        // Intentar obtener de revendedor.rev_logo_url (nuevo formato) o rev_logo_url (viejo)
        let logoUrl = data.revendedor?.rev_logo_url || data.rev_logo_url
        
        if (logoUrl) {
          console.log("URL de logo encontrada:", logoUrl)
          
          // Asegurar que la URL sea absoluta y use HTTPS si es necesario para evitar Mixed Content
          if (!logoUrl.startsWith('http')) {
            // Si es relativa, la concatenamos con API_BASE_URL (definida al inicio del archivo)
            const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
            const cleanPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`
            logoUrl = `${baseUrl}${cleanPath}`
          }

          // Forzar HTTPS para evitar errores de Mixed Content en producción
          if (logoUrl.startsWith('http://')) {
            logoUrl = logoUrl.replace('http://', 'https://')
          }
          
          console.log("URL de logo final (forzada HTTPS):", logoUrl)

          const logoResponse = await fetch(logoUrl, { mode: 'cors' })
          if (logoResponse.ok) {
            const blob = await logoResponse.blob()
            logoBase64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            console.log("Logo convertido a Base64 exitosamente")
          } else {
            console.warn(`No se pudo descargar el logo (${logoResponse.status}): ${logoResponse.statusText}`)
          }
        } else {
          console.warn("No se encontró URL de logo en los datos del revendedor")
        }
      }
    } catch (err) {
      console.error("Error al cargar logo para PDF:", err)
    }

    // Helpers (IDÉNTICOS a vista-previa.tsx)
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString('es-AR')
    }

    const formatCurrency = (value: number | string) => {
      const num = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
      return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
    }

    // HTML EXACTAMENTE IGUAL a vista-previa.tsx
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pedido de Facturación - ${codigoExistente}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          padding: 15px; 
          color: #333; 
          font-size: 10px; 
          line-height: 1.4;
        }
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 15px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .header-logo {
          width: 140px;
          height: 140px;
          flex-shrink: 0;
        }
        .header-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .header-center {
          flex: 1;
          text-align: center;
          margin: 0 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-top: 30px;
        }
        .header-center h1 {
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        .header-center p {
          font-size: 9px;
          color: #666;
          margin: 1px 0;
        }
        .header-right {
          text-align: right;
          flex-shrink: 0;
        }
        .header-right .codigo {
          font-size: 11px;
          font-weight: bold;
        }
        .header-right .revendedor {
          font-size: 9px;
          color: #666;
        }
        .section {
          margin-bottom: 10px;
        }
        .section-title {
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          background-color: #f5f5f5;
          padding: 3px 4px;
          margin-bottom: 4px;
          border-bottom: 1px solid #333;
        }
        .data-row {
          display: flex;
          margin-bottom: 2px;
        }
        .label {
          width: 110px;
          font-weight: bold;
          font-size: 9px;
        }
        .value {
          flex: 1;
          font-size: 9px;
        }
        .footer {
          margin-top: 8px;
          text-align: center;
          font-size: 8px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 3px;
        }
        .importe-credito {
          font-weight: bold;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<div class="header-logo"><img src="${logoBase64}" alt="Logo" /></div>` : '<div class="header-logo"></div>'}
        <div class="header-center">
          <h1>PEDIDO DE FACTURACIÓN</h1>
          <p>Centro Motos - BrixSoftware</p>
          <p>Fecha: ${formatDate(pedido.pov_fech)}</p>
        </div>
        <div class="header-right">
          <div class="codigo">Código: ${codigoExistente}</div>
          <div class="revendedor">${nombreRevendedor}</div>
        </div>
      </div>

      <!-- DATOS DEL COMPRADOR -->
      <div class="section">
        <div class="section-title">Datos del Comprador</div>
        <div class="data-row"><span class="label">Apellido y Nombre:</span><span class="value">${pedido.cli_nomb || '-'}</span></div>
        <div class="data-row"><span class="label">Documento:</span><span class="value">${pedido.cli_tdoc || ''} ${pedido.cli_ndoc || '-'}</span></div>
        <div class="data-row"><span class="label">CUIT:</span><span class="value">${pedido.cli_cuit || '-'}</span></div>
        <div class="data-row"><span class="label">Condición IVA:</span><span class="value">${pedido.civ_nomb || '-'}</span></div>
        <div class="data-row"><span class="label">Dirección:</span><span class="value">${pedido.cli_dire || '-'}</span></div>
        <div class="data-row"><span class="label">Nombre Localidad:</span><span class="value">${pedido.loc_nomb || '-'}</span></div>
        <div class="data-row"><span class="label">Teléfono:</span><span class="value">${pedido.cli_tele || '-'}</span></div>
        <div class="data-row"><span class="label">Celular:</span><span class="value">${pedido.cli_celu || '-'}</span></div>
        <div class="data-row"><span class="label">Email:</span><span class="value">${pedido.cli_emai || '-'}</span></div>
        <div class="data-row"><span class="label">Fecha Nacimiento:</span><span class="value">${formatDate(pedido.cli_fnac)}</span></div>
        <div class="data-row"><span class="label">Estado Civil:</span><span class="value">${pedido.cli_estc || '-'}</span></div>
        <div class="data-row"><span class="label">Ocupación:</span><span class="value">${pedido.cli_ocup || '-'}</span></div>
      </div>

      ${pedido.cli_nombc ? `
      <!-- DATOS DEL CÓNYUGE -->
      <div class="section">
        <div class="section-title">Datos del Cónyuge</div>
        <div class="data-row"><span class="label">Nombre:</span><span class="value">${pedido.cli_nombc || '-'}</span></div>
        <div class="data-row"><span class="label">Documento:</span><span class="value">${pedido.cli_tdocc || ''} ${pedido.cli_ndocc || '-'}</span></div>
        <div class="data-row"><span class="label">CUIT:</span><span class="value">${pedido.cli_cuitc || '-'}</span></div>
      </div>
      ` : ''}

      <!-- DATOS DEL VEHÍCULO -->
      <div class="section">
        <div class="section-title">Datos del Vehículo</div>
        <div class="data-row"><span class="label">Marca:</span><span class="value">${pedido.mar_nomb || '-'}</span></div>
        <div class="data-row"><span class="label">Artículo:</span><span class="value">${pedido.art_nomb || '-'}</span></div>
        <div class="data-row"><span class="label">Modelo:</span><span class="value">${pedido.pov_mode || '-'}</span></div>
        <div class="data-row"><span class="label">Color:</span><span class="value">${pedido.col_nomb || '-'}</span></div>
        <div class="data-row"><span class="label">Nro Chasis:</span><span class="value">${pedido.pov_ncha || '-'}</span></div>
        <div class="data-row"><span class="label">Nro Motor:</span><span class="value">${pedido.pov_nmot || '-'}</span></div>
        <div class="data-row"><span class="label">Nro Certificado:</span><span class="value">${pedido.pov_ncer || '-'}</span></div>
      </div>

      <!-- FORMA DE PAGO -->
      <div class="section">
        <div class="section-title">Forma de Pago</div>
        <div class="data-row"><span class="label">Tipo Factura:</span><span class="value">${pedido.com_nomb || '-'} ${pedido.com_letr || '-'}</span></div>
        <div class="data-row"><span class="label">Financiera:</span><span class="value">${pedido.pov_finu || '-'}</span></div>
        <div class="data-row importe-credito"><span class="label">Importe Crédito:</span><span class="value">${formatCurrency(pedido.pov_impc)}</span></div>
        <div class="data-row"><span class="label">Tarjeta de Crédito:</span><span class="value">${formatCurrency(pedido.pov_tarc)}</span></div>
        <div class="data-row"><span class="label">Contado:</span><span class="value">${formatCurrency(pedido.pov_cont)}</span></div>
        <div class="data-row"><span class="label">Transferencia:</span><span class="value">${formatCurrency(pedido.pov_tran)}</span></div>
        <div class="data-row"><span class="label">Cheques:</span><span class="value">${formatCurrency(pedido.pov_cheq)}</span></div>
      </div>

      <div class="footer">
        <p>Documento generado el ${new Date().toLocaleString('es-AR')}</p>
      </div>
    </body>
    </html>
    `

    // Crear elemento temporal
    const element = document.createElement('div')
    element.innerHTML = html
    element.style.padding = '20px'

    // Opciones PDF (IDÉNTICAS a vista-previa.tsx)
    const opt: any = {
      margin: 10,
      filename: `Pedido_${codigoExistente}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true
      },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    }

    // Generar y descargar
    await html2pdf().set(opt).from(element).save()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    throw err
  }
}

// ================================================================
// AUTENTICACIÓN
// ================================================================

/**
 * Validar login de revendedor por contraseña
 * Busca en todos los revendedores el que coincida con la contraseña
 */
export async function validarLogin(
  username: string,
  clave: string
): Promise<{ success: boolean; revendedor?: any; error?: string }> {
  try {
    // Llamar al nuevo endpoint de login seguro en el backend
    const response = await fetch(`${API_URL}/revendedores/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clave }),
    })

    if (!response.ok) {
      const data = await response.json()
      return { success: false, error: data.error || 'Error al validar contraseña' }
    }

    const data = await response.json()
    
    if (!data.success) {
      return { success: false, error: data.error || 'Contraseña incorrecta' }
    }

    return {
      success: true,
      revendedor: data.revendedor,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

/**
 * Abre/guarda el contexto de cuenta corriente del revendedor
 * Guarda el ID del revendedor para usarlo en navegación
 */
export async function abrirCuentaCorriente(
  revendedorId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!revendedorId || revendedorId <= 0) {
      return { success: false, error: 'ID de revendedor inválido' }
    }

    // Guardar el ID en sessionStorage para acceso global
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cuenta_corriente_rev_id', String(revendedorId))
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// ================================================================
// STOCK MOTOCICLETAS - Hook para obtener stock filtrado
// ================================================================

export interface StockFiltros {
  revendedorDestino?: number | string
  busqueda?: string
  marcaCodi?: number | null
  subrubroCodi?: number | null
}

/**
 * Hook para obtener stock filtrado por depósito y filtros de búsqueda
 * Los filtros se aplican en el backend via query params
 */
export function useStockMotocicletas(filtros: StockFiltros) {
  const [stockMotocicletas, setStockMotocicletas] = useState<(Stock & { descripcion?: string; color?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { revendedorDestino, busqueda, marcaCodi, subrubroCodi } = filtros

  useEffect(() => {
    let activo = true

    const loadStockMotocicletas = async () => {
      try {
        // Construir query params
        const params = new URLSearchParams()
        if (revendedorDestino && Number(revendedorDestino) > 0) {
          params.set('art_dest', String(revendedorDestino))
        }
        params.set('disponible', '1')
        if (busqueda && busqueda.trim()) params.set('search', busqueda.trim())
        if (marcaCodi) params.set('art_codi__mar_codi', String(marcaCodi))
        if (subrubroCodi) params.set('art_codi__sru_codi', String(subrubroCodi))

        const qs = params.toString()
        const endpoint = `/stock/${qs ? `?${qs}` : ''}`

        const stockArray = await fetchAll<Stock>(endpoint)
        if (!activo) return

        const enrichedData = stockArray.map((item: any) => ({
          ...item,
          descripcion: item.art_nomb || 'N/A',
          color: item.col_nomb || 'N/A',
          marca: item.mar_nomb || '',
          subrubro: item.sru_nomb || '',
          codigoArticulo: item.art_codi || '',
          chassis: item.art_ncha || '',
          motor: item.art_nmot || '',
          certificado: item.art_ncer || '',
          modelo: item.art_mode || '',
          colorNombre: item.col_nomb || '',
        }))

        setStockMotocicletas(enrichedData)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        if (activo) setError(message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    loadStockMotocicletas()

    // Polling cada 5 segundos para stock en vivo
    const interval = setInterval(loadStockMotocicletas, 5000)

    return () => {
      activo = false
      clearInterval(interval)
    }
  }, [revendedorDestino, busqueda, marcaCodi, subrubroCodi])

  return { stockMotocicletas, loading, error }
}

/**
 * Hook para obtener marcas disponibles (para filtro dropdown)
 */
export function useMarcas(art_dest?: number) {
  const [marcas, setMarcas] = useState<{ mar_codi: number; mar_nomb: string }[]>([])

  useEffect(() => {
    let activo = true
    const load = async () => {
      try {
        // Si art_dest está disponible, usar el endpoint filtrado por destino
        const endpoint = art_dest && art_dest > 0 
          ? `/marcas/por_destino/?art_dest=${art_dest}`
          : '/marcas/'
        const data = await fetchAll<{ mar_codi: number; mar_nomb: string }>(endpoint)
        if (activo) setMarcas(data)
      } catch (err) {
        // Silenciar error
      }
    }
    load()
    return () => { activo = false }
  }, [art_dest])

  return marcas
}

/**
 * Hook para obtener subrubros disponibles (para filtro dropdown)
 */
export function useSubrubros(art_dest?: number) {
  const [subrubros, setSubrubros] = useState<{ sru_codi: number; sru_nomb: string }[]>([])

  useEffect(() => {
    let activo = true
    const load = async () => {
      try {
        // Si art_dest está disponible, usar el endpoint filtrado por destino
        const endpoint = art_dest && art_dest > 0 
          ? `/subrubros/por_destino/?art_dest=${art_dest}`
          : '/subrubros/'
        const data = await fetchAll<{ sru_codi: number; sru_nomb: string }>(endpoint)
        if (activo) setSubrubros(data)
      } catch (err) {
      }
    }
    load()
    return () => { activo = false }
  }, [art_dest])

  return subrubros
}

// ================================================================
// PEDIDOS - Funciones complementarias
// ================================================================

/**
 * Registrar nuevo pedido (crear orden de venta)
 */
export async function registrarPedidoPOVT(pedidoData: any): Promise<{ success: boolean; codigo?: number; error?: string }> {
  try {
    // Formatear fecha de YYYY-MM-DDTHH:mm:ss.sssZ a YYYY-MM-DD
    const fechaPedido = pedidoData.fecha ? pedidoData.fecha.split('T')[0] : new Date().toISOString().split('T')[0]

    // Helper para limpiar números formateados (preservar decimales)
    const limpiarNumero = (val: any) => {
      let str = String(val || '')
      if (!str) return '0'
      
      // Si tiene coma, es formato argentino: 1.234.567,89
      if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.')
      } else {
        // Sin coma: podría ser "1.234.567" o "1.234.567.5" o "1234567.5"
        // Si el último "." tiene ≤2 dígitos después, es decimal
        const lastDotIndex = str.lastIndexOf('.')
        if (lastDotIndex !== -1) {
          const afterDot = str.substring(lastDotIndex + 1)
          if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
            // Último punto es decimal: remover puntos anteriores
            str = str.slice(0, lastDotIndex).replace(/\./g, '') + '.' + afterDot
          } else {
            // Todos los puntos son separadores de miles
            str = str.replace(/\./g, '')
          }
        }
      }
      return str
    }
    const parseNumero = (val: any) => parseInt(limpiarNumero(val)) || null
    const parseDecimal = (val: any) => parseFloat(limpiarNumero(val)) || 0

    const response = await fetch(`${API_BASE_URL}/api/gestion/pedidos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pov_fech: fechaPedido,
        rev_codi: pedidoData.revendedor?.id,
        cli_nomb: pedidoData.detalles?.datosComprador?.apellidoNombre || '',
        loc_codi: parseInt(pedidoData.detalles?.datosComprador?.localidadCodigo) || null,
        cli_dire: pedidoData.detalles?.datosComprador?.direccion || '',
        cli_tele: pedidoData.detalles?.datosComprador?.telefono || '',
        cli_celu: pedidoData.detalles?.datosComprador?.celular || '',
        cli_emai: pedidoData.detalles?.datosComprador?.email || '',
        cli_fnac: pedidoData.detalles?.datosComprador?.fechaNacimiento || null,
        cli_tdoc: pedidoData.detalles?.datosComprador?.documento || 'DNI',
        cli_ndoc: parseNumero(pedidoData.detalles?.datosComprador?.nroDocumento),
        cli_cuit: pedidoData.detalles?.datosComprador?.cuit || '',
        cli_estc: pedidoData.detalles?.datosComprador?.estadoCivil || '',
        cli_ocup: pedidoData.detalles?.datosComprador?.ocupacion || '',
        civ_codi: parseInt(pedidoData.detalles?.datosComprador?.condicionIva) || null,
        cli_nombc: pedidoData.detalles?.datosConyuge?.apellidoNombre || '',
        cli_tdocc: pedidoData.detalles?.datosConyuge?.documento || '',
        cli_ndocc: parseNumero(pedidoData.detalles?.datosConyuge?.nroDocumento),
        cli_cuitc: pedidoData.detalles?.datosConyuge?.cuit || '',
        pov_arti: parseInt(pedidoData.detalles?.datosVehiculo?.selectedMoto?.codigoArticulo) || null,
        pov_mode: parseInt(pedidoData.detalles?.datosVehiculo?.formData?.modelo) || null,
        pov_colo: parseInt(pedidoData.detalles?.datosVehiculo?.selectedMoto?.col_codi) || null,
        pov_ncha: pedidoData.detalles?.datosVehiculo?.formData?.nroChasis || '',
        pov_nmot: pedidoData.detalles?.datosVehiculo?.formData?.nroMotor || '',
        pov_ncer: pedidoData.detalles?.datosVehiculo?.formData?.nroCertificado || '',
        com_codi: parseInt(pedidoData.detalles?.formaPago?.comCodi) || null,
        com_nomb: pedidoData.detalles?.formaPago?.comNomb || '',
        com_letr: pedidoData.detalles?.formaPago?.comLetr || '',
        pov_flis: pedidoData.detalles?.formaPago?.fechaListaPrecios || null,
        pov_plis: parseDecimal(pedidoData.detalles?.formaPago?.precioLista),
        pov_finu: pedidoData.detalles?.formaPago?.financiera || '',
        pov_numc: pedidoData.detalles?.formaPago?.nroCredito || '',
        pov_impc: parseDecimal(pedidoData.detalles?.formaPago?.importeCredito),
        pov_nomc: pedidoData.detalles?.formaPago?.nombreTitularCredito || '',
        pov_tarc: parseDecimal(pedidoData.detalles?.formaPago?.tarjetaCredito),
        pov_ppag: parseDecimal(pedidoData.detalles?.formaPago?.planPago),
        pov_cheq: parseDecimal(pedidoData.detalles?.formaPago?.cheques),
        pov_tran: parseDecimal(pedidoData.detalles?.formaPago?.transferencia),
        pov_cont: parseDecimal(pedidoData.detalles?.formaPago?.contado),
        pov_monf: parseDecimal(pedidoData.detalles?.formaPago?.montoFinal),
      }),
    })

    if (!response.ok) {
      // Verificar si es JSON o HTML (error del servidor)
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json()
        return { success: false, error: error.detail || JSON.stringify(error) }
      } else {
        // Es HTML - error del servidor
        return { success: false, error: `Error del servidor (${response.status}). Revisá la terminal de Django.` }
      }
    }

    const result = await response.json()
    return { success: true, codigo: result.pov_codi }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

/**
 * Exportar pedido como PDF (descarga por navegador)
 * Para versión web, genera un Blob y lo descarga
 */
export async function exportarPedido(codigo: number, htmlContent?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Si no hay contenido HTML, intentar obtener el pedido del backend
    if (!htmlContent) {
      const response = await fetch(`${API_BASE_URL}/api/gestion/pedidos/${codigo}/`)
      if (!response.ok) {
        return { success: false, error: 'Pedido no encontrado' }
      }
      const pedido = await response.json()
      htmlContent = generarHTMLPedido(pedido)
    }

    // Crear un Blob del PDF
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    // Crear link y simular descarga
    const a = document.createElement('a')
    a.href = url
    a.download = `Pedido_${codigo}_${new Date().getTime()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

/**
 * Helper: Generar HTML del pedido para exportar
 * Este es un template básico, puede mejorarse según necesidades
 */
function generarHTMLPedido(pedido: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; background: #f0f0f0; padding: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Pedido #${pedido.pov_codi}</h1>
        <p>Fecha: ${new Date(pedido.pov_fech).toLocaleDateString('es-AR')}</p>
      </div>

      <div class="section">
        <div class="section-title">Datos del Comprador</div>
        <p><strong>Nombre:</strong> ${pedido.cli_nomb || 'N/A'}</p>
        <p><strong>Documento:</strong> ${pedido.cli_ndoc || 'N/A'}</p>
        <p><strong>Dirección:</strong> ${pedido.cli_dire || 'N/A'}</p>
        <p><strong>Localidad:</strong> ${pedido.loc_nomb || 'N/A'}</p>
        <p><strong>Email:</strong> ${pedido.cli_emai || 'N/A'}</p>
        <p><strong>Teléfono:</strong> ${pedido.cli_tele || 'N/A'}</p>
      </div>

      <div class="section">
        <div class="section-title">Datos del Vehículo</div>
        <p><strong>Artículo:</strong> ${pedido.art_nomb || 'N/A'}</p>
        <p><strong>Modelo:</strong> ${pedido.art_mode || 'N/A'}</p>
        <p><strong>Color:</strong> ${pedido.art_col || 'N/A'}</p>
        <p><strong>Chasis:</strong> ${pedido.art_ncha || 'N/A'}</p>
        <p><strong>Motor:</strong> ${pedido.art_nmot || 'N/A'}</p>
      </div>

      <div class="section">
        <div class="section-title">Forma de Pago</div>
        <table>
          <tr>
            <th>Concepto</th>
            <th>Monto</th>
          </tr>
          <tr>
            <td>Precio Lista</td>
            <td>$ ${(pedido.pov_plis || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Cheques</td>
            <td>$ ${(pedido.pov_cheq || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Transferencia</td>
            <td>$ ${(pedido.pov_tran || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Contado</td>
            <td>$ ${(pedido.pov_cont || 0).toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold;">
            <td>MONTO FINAL</td>
            <td>$ ${(pedido.pov_mfin || 0).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <small>Documento generado: ${new Date().toLocaleString('es-AR')}</small>
      </div>
    </body>
    </html>
  `
}

/* =========================================================
   GENERAL - Datos de la empresa (logos, etc)
========================================================= */

export interface General {
  gen_codi: number
  gen_nomb: string
  gen_logo?: string
  gen_logo_url?: string
  gen_loge?: string
  gen_loge_url?: string
}

/**
 * Hook para obtener datos generales de la empresa (logos, etc)
 */
export function useGeneral() {
  const [general, setGeneral] = useState<General | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    const loadGeneral = async () => {
      try {
        // Obtener el primer registro (siempre hay uno)
        const endpoint = `${API_URL}/general/`
        
        const response = await fetch(endpoint)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        
        // Manejar respuesta de DRF (paginada)
        // DRF devuelve { count: X, next: ..., previous: ..., results: [...] }
        let generalArray: any[] = []
        
        if (Array.isArray(data)) {
          // Si es un array directo
          generalArray = data
        } else if (data.results && Array.isArray(data.results)) {
          // Si es respuesta paginada de DRF
          generalArray = data.results
        } else if (data.value && Array.isArray(data.value)) {
          // Si es respuesta de PowerShell
          generalArray = data.value
        }
        
        const primerRegistro = generalArray[0] || null
        
        if (!activo) return
        setGeneral(primerRegistro)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        if (activo) setError(message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    loadGeneral()

    return () => {
      activo = false
    }
  }, [])

  return { general, loading, error }
}



