'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface VarianteInfo {
  revendedor: string
  cantidad: number
  precio: number
}

interface MotoData {
  id: string
  descripcion: string
  marca: string
  subRubro: string
}

function MotoDetalleContent() {
  const searchParams = useSearchParams()
  const motoId = searchParams.get('id')
  
  const [moto, setMoto] = useState<MotoData | null>(null)
  const [variantes, setVariantes] = useState<VarianteInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!motoId) {
      setLoading(false)
      return
    }

    // TODO: Conectar con GeneXus para obtener datos de la moto
    // const response = await fetch(`/api/motos/${motoId}`)
    // const data = await response.json()

    setLoading(false)
  }, [motoId])

  // Actualizar título de la ventana
  useEffect(() => {
    if (moto) {
      document.title = moto.descripcion
    }
  }, [moto])

  if (loading) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Cargando...</p>
      </div>
    )
  }

  if (!moto) {
    return (
      <div className="w-full h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-foreground text-center">No se encontró la motocicleta</p>
        <p className="text-muted-foreground text-sm">ID: {motoId || 'No especificado'}</p>
        <button 
          onClick={() => window.close()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
        >
          Cerrar
        </button>
      </div>
    )
  }

  const totalStock = variantes.reduce((sum, v) => sum + v.cantidad, 0)

  return (
    <div className="w-full min-h-screen p-5">
      <div className="space-y-4">
        {/* Header con nombre de la moto */}
        <div className="border-b border-border pb-3">
          <h1 className="text-xl font-bold text-foreground">{moto.descripcion}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-muted-foreground">
              Marca: <span className="font-medium text-foreground">{moto.marca}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              Sub Rubro: <span className="font-medium text-foreground">{moto.subRubro}</span>
            </span>
          </div>
        </div>

        {/* Resumen */}
        {totalStock > 0 && (
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="text-sm text-foreground">
              Stock total disponible: <span className="font-bold text-primary">{totalStock} unidades</span>
            </p>
          </div>
        )}

        {/* Tabla de variantes por revendedor */}
        {variantes.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">Disponibilidad por Revendedor</h2>
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-accent">
                  <th className="px-3 py-2 text-left font-medium text-foreground">Revendedor</th>
                  <th className="px-3 py-2 text-right font-medium text-foreground">Cantidad</th>
                  <th className="px-3 py-2 text-right font-medium text-foreground">Precio</th>
                </tr>
              </thead>
              <tbody>
                {variantes.map((variante, idx) => (
                  <tr key={idx} className="border-t border-border hover:bg-accent/30">
                    <td className="px-3 py-2 text-foreground">{variante.revendedor}</td>
                    <td className="px-3 py-2 text-right font-semibold text-foreground">{variante.cantidad}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      ${variante.precio.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Botón cerrar */}
        <button
          onClick={() => window.close()}
          className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Cerrar ventana
        </button>
      </div>
    </div>
  )
}

export default function MotoDetallePage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Cargando...</p>
      </div>
    }>
      <MotoDetalleContent />
    </Suspense>
  )
}
