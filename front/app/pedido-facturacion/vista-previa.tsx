'use client'

import { X, Download, Edit, Check } from "lucide-react"
import { useState } from "react"
import { guardarPDF } from "@/lib/use-dbf"

interface PedidoData {
  fecha: string
  revendedor: {
    id: number
    nombre: string
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    // Parsear fecha ISO sin que JavaScript la interprete como UTC
    // Esto evita el problema de resta de un día por zona horaria
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('es-AR')
  }

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
    return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
  }

  const handleDescargarPDF = async () => {
    setSavingPDF(true)
    
    try {
      // Generar nombre sugerido para el archivo
      const fecha = new Date().toISOString().split('T')[0]
      const nombreSugerido = codigoExistente 
        ? `Pedido_${codigoExistente}_${fecha}.pdf`
        : `Pedido_Facturacion_${fecha}.pdf`

      // Convertir logo a base64 desde el endpoint directo del backend
      let logoBase64 = ''
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const logoUrl = `${API_BASE}/api/gestion/revendedores/${pedidoData.revendedor.id}/logo/`
        
        const logoResponse = await fetch(logoUrl, { mode: 'cors' })
        if (logoResponse.ok) {
          const blob = await logoResponse.blob()
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
        }
      } catch {
        console.warn("No se pudo cargar el logo del revendedor")
      }

      // Crear contenido HTML para el PDF
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden de Venta - ${codigoExistente || 'Nuevo'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital@0;1&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Open Sans', sans-serif; 
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
            font-size: 35px;
            font-weight: bold;
            margin-bottom: 2px;
            letter-spacing: 1px;
          }
          .header-center p {
            font-size: 12px;
            color: #666;
            margin: 1px 0;
            font-weight: bold;
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
            margin-bottom: 12px;
          }
          .section-title {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #f5f5f5;
            padding: 3px 4px;
            margin-bottom: 6px;
            border-bottom: 1px solid #333;
          }
          .data-row {
            display: flex;
            margin-bottom: 4px;
            align-items: center;
          }
          .label {
            width: 130px;
            font-weight: bold;
            font-size: 13px;
          }
          .value {
            flex: 1;
            font-size: 13px;
            text-align: left;
            padding-left: 10px;
          }
          .value.large {
            font-size: 14px;
            font-weight: 600;
            font-style: italic;
          }
          .top-datos {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0;
            padding-bottom: 8px;
            margin-bottom: 8px;
            border-bottom: 1px solid #ccc;
          }
          .top-datos .data-row {
            flex-direction: column;
            margin-bottom: 0;
          }
          .top-datos > :first-child {
            justify-self: start;
          }
          .top-datos > :nth-child(2) {
            justify-self: center;
          }
          .top-datos > :nth-child(3) {
            justify-self: end;
          }
          .top-datos .label {
            width: auto;
            margin-bottom: 2px;
          }
          .top-datos .value {
            padding-left: 0;
          }
          .horizontal-row {
            display: grid;
            grid-template-columns: 1fr 2.5fr 1fr 1fr;
            gap: 0;
            margin-bottom: 8px;
          }
          .horizontal-row .data-row {
            flex-direction: column;
            margin-bottom: 0;
          }
          .horizontal-row > :first-child {
            justify-self: start;
          }
          .horizontal-row > :nth-child(2) {
            justify-self: center;
          }
          .horizontal-row > :nth-child(3) {
            justify-self: center;
          }
          .horizontal-row > :nth-child(4) {
            justify-self: end;
          }
          .horizontal-row .label {
            width: auto;
            margin-bottom: 2px;
          }
          .horizontal-row .value {
            padding-left: 0;
          }
          .conyuge-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0;
            margin-bottom: 4px;
          }
          .conyuge-row .data-row {
            flex-direction: column;
            margin-bottom: 0;
          }
          .conyuge-row > :first-child {
            justify-self: start;
          }
          .conyuge-row > :nth-child(2) {
            justify-self: center;
          }
          .conyuge-row > :nth-child(3) {
            justify-self: end;
          }
          .conyuge-row .label {
            width: auto;
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 0;
          }
          .conyuge-row .value {
            font-size: 13px;
            text-align: left;
            padding-left: 10px;
          }
          .forma-pago-section {
            margin-top: 20px;
          }
          .forma-pago-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            margin-top: 12px;
          }
          .forma-pago-item {
            border: 1px solid #333;
            padding: 5px;
            text-align: center;
            min-height: 48px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .forma-pago-label {
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .forma-pago-valor {
            font-size: 15px;
            font-weight: bold;
          }
          .firmas {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 50px;
            padding-top: 20px;
          }
          .firmas.sin-conyuge {
            margin-top: 100px;
          }
          .firma-item {
            text-align: center;
          }
          .firma-linea {
            border-top: 1px solid #333;
            margin-bottom: 8px;
            height: 4px;
          }
          .firma-label {
            font-size: 11px;
            font-weight: bold;
          }
          .brixsoftware {
            text-align: right;
            font-size: 8px;
            color: #999;
            margin-top: 8px;
            padding-right: 0;
          }
          .footer {
            margin-top: 8px;
            text-align: center;
            font-size: 8px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 3px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoBase64 ? `<div class="header-logo"><img src="${logoBase64}" alt="Logo" /></div>` : '<div class="header-logo"></div>'}
          <div class="header-center">
            <h1>ORDEN DE VENTA</h1>
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
          <div class="top-datos">
            <div class="data-row"><span class="label">Apellido y Nombre:</span><span class="value large">${datosComprador?.apellidoNombre || '-'}</span></div>
            <div class="data-row"><span class="label">Documento:</span><span class="value large">${datosComprador?.documento || '-'} ${datosComprador?.nroDocumento || '-'}</span></div>
            <div class="data-row"><span class="label">CUIT:</span><span class="value large">${datosComprador?.cuit || '-'}</span></div>
          </div>
          <div class="data-row"><span class="label">Condición IVA:</span><span class="value">${datosComprador?.condicionIvaNombre || '-'}</span></div>
          <div class="data-row"><span class="label">Dirección:</span><span class="value">${datosComprador?.direccion || '-'}</span></div>
          <div class="data-row"><span class="label">Nombre Localidad:</span><span class="value">${datosComprador?.localidadNombre || '-'}</span></div>
          <div class="data-row"><span class="label">Teléfono:</span><span class="value">${datosComprador?.telefono || '-'}</span></div>
          <div class="data-row"><span class="label">Celular:</span><span class="value">${datosComprador?.celular || '-'}</span></div>
          <div class="data-row"><span class="label">Email:</span><span class="value">${datosComprador?.email || '-'}</span></div>
          <div class="data-row"><span class="label">Fecha Nacimiento:</span><span class="value">${formatDate(datosComprador?.fechaNacimiento)}</span></div>
          <div class="data-row"><span class="label">Estado Civil:</span><span class="value">${datosComprador?.estadoCivil || '-'}</span></div>
          <div class="data-row"><span class="label">Ocupación:</span><span class="value">${datosComprador?.ocupacion || '-'}</span></div>
        </div>

        <!-- DATOS DEL VEHÍCULO -->
        <div class="section">
          <div class="section-title">Datos del Vehículo</div>
          <div class="horizontal-row">
            <div class="data-row"><span class="label">Marca:</span><span class="value large">${datosVehiculo?.selectedMoto?.marca || '-'}</span></div>
            <div class="data-row"><span class="label">Modelo:</span><span class="value large">${datosVehiculo?.selectedMoto?.descripcion || '-'}</span></div>
            <div class="data-row"><span class="label">Año:</span><span class="value large">${datosVehiculo?.formData?.modelo || '-'}</span></div>
            <div class="data-row"><span class="label">Color:</span><span class="value large">${datosVehiculo?.selectedMoto?.colorNombre || datosVehiculo?.formData?.color || '-'}</span></div>
          </div>
          <div class="data-row"><span class="label">Nro Chasis:</span><span class="value">${datosVehiculo?.formData?.nroChasis || '-'}</span></div>
          <div class="data-row"><span class="label">Nro Motor:</span><span class="value">${datosVehiculo?.formData?.nroMotor || '-'}</span></div>
          <div class="data-row"><span class="label">Nro Certificado:</span><span class="value">${datosVehiculo?.formData?.nroCertificado || '-'}</span></div>
        </div>

        <!-- FORMA DE PAGO -->
        <div class="section forma-pago-section">
          <div class="section-title">Forma de Pago</div>
          <div class="data-row"><span class="label">Tipo Factura:</span><span class="value">${formaPago?.comNomb || '-'} ${formaPago?.comLetr || '-'}</span></div>
          <div class="data-row"><span class="label">Financiera:</span><span class="value">${formaPago?.financiera || '-'}</span></div>
          <div class="data-row"><span class="label">Nro de Crédito:</span><span class="value">${formaPago?.nroCredito || '-'}</span></div>
          
          <div class="forma-pago-grid">
            <div class="forma-pago-item">
              <div class="forma-pago-label">Importe Crédito</div>
              <div class="forma-pago-valor">${formatCurrency(formaPago?.importeCredito)}</div>
            </div>
            <div class="forma-pago-item">
              <div class="forma-pago-label">T. de Crédito</div>
              <div class="forma-pago-valor">${formatCurrency(formaPago?.tarjetaCredito)}</div>
            </div>
            <div class="forma-pago-item">
              <div class="forma-pago-label">Contado</div>
              <div class="forma-pago-valor">${formatCurrency(formaPago?.contado)}</div>
            </div>
            <div class="forma-pago-item">
              <div class="forma-pago-label">Transferencia</div>
              <div class="forma-pago-valor">${formatCurrency(formaPago?.transferencia)}</div>
            </div>
            <div class="forma-pago-item">
              <div class="forma-pago-label">Cheques</div>
              <div class="forma-pago-valor">${formatCurrency(formaPago?.cheques)}</div>
            </div>
          </div>
        </div>

        <!-- FIRMAS -->
        <div class="firmas ${datosConyuge?.apellidoNombre ? '' : 'sin-conyuge'}">
          <div class="firma-item">
            <div class="firma-linea"></div>
            <div class="firma-label">Firma Vendedor</div>
          </div>
          <div class="firma-item">
            <div class="firma-linea"></div>
            <div class="firma-label">Firma Cliente</div>
          </div>
        </div>

        <div class="brixsoftware">BrixSoftware</div>

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
