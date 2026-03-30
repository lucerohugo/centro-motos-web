'use client'

import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { ROUTES } from "@/lib/routes.config"
import { useStockMotocicletas, useMarcas, useSubrubros } from "@/lib/use-dbf"
import { leerRevendedor, guardarRevendedor } from "../selector-revendedor"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StockMotocicletasPage() {
  const [revendedorId, setRevendedorId] = useState<number>(0)
  const [revendedorDestino, setRevendedorDestino] = useState<number>(0)
  const [nombreRevendedor, setNombreRevendedor] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState<number | null>(null)
  const [subrubroFiltro, setSubrubroFiltro] = useState<number | null>(null)

  // Debounce de búsqueda para no hacer request en cada tecla
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda), 400)
    return () => clearTimeout(timer)
  }, [busqueda])

  useEffect(() => {
    const saved = leerRevendedor()
    if (saved) {
      setRevendedorId(saved.id)
      const destino = Number(saved.destino) || 0
      setRevendedorDestino(destino)
      setNombreRevendedor(saved.nombre)
      
      // Si no tenemos destino válido, obtenerlo del backend
      if (destino === 0 && saved.id > 0) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gestion/revendedores/${saved.id}/`)
          .then(r => r.json())
          .then(data => {
            if (data.rev_dest) {
              const dest = Number(data.rev_dest) || 0
              setRevendedorDestino(dest)
              guardarRevendedor(saved.id, saved.nombre, dest)
            }
          })
          .catch(err => {})
      }
    }
  }, [])

  // Stock filtrado por backend (depósito + búsqueda + marca + subrubro)
  const { stockMotocicletas, loading: stockLoading } = useStockMotocicletas({
    revendedorDestino: revendedorDestino,
    busqueda: busquedaDebounced,
    marcaCodi: marcaFiltro,
    subrubroCodi: subrubroFiltro,
  })

  // Listas de marcas y subrubros desde el backend (filtradas por destino del revendedor)
  const marcasDisponibles = useMarcas(revendedorDestino)
  const subrubrosDisponibles = useSubrubros(revendedorDestino)

  // Stock ya viene filtrado del backend
  const stockFiltrado = stockMotocicletas || []

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader />
        
        <Link
          href={ROUTES.HOME}
          className="mb-4 inline-flex items-center gap-2 h-9 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Volver al menu
        </Link>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Consulta de Stock
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Motocicletas disponibles
          </p>
        </div>

        {/* Revendedor (readonly) */}
        <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">ID Revendedor</label>
              <input 
                type="number"
                value={revendedorId}
                readOnly
                className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Revendedor</label>
              <input 
                type="text"
                value={nombreRevendedor}
                readOnly
                className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            {/* Búsqueda */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">Descripción</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input 
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por descripción, código, chasis, motor..."
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* Marca */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Marca</label>
              <select
                value={marcaFiltro ?? ''}
                onChange={(e) => setMarcaFiltro(e.target.value ? Number(e.target.value) : null)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
              >
                <option value="">TODAS</option>
                {marcasDisponibles.map(m => (
                  <option key={m.mar_codi} value={m.mar_codi}>{m.mar_nomb}</option>
                ))}
              </select>
            </div>

            {/* SubRubro */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">SubRubro</label>
              <select
                value={subrubroFiltro ?? ''}
                onChange={(e) => setSubrubroFiltro(e.target.value ? Number(e.target.value) : null)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
              >
                <option value="">TODOS</option>
                {subrubrosDisponibles.map(s => (
                  <option key={s.sru_codi} value={s.sru_codi}>{s.sru_nomb}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Stock */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Stock de Motocicletas
              </h3>
              <span className="rounded-lg bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground">
                {stockFiltrado.length} registros
              </span>
            </div>
          </div>

          {stockLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando stock...
            </div>
          ) : stockFiltrado.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay motocicletas que coincidan con los filtros
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="text-xs font-semibold">Código</TableHead>
                    <TableHead className="text-xs font-semibold">Descripción</TableHead>
                    <TableHead className="text-xs font-semibold">Marca</TableHead>
                    <TableHead className="text-xs font-semibold">SubRubro</TableHead>
                    <TableHead className="text-xs font-semibold">Color</TableHead>
                    <TableHead className="text-xs font-semibold">Chasis</TableHead>
                    <TableHead className="text-xs font-semibold">Motor</TableHead>
                    <TableHead className="text-xs font-semibold">Certificado</TableHead>
                    <TableHead className="text-xs font-semibold">Modelo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockFiltrado.map((item, idx) => (
                    <TableRow key={idx} className="border-b border-border hover:bg-accent/50">
                      <TableCell className="text-xs font-mono">{item.codigoArticulo}</TableCell>
                      <TableCell className="text-xs">{item.descripcion}</TableCell>
                      <TableCell className="text-xs">{item.marca}</TableCell>
                      <TableCell className="text-xs">{item.subrubro}</TableCell>
                      <TableCell className="text-xs">{item.colorNombre || item.color}</TableCell>
                      <TableCell className="text-xs font-mono">{item.chassis}</TableCell>
                      <TableCell className="text-xs font-mono">{item.motor}</TableCell>
                      <TableCell className="text-xs font-mono">{item.certificado}</TableCell>
                      <TableCell className="text-xs">{item.modelo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-3">
          <Link
            href={ROUTES.HOME}
            className="h-9 flex items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Cerrar
          </Link>
        </div>
      </div>
    </main>
  )
}
