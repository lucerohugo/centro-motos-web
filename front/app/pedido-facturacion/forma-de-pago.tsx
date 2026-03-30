'use client'

import { inputClass } from "@/components/form-section"
import { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { useComprobantes } from "@/lib/use-dbf"

export interface FormaDePagoRef {
  validate: () => boolean
  getData: () => typeof initialFormData
}

// Props para datos iniciales (modo edición)
interface FormaDePagoProps {
  datosIniciales?: {
    POV_FLIS?: string
    POV_PLIS?: number
    POV_FINU?: string
    POV_NUMC?: string
    POV_IMPC?: number
    POV_NOMC?: string
    POV_TARC?: number
    POV_PPAG?: number
    POV_CHEQ?: number
    POV_TRAN?: number
    POV_CONT?: number
    POV_MONF?: number
  } | null
  precioArticulo?: number
}

const initialFormData = {
  tipoFactura: '',
  comCodi: '',
  comNomb: '',
  comLetr: '',
  fechaListaPrecios: '',
  precioLista: '',
  financiera: '',
  nroCredito: '',
  importeCredito: '',
  nombreTitularCredito: '',
  tarjetaCredito: '',
  planPago: '',
  cheques: '',
  transferencia: '',
  contado: '',
  montoFinal: '',
}

const camposNumericos = ['precioLista', 'importeCredito', 'tarjetaCredito', 'planPago', 'cheques', 'transferencia', 'contado', 'montoFinal']

// Función para formatear número como moneda argentina (2.503.750,86)
const formatearMoneda = (valor: number): string => {
  if (valor === 0) return '0,00'
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export const FormaDePago = forwardRef<FormaDePagoRef, FormaDePagoProps>(function FormaDePago({ datosIniciales, precioArticulo }, ref) {
  const [formData, setFormData] = useState(initialFormData)
  const [montoFinalFormateado, setMontoFinalFormateado] = useState('')
  const [precioListaFormateado, setPrecioListaFormateado] = useState('')
  // Estados para campos monetarios formateados
  const [importeCreditoFormateado, setImporteCreditoFormateado] = useState('')
  const [tarjetaCreditoFormateado, setTarjetaCreditoFormateado] = useState('')
  const [planPagoFormateado, setPlanPagoFormateado] = useState('')
  const [chequesFormateado, setChequesFormateado] = useState('')
  const [transferenciaFormateado, setTransferenciaFormateado] = useState('')
  const [contadoFormateado, setContadoFormateado] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [negativos, setNegativos] = useState<string[]>([])
  const { comprobantes } = useComprobantes()

  // Ya NO se usa precioArticulo - precio lista es manual
  // El Monto Final se actualiza automáticamente cuando cambia Precio Lista
  useEffect(() => {
    // No hacemos nada con precioArticulo, precio lista es editable
  }, [precioArticulo])

  // Cargar datos iniciales cuando viene en modo edición
  useEffect(() => {
    if (datosIniciales) {

      // Formatear fecha de YYYYMMDD a YYYY-MM-DD
      let fechaLista = ''
      if (datosIniciales.POV_FLIS) {
        const f = String(datosIniciales.POV_FLIS)
        if (f.length === 8 && !f.includes('-')) {
          fechaLista = `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6, 8)}`
        } else if (f.includes('-')) {
          fechaLista = f
        }
      }

      // Formatear números (evitar 0 como string vacío)
      const formatNum = (n: number | undefined) => {
        if (n === undefined || n === null) return ''
        if (n === 0) return '0'
        return String(n)
      }

      // Función para formatear visualmente con separador de miles
      const formatearVisual = (valor: number | undefined): string => {
        if (!valor || valor === 0) return ''
        const parteEntera = Math.floor(valor)
        const parteDecimal = valor - parteEntera
        const enteroFormateado = String(parteEntera).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        if (parteDecimal > 0) {
          const decimales = Math.round(parteDecimal * 100).toString().padStart(2, '0')
          return enteroFormateado + ',' + decimales
        }
        return enteroFormateado
      }

      const comCodi = datosIniciales.COM_CODI || null
      const comNomb = datosIniciales.COM_NOMB || ''
      const comLetr = datosIniciales.COM_LETR || ''
      
      setFormData({
        tipoFactura: comCodi ? String(comCodi) : '',
        comCodi: comCodi ? String(comCodi) : '',
        comNomb: comNomb,
        comLetr: comLetr,
        fechaListaPrecios: fechaLista,
        precioLista: formatNum(datosIniciales.POV_PLIS),
        financiera: datosIniciales.POV_FINU || '',
        nroCredito: datosIniciales.POV_NUMC || '',
        importeCredito: formatNum(datosIniciales.POV_IMPC),
        nombreTitularCredito: datosIniciales.POV_NOMC || '',
        tarjetaCredito: formatNum(datosIniciales.POV_TARC),
        planPago: formatNum(datosIniciales.POV_PPAG),
        cheques: formatNum(datosIniciales.POV_CHEQ),
        transferencia: formatNum(datosIniciales.POV_TRAN),
        contado: formatNum(datosIniciales.POV_CONT),
        montoFinal: formatNum(datosIniciales.POV_PLIS),
      })
      
      // Formatear campos visuales con separador de miles
      setPrecioListaFormateado(formatearVisual(datosIniciales.POV_PLIS))
      setImporteCreditoFormateado(formatearVisual(datosIniciales.POV_IMPC))
      setTarjetaCreditoFormateado(formatearVisual(datosIniciales.POV_TARC))
      setPlanPagoFormateado(formatearVisual(datosIniciales.POV_PPAG))
      setChequesFormateado(formatearVisual(datosIniciales.POV_CHEQ))
      setTransferenciaFormateado(formatearVisual(datosIniciales.POV_TRAN))
      setContadoFormateado(formatearVisual(datosIniciales.POV_CONT))
      
      // Formatear el monto final para mostrar (siempre, incluso si es 0)
      const montoFinal = datosIniciales.POV_PLIS || datosIniciales.POV_MONF || 0
      if (montoFinal > 0) {
        setMontoFinalFormateado(formatearMoneda(montoFinal))
      }
    }
  }, [datosIniciales])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Si es tipoFactura, buscar los datos del comprobante
    if (name === 'tipoFactura') {
      const comprobante = comprobantes.find(c => String(c.com_codi) === value)
      if (comprobante) {
        setFormData(prev => ({
          ...prev,
          tipoFactura: value,
          comCodi: String(comprobante.com_codi),
          comNomb: comprobante.com_nomb,
          comLetr: comprobante.com_letr,
        }))
      } else {
        setFormData(prev => ({ ...prev, [name]: value }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    setErrors([])
    setNegativos([])
  }

  // Formatear número con separador de miles y coma decimal (1.234.567,89)
  const formatearConMilesYDecimales = (valor: string): string => {
    // Permitir solo números y una coma
    let limpio = valor.replace(/[^\d,]/g, '')
    
    // Solo permitir una coma
    const partes = limpio.split(',')
    if (partes.length > 2) {
      limpio = partes[0] + ',' + partes.slice(1).join('')
    }
    
    // Separar parte entera y decimal
    const [entero, decimal] = limpio.split(',')
    
    // Formatear parte entera con separador de miles
    const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    
    // Limitar decimales a 2
    if (decimal !== undefined) {
      const decimalLimitado = decimal.slice(0, 2)
      return enteroFormateado + ',' + decimalLimitado
    }
    
    return enteroFormateado
  }

  // Handler especial para Precio Lista - actualiza también Monto Final
  const handlePrecioListaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorIngresado = e.target.value
    
    // Formatear visualmente (1.234.567,89)
    const valorFormateado = formatearConMilesYDecimales(valorIngresado)
    setPrecioListaFormateado(valorFormateado)
    
    // Convertir a formato numérico para guardar (reemplazar . por nada y , por .)
    const valorParaGuardar = valorFormateado.replace(/\./g, '').replace(',', '.')
    
    // Guardar valor limpio en formData
    setFormData(prev => ({
      ...prev,
      precioLista: valorParaGuardar,
      montoFinal: valorParaGuardar  // Monto Final = Precio Lista
    }))
    
    // Actualizar formateado para Monto Final
    const valorNumerico = parseFloat(valorParaGuardar) || 0
    if (valorNumerico > 0) {
      setMontoFinalFormateado(formatearMoneda(valorNumerico))
    } else {
      setMontoFinalFormateado('')
    }
    
    setErrors([])
    setNegativos([])
  }

  // Handler genérico para campos monetarios con formato de miles
  const handleMonetarioChange = (
    campo: 'importeCredito' | 'tarjetaCredito' | 'planPago' | 'cheques' | 'transferencia' | 'contado',
    setterFormateado: React.Dispatch<React.SetStateAction<string>>
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorIngresado = e.target.value
    
    // Formatear visualmente (1.234.567,89)
    const valorFormateado = formatearConMilesYDecimales(valorIngresado)
    setterFormateado(valorFormateado)
    
    // Convertir a formato numérico para guardar
    const valorParaGuardar = valorFormateado.replace(/\./g, '').replace(',', '.')
    
    // Guardar valor limpio en formData
    setFormData(prev => ({
      ...prev,
      [campo]: valorParaGuardar
    }))
    
    setErrors([])
    setNegativos([])
  }

  // Manejar Enter como Tab (todos los campos son opcionales)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = (e.target as HTMLElement).closest('form') || document.body
      const inputs = Array.from(form.querySelectorAll('input:not([readonly]), select, textarea')) as HTMLElement[]
      const currentIndex = inputs.indexOf(e.target as HTMLElement)
      if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus()
      }
    }
  }

  // Handler para campos que solo aceptan letras y espacios
  const handleChangeSoloLetras = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Solo permite letras (incluyendo acentos) y espacios
    const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
    setFormData(prev => ({ ...prev, [name]: soloLetras }))
    setErrors([])
    setNegativos([])
  }

  const validate = (): boolean => {
    const newNegativos: string[] = []
    
    const fieldLabels: Record<string, string> = {
      precioLista: 'Precio de Lista',
      importeCredito: 'Importe Crédito',
      tarjetaCredito: 'Tarjeta de Crédito',
      planPago: 'Plan de Pago',
      cheques: 'Cheques',
      transferencia: 'Transferencia',
      contado: 'Contado',
      montoFinal: 'Monto Final',
    }
    
    // Solo validar que los valores numéricos no sean negativos (si tienen valor)
    camposNumericos.forEach(campo => {
      const valor = parseFloat(formData[campo as keyof typeof formData])
      if (!isNaN(valor) && valor < 0) {
        newNegativos.push(fieldLabels[campo])
      }
    })
    
    setErrors([])
    setNegativos(newNegativos)
    return newNegativos.length === 0
  }

  const getData = () => formData

  useImperativeHandle(ref, () => ({
    validate,
    getData
  }))

  const inputErrorClass = (field: string) => {
    const fieldLabels: Record<string, string> = {
      tipoFactura: 'Tipo de Factura',
      fechaListaPrecios: 'Fecha Lista de Precios',
      precioLista: 'Precio de Lista',
      financiera: 'Financiera',
      nroCredito: 'Nro de Crédito',
      importeCredito: 'Importe Crédito',
      nombreTitularCredito: 'Nombre Titular Crédito',
      tarjetaCredito: 'Tarjeta de Crédito',
      planPago: 'Plan de Pago',
      cheques: 'Cheques',
      transferencia: 'Transferencia',
      contado: 'Contado',
      montoFinal: 'Monto Final',
    }
    const hasError = errors.includes(fieldLabels[field]) || negativos.includes(fieldLabels[field])
    return hasError ? `${inputClass} border-red-500` : inputClass
  }

  return (
    <div className={`rounded-lg border bg-card px-4 py-3 ${(errors.length > 0 || negativos.length > 0) ? 'border-red-500' : 'border-border'}`}>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Forma De Pago</h3>
      
      {errors.length > 0 && (
        <div className="mb-2 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700">
           Campos obligatorios vacíos: {errors.join(', ')}
        </div>
      )}
      
      {negativos.length > 0 && (
        <div className="mb-2 p-2 rounded bg-orange-50 border border-orange-200 text-xs text-orange-700">
           No se permiten valores negativos: {negativos.join(', ')}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-x-2.5 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Tipo de Factura</label>
          <select name="tipoFactura" value={formData.tipoFactura} onChange={handleChange} onKeyDown={handleKeyDown} className={inputErrorClass('tipoFactura')}>
            <option value="">-- Seleccionar --</option>
            {comprobantes.map(comp => (
              <option key={comp.com_codi} value={comp.com_codi}>
                {comp.com_abre} {comp.com_letr} - {comp.com_nomb}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Fecha Lista de precios</label>
          <input type="date" name="fechaListaPrecios" value={formData.fechaListaPrecios} onChange={handleChange} onKeyDown={handleKeyDown} className={inputErrorClass('fechaListaPrecios')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Precio de Lista</label>
          <input 
            type="text"
            inputMode="numeric"
            name="precioLista" 
            value={precioListaFormateado} 
            onChange={handlePrecioListaChange}
            onKeyDown={handleKeyDown}
            className={inputErrorClass('precioLista')} 
            placeholder="Ingrese precio"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Financiera Utilizada</label>
          <input type="text" name="financiera" value={formData.financiera} onChange={handleChangeSoloLetras} onKeyDown={handleKeyDown} className={inputErrorClass('financiera')}  />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nro de Crédito</label>
          <input type="text" name="nroCredito" value={formData.nroCredito} onChange={handleChange} onKeyDown={handleKeyDown} className={inputErrorClass('nroCredito')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Importe Crédito</label>
          <input type="text" inputMode="numeric" name="importeCredito" value={importeCreditoFormateado} onChange={handleMonetarioChange('importeCredito', setImporteCreditoFormateado)} onKeyDown={handleKeyDown} className={inputErrorClass('importeCredito')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nombre Titular Crédito</label>
          <input type="text" name="nombreTitularCredito" value={formData.nombreTitularCredito} onChange={handleChangeSoloLetras} onKeyDown={handleKeyDown} className={inputErrorClass('nombreTitularCredito')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Tarjeta de Crédito</label>
          <input type="text" inputMode="numeric" name="tarjetaCredito" value={tarjetaCreditoFormateado} onChange={handleMonetarioChange('tarjetaCredito', setTarjetaCreditoFormateado)} onKeyDown={handleKeyDown} placeholder="Importe" className={inputErrorClass('tarjetaCredito')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Plan de Pago</label>
          <input type="text" inputMode="numeric" name="planPago" value={planPagoFormateado} onChange={handleMonetarioChange('planPago', setPlanPagoFormateado)} onKeyDown={handleKeyDown} className={inputErrorClass('planPago')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Cheques</label>
          <input type="text" inputMode="numeric" name="cheques" value={chequesFormateado} onChange={handleMonetarioChange('cheques', setChequesFormateado)} onKeyDown={handleKeyDown} className={inputErrorClass('cheques')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Transferencia</label>
          <input type="text" inputMode="numeric" name="transferencia" value={transferenciaFormateado} onChange={handleMonetarioChange('transferencia', setTransferenciaFormateado)} onKeyDown={handleKeyDown} className={inputErrorClass('transferencia')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Contado</label>
          <input type="text" inputMode="numeric" name="contado" value={contadoFormateado} onChange={handleMonetarioChange('contado', setContadoFormateado)} onKeyDown={handleKeyDown} className={inputErrorClass('contado')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Monto Final</label>
          <input 
            type="text" 
            name="montoFinal" 
            value={montoFinalFormateado} 
            readOnly 
            className={`${inputErrorClass('montoFinal')} bg-muted cursor-not-allowed font-semibold text-right`} 
          />
        </div>
      </div>
    </div>
  )
})
