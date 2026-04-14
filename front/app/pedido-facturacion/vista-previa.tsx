'use client'

import { X, Download, Edit, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { guardarPDF } from "@/lib/use-dbf"

interface PedidoData {
  fecha: string
  revendedor: {
    id: number
    nombre: string
    rev_logo_url?: string
  }
  detalles: {
    datosComprador: any
    datosConyuge: any
    datosVehiculo: any
    formaPago: any
  }
}

interface VistaPreviaProps {
  pedidoData: PedidoData
  onConfirmar: () => void
  onEditar: () => void
  isSubmitting?: boolean
  codigoExistente?: number | null // Si se está editando un pedido existente
}

export function VistaPrevia({ 
  pedidoData, 
  onConfirmar, 
  onEditar, 
  isSubmitting = false,
  codigoExistente = null
}: VistaPreviaProps) {
  const { datosComprador, datosConyuge, datosVehiculo, formaPago } = pedidoData.detalles
  const [savingPDF, setSavingPDF] = useState(false)
  const [logoRevendedor, setLogoRevendedor] = useState<string | null>(null)

  // Obtener logo del revendedor desde sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('revendedor_login')
      if (raw) {
        const data = JSON.parse(raw)
        // El nuevo login anida los datos en data.revendedor
        const logo = data.revendedor?.rev_logo_url || data.rev_logo_url
        if (logo) {
          setLogoRevendedor(logo)
        }
      }
    } catch {
      // ignorar
    }
  }, [])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR')
  }

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
    return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
  }

  // Convertir imagen URL a base64 para PDF
  const imageUrlToBase64 = async (url: string): Promise<string> => {
    try {
      let finalUrl = url
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE

      if (!url.startsWith('http')) {
        const cleanPath = url.startsWith('/') ? url : `/${url}`
        finalUrl = `${baseUrl}${cleanPath}`
      }

      // Forzar HTTPS para evitar errores de Mixed Content en producción
      if (finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://')
      }
      
      console.log("Intentando convertir URL de logo a Base64 (HTTPS forzado):", finalUrl)
      const response = await fetch(finalUrl, { mode: 'cors' })
      if (!response.ok) {
        console.warn(`No se pudo descargar el logo (${response.status}): ${response.statusText}`)
        return ''
      }
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error("Error al convertir imagen a base64:", error)
      return ''
    }
  }

  const handleDescargarPDF = async () => {
    setSavingPDF(true)
    
    try {
      // Generar nombre sugerido para el archivo
      const fecha = new Date().toISOString().split('T')[0]
      const nombreSugerido = codigoExistente 
        ? `Pedido_${codigoExistente}_${fecha}.pdf`
        : `Pedido_Facturacion_${fecha}.pdf`

      // Convertir logo a base64 si existe
      let logoBase64 = ''
      if (logoRevendedor) {
        logoBase64 = await imageUrlToBase64(logoRevendedor)
      }

      // Crear contenido HTML para el PDF
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido de Facturación - ${codigoExistente || 'Nuevo'}</title>
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
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 8px;
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
            <p>Fecha: ${formatDate(pedidoData.fecha)}</p>
          </div>
          <div class="header-right">
            ${codigoExistente ? `<div class="codigo">Código: ${codigoExistente}</div>` : ''}
            <div class="revendedor">${pedidoData.revendedor.nombre}</div>
          </div>
        </div>

        <!-- DATOS DEL COMPRADOR -->
        <div class="section">
          <div class="section-title">Datos del Comprador</div>
          <div class="two-column">
            <div>
              <div class="data-row"><span class="label">Apellido y Nombre:</span><span class="value">${datosComprador?.apellidoNombre || '-'}</span></div>
              <div class="data-row"><span class="label">Documento:</span><span class="value">${datosComprador?.documento || '-'} ${datosComprador?.nroDocumento || '-'}</span></div>
              <div class="data-row"><span class="label">CUIT:</span><span class="value">${datosComprador?.cuit || '-'}</span></div>
              <div class="data-row"><span class="label">Condición IVA:</span><span class="value">${datosComprador?.condicionIvaNombre || '-'}</span></div>
              <div class="data-row"><span class="label">Dirección:</span><span class="value">${datosComprador?.direccion || '-'}</span></div>
              <div class="data-row"><span class="label">Nombre Localidad:</span><span class="value">${datosComprador?.localidadNombre || '-'}</span></div>
            </div>
            <div>
              <div class="data-row"><span class="label">Teléfono:</span><span class="value">${datosComprador?.telefono || '-'}</span></div>
              <div class="data-row"><span class="label">Celular:</span><span class="value">${datosComprador?.celular || '-'}</span></div>
              <div class="data-row"><span class="label">Email:</span><span class="value">${datosComprador?.email || '-'}</span></div>
              <div class="data-row"><span class="label">Fecha Nacimiento:</span><span class="value">${formatDate(datosComprador?.fechaNacimiento)}</span></div>
              <div class="data-row"><span class="label">Estado Civil:</span><span class="value">${datosComprador?.estadoCivil || '-'}</span></div>
              <div class="data-row"><span class="label">Ocupación:</span><span class="value">${datosComprador?.ocupacion || '-'}</span></div>
            </div>
          </div>
        </div>

        ${datosConyuge?.apellidoNombre ? `
        <!-- DATOS DEL CÓNYUGE -->
        <div class="section">
          <div class="section-title">Datos del Cónyuge</div>
          <div class="two-column">
            <div>
              <div class="data-row"><span class="label">Nombre:</span><span class="value">${datosConyuge?.apellidoNombre || '-'}</span></div>
              <div class="data-row"><span class="label">Documento:</span><span class="value">${datosConyuge?.documento || '-'} ${datosConyuge?.nroDocumento || '-'}</span></div>
              <div class="data-row"><span class="label">CUIT:</span><span class="value">${datosConyuge?.cuit || '-'}</span></div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- DATOS DEL VEHÍCULO -->
        <div class="section">
          <div class="section-title">Datos del Vehículo</div>
          <div class="data-row"><span class="label">Marca:</span><span class="value">${datosVehiculo?.selectedMoto?.marca || '-'}</span></div>
          <div class="data-row"><span class="label">Artículo:</span><span class="value">${datosVehiculo?.selectedMoto?.descripcion || '-'}</span></div>
          <div class="data-row"><span class="label">Modelo:</span><span class="value">${datosVehiculo?.formData?.modelo || '-'}</span></div>
          <div class="data-row"><span class="label">Color:</span><span class="value">${datosVehiculo?.selectedMoto?.colorNombre || datosVehiculo?.formData?.color || '-'}</span></div>
          <div class="data-row"><span class="label">Nro Chasis:</span><span class="value">${datosVehiculo?.formData?.nroChasis || '-'}</span></div>
          <div class="data-row"><span class="label">Nro Motor:</span><span class="value">${datosVehiculo?.formData?.nroMotor || '-'}</span></div>
          <div class="data-row"><span class="label">Nro Certificado:</span><span class="value">${datosVehiculo?.formData?.nroCertificado || '-'}</span></div>
        </div>

        <!-- FORMA DE PAGO -->
        <div class="section">
          <div class="section-title">Forma de Pago</div>
          <div class="data-row"><span class="label">Tipo Factura:</span><span class="value">${formaPago?.comNomb || '-'} ${formaPago?.comLetr || '-'}</span></div>
          <div class="data-row"><span class="label">Financiera:</span><span class="value">${formaPago?.financiera || '-'}</span></div>
          <div class="data-row importe-credito"><span class="label">Importe Crédito:</span><span class="value">${formatCurrency(formaPago?.importeCredito)}</span></div>
          <div class="data-row"><span class="label">Tarjeta de Crédito:</span><span class="value">${formatCurrency(formaPago?.tarjetaCredito)}</span></div>
          <div class="data-row"><span class="label">Contado:</span><span class="value">${formatCurrency(formaPago?.contado)}</span></div>
          <div class="data-row"><span class="label">Transferencia:</span><span class="value">${formatCurrency(formaPago?.transferencia)}</span></div>
          <div class="data-row"><span class="label">Cheques:</span><span class="value">${formatCurrency(formaPago?.cheques)}</span></div>
        </div>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleString('es-AR')}</p>
        </div>
      </body>
      </html>
    `

      // Guardar con diálogo de ubicación
      const result = await guardarPDF(html, nombreSugerido)
      
      if (result.success) {
      } else if (!result.canceled) {
        alert('Error al guardar el PDF: ' + result.error)
      }
    } catch (error) {
      alert('Error al generar el PDF')
    } finally {
      setSavingPDF(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-auto">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Vista Previa del Pedido</h2>
            <p className="text-xs text-muted-foreground">
              {codigoExistente ? `Editando pedido #${codigoExistente}` : 'Revise los datos antes de confirmar'}
            </p>
          </div>
          <button
            onClick={onEditar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Volver a editar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo tipo documento */}
        <div className="bg-white dark:bg-zinc-900 p-8 mx-4 my-4 rounded-lg border border-border shadow-sm">
          {/* Cabecera del documento */}
          <div className="text-center border-b-2 border-foreground pb-4 mb-6">
            <h1 className="text-xl font-bold text-foreground">PEDIDO DE FACTURACIÓN</h1>
            <p className="text-sm text-muted-foreground">Centro Motos - BrixSoftware</p>
            {codigoExistente && (
              <p className="text-lg font-mono font-semibold text-primary mt-2">Código: {codigoExistente}</p>
            )}
          </div>

          {/* Info general */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <span className="ml-2 font-medium">{formatDate(pedidoData.fecha)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Revendedor:</span>
              <span className="ml-2 font-medium">{pedidoData.revendedor.nombre} (#{pedidoData.revendedor.id})</span>
            </div>
          </div>

          {/* Datos del Comprador */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b border-border pb-1 mb-3">
              Datos del Comprador
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div><span className="text-muted-foreground">Nombre:</span> <span className="font-medium">{datosComprador?.apellidoNombre || '-'}</span></div>
              <div><span className="text-muted-foreground">Documento:</span> <span className="font-medium">{datosComprador?.documento} {datosComprador?.nroDocumento}</span></div>
              <div><span className="text-muted-foreground">CUIT:</span> <span className="font-medium">{datosComprador?.cuit || '-'}</span></div>
              <div><span className="text-muted-foreground">Condición IVA:</span> <span className="font-medium">{datosComprador?.condicionIvaNombre || datosComprador?.condicionIva || '-'}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Dirección:</span> <span className="font-medium">{datosComprador?.direccion || '-'}</span></div>
              <div><span className="text-muted-foreground">Localidad:</span> <span className="font-medium">{datosComprador?.localidadNombre || '-'}</span></div>
              <div><span className="text-muted-foreground">C.P.:</span> <span className="font-medium">{datosComprador?.codigoPostal || '-'}</span></div>
              <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium">{datosComprador?.telefono || '-'}</span></div>
              <div><span className="text-muted-foreground">Celular:</span> <span className="font-medium">{datosComprador?.celular || '-'}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{datosComprador?.email || '-'}</span></div>
              <div><span className="text-muted-foreground">Fecha Nac.:</span> <span className="font-medium">{formatDate(datosComprador?.fechaNacimiento)}</span></div>
              <div><span className="text-muted-foreground">Estado Civil:</span> <span className="font-medium">{datosComprador?.estadoCivil || '-'}</span></div>
              <div><span className="text-muted-foreground">Ocupación:</span> <span className="font-medium">{datosComprador?.ocupacion || '-'}</span></div>
            </div>
          </div>

          {/* Datos del Cónyuge (si aplica) */}
          {datosConyuge?.apellidoNombre && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b border-border pb-1 mb-3">
                Datos del Cónyuge
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div><span className="text-muted-foreground">Nombre:</span> <span className="font-medium">{datosConyuge?.apellidoNombre}</span></div>
                <div><span className="text-muted-foreground">Documento:</span> <span className="font-medium">{datosConyuge?.documento} {datosConyuge?.nroDocumento}</span></div>
                <div><span className="text-muted-foreground">CUIT:</span> <span className="font-medium">{datosConyuge?.cuit || '-'}</span></div>
              </div>
            </div>
          )}

          {/* Grid 2 columnas: Vehículo y Pago */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos del Vehículo */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b border-border pb-1 mb-3">
                Datos del Vehículo
              </h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-muted-foreground">Marca:</span> <span className="font-medium">{datosVehiculo?.selectedMoto?.marca || '-'}</span></div>
                <div><span className="text-muted-foreground">Artículo:</span> <span className="font-medium">{datosVehiculo?.selectedMoto?.descripcion || '-'}</span></div>
                <div><span className="text-muted-foreground">Nro Chasis:</span> <span className="font-medium font-mono">{datosVehiculo?.formData?.nroChasis || '-'}</span></div>
                <div><span className="text-muted-foreground">Nro Motor:</span> <span className="font-medium font-mono">{datosVehiculo?.formData?.nroMotor || '-'}</span></div>
                <div><span className="text-muted-foreground">Nro Certificado:</span> <span className="font-medium font-mono">{datosVehiculo?.formData?.nroCertificado || '-'}</span></div>
                <div><span className="text-muted-foreground">Color:</span> <span className="font-medium">{datosVehiculo?.formData?.color || datosVehiculo?.selectedMoto?.colorNombre || datosVehiculo?.selectedMoto?.color || '-'}</span></div>
              </div>
            </div>

            {/* Forma de Pago */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b border-border pb-1 mb-3">
                Forma de Pago
              </h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-muted-foreground">Tipo Factura:</span> <span className="font-medium">{formaPago?.comNomb} {formaPago?.comLetr || '-'}</span></div>
                <div><span className="text-muted-foreground">Fecha Lista Precios:</span> <span className="font-medium">{formatDate(formaPago?.fechaListaPrecios)}</span></div>
                <div><span className="text-muted-foreground">Precio Lista:</span> <span className="font-medium">{formatCurrency(formaPago?.precioLista)}</span></div>
                <div><span className="text-muted-foreground">Financiera:</span> <span className="font-medium">{formaPago?.financiera || '-'}</span></div>
                <div><span className="text-muted-foreground">Nro Crédito:</span> <span className="font-medium">{formaPago?.nroCredito || '-'}</span></div>
                <div><span className="text-muted-foreground">Importe Crédito:</span> <span className="font-medium">{formatCurrency(formaPago?.importeCredito)}</span></div>
                <div><span className="text-muted-foreground">Tarjeta de Crédito:</span> <span className="font-medium">{formatCurrency(formaPago?.tarjetaCredito)}</span></div>
                <div><span className="text-muted-foreground">Contado:</span> <span className="font-medium">{formatCurrency(formaPago?.contado)}</span></div>
                <div><span className="text-muted-foreground">Transferencia:</span> <span className="font-medium">{formatCurrency(formaPago?.transferencia)}</span></div>
                <div><span className="text-muted-foreground">Cheques:</span> <span className="font-medium">{formatCurrency(formaPago?.cheques)}</span></div>
                <div className="pt-2 border-t border-border">
                  <span className="text-foreground font-semibold">MONTO FINAL:</span>
                  <span className="ml-2 text-lg font-bold text-primary">{formatCurrency(formaPago?.montoFinal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              ¿Está seguro que desea confirmar el pedido?
            </p>
            <div className="flex gap-2">
              <button
                onClick={onEditar}
                className="flex items-center gap-2 h-9 rounded-lg border border-primary bg-primary/10 px-4 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <Edit className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                onClick={onConfirmar}
                disabled={isSubmitting}
                className="flex items-center gap-2 h-9 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {isSubmitting ? 'Guardando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
